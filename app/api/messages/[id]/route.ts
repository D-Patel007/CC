import { NextRequest, NextResponse } from "next/server"
import { sbServer } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth-middleware"
import { canAccessConversation, canModifyMessage, assertAccess, assertOwnership, AuthorizationError } from "@/lib/authorization"
import { validateRequest, createMessageSchema } from "@/lib/validation-schemas"
import { rateLimit, RateLimits, getRateLimitIdentifier } from "@/lib/rate-limit"
import { notifyNewMessage } from "@/lib/notifications"
import { moderateText, shouldAutoReject } from "@/lib/moderation"
import { sendNewMessageNotification } from "@/lib/email"
import { createClient } from '@supabase/supabase-js'

// GET /api/messages/[id] - Get all messages in a conversation
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication
    const authResult = await requireAuth(req)
    if (authResult instanceof NextResponse) return authResult
    const { user } = authResult

    // Rate limiting
    const rateLimitIdentifier = getRateLimitIdentifier(req, "messages:read", user.id)
    const rateLimitResponse = rateLimit(rateLimitIdentifier, RateLimits.MODERATE)
    if (rateLimitResponse) return rateLimitResponse

    const { id } = await context.params
    const conversationId = parseInt(id)
    if (isNaN(conversationId)) {
      return NextResponse.json({ error: "Invalid conversation ID" }, { status: 400 })
    }

    // Authorization - verify user can access this conversation
  const canAccess = await canAccessConversation(user.id, conversationId)
    await assertAccess(canAccess)
    
    const supabase = await sbServer()
    // Verify user is part of this conversation
    const { data: conversation, error: convError } = await supabase
      .from('Conversation')
      .select(`
        *,
        user1:Profile!Conversation_user1Id_fkey(id, name, avatarUrl),
        user2:Profile!Conversation_user2Id_fkey(id, name, avatarUrl)
      `)
      .eq('id', conversationId)
      .or(`user1Id.eq.${user.id},user2Id.eq.${user.id}`)
      .single()

    if (convError || !conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    // Get all messages
    const { data: messages, error: messagesError } = await supabase
      .from('Message')
      .select(`
        *,
        sender:Profile!Message_senderId_fkey(id, name, avatarUrl)
      `)
      .eq('conversationId', conversationId)
      .order('createdAt', { ascending: true })

    if (messagesError) {
      console.error("GET messages error:", messagesError)
      return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
    }

    // Mark messages as read if they were sent to current user
    await supabase
      .from('Message')
      .update({ isRead: true })
      .eq('conversationId', conversationId)
      .eq('receiverId', user.id)
      .eq('isRead', false)

    const otherUser = conversation.user1Id === user.id ? conversation.user2 : conversation.user1

    return NextResponse.json({ 
      data: {
        conversation: {
          id: conversation.id,
          otherUser
        },
        messages: messages || []
      }
    })
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: 'You do not have access to this conversation' }, { status: 403 })
    }
    console.error("GET /api/messages/[id] error:", error)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}

// POST /api/messages/[id] - Send a message in a conversation
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication
    const authResult = await requireAuth(req)
    if (authResult instanceof NextResponse) return authResult
    const { user } = authResult

    const { id } = await context.params
    const conversationId = parseInt(id)
    if (isNaN(conversationId)) {
      return NextResponse.json({ error: "Invalid conversation ID" }, { status: 400 })
    }

    // Rate limiting - strict for message sending
    const rateLimitIdentifier = getRateLimitIdentifier(req, "messages:send", user.id)
    const rateLimitResponse = rateLimit(rateLimitIdentifier, RateLimits.STRICT)
    if (rateLimitResponse) return rateLimitResponse

    // Authorization - verify user can access this conversation
    const canAccess = await canAccessConversation(user.id, conversationId)
    await assertAccess(canAccess)

    // Validation
    const validation = await validateRequest(req, createMessageSchema)
    if ('error' in validation) {
      return NextResponse.json(
        { error: validation.error, details: validation.details },
        { status: 400 }
      )
    }

    const { content, messageType, mediaUrl } = validation.data

    // 🛡️ MESSAGE MODERATION (only for text messages)
    if (messageType === 'TEXT' && content) {
      const moderation = moderateText(content);
      
      if (shouldAutoReject(moderation)) {
        console.log('❌ Message rejected - inappropriate content:', moderation);
        return NextResponse.json({
          error: 'Your message contains inappropriate or spam content',
          reasons: moderation.reasons,
        }, { status: 400 });
      }
      
      // Log warnings for flagged content
      if (moderation.flags.length > 0) {
        console.log('⚠️ Message flagged:', {
          userId: user.id,
          conversationId,
          flags: moderation.flags,
        });
      }
    }

    const supabase = await sbServer()
    // Verify user is part of this conversation
    const { data: conversation, error: convError } = await supabase
      .from('Conversation')
      .select('*')
      .eq('id', conversationId)
      .or(`user1Id.eq.${user.id},user2Id.eq.${user.id}`)
      .single()

    if (convError || !conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    // Determine receiver (the other user in the conversation)
    const receiverId = conversation.user1Id === user.id 
      ? conversation.user2Id 
      : conversation.user1Id

    // Create message
    const { data: message, error: msgError } = await supabase
      .from('Message')
      .insert({
        conversationId,
        senderId: user.id,
        receiverId,
        content: content || '',
        messageType: messageType as any,
        mediaUrl: mediaUrl || null
      })
      .select(`
        *,
        sender:Profile!Message_senderId_fkey(id, name, avatarUrl)
      `)
      .single()

    if (msgError || !message) {
      console.error("Create message error:", msgError)
      return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
    }

    // Update conversation updatedAt
    await supabase
      .from('Conversation')
      .update({ updatedAt: new Date().toISOString() })
      .eq('id', conversationId)

    // Send notification to recipient
    const { data: senderProfile } = await supabase
      .from('Profile')
      .select('name')
      .eq('id', user.id)
      .single();
    
    if (senderProfile) {
      // In-app notification
      await notifyNewMessage(
        receiverId,
        senderProfile.name || 'Someone',
        content || 'Sent a message',
        conversationId.toString()
      );
    }

    // Send email notification to recipient
    if (senderProfile) {
      try {
        console.log('🔍 Attempting to send email notification...');
        
        // First get recipient's profile with supabaseId
        const { data: recipientProfile, error: profileError } = await supabase
          .from('Profile')
          .select('name, supabaseId, emailNotifications, emailNewMessages')
          .eq('id', receiverId)
          .single();

        if (profileError) {
          console.error('❌ Failed to get recipient profile:', profileError);
          console.log('💡 TIP: Did you run the supabase-email-preferences.sql migration?');
          throw profileError;
        }

        if (!recipientProfile?.supabaseId) {
          console.log('⚠️ Recipient has no supabaseId, skipping email');
          throw new Error('No supabaseId found for recipient');
        }

        // Create admin client with service role key to access auth.admin API
        const supabaseAdmin = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false
            }
          }
        );

        // Now fetch auth user using supabaseId (UUID) with admin client
        const { data: recipientAuth, error: authError } = await supabaseAdmin.auth.admin.getUserById(
          recipientProfile.supabaseId
        );
        
        if (authError) {
          console.error('❌ Failed to get recipient auth:', authError);
          throw authError;
        }

        console.log('📧 Email check:', {
          hasEmail: !!recipientAuth?.user?.email,
          email: recipientAuth?.user?.email,
          hasProfile: !!recipientProfile,
          profileName: recipientProfile?.name,
          emailNotifications: recipientProfile?.emailNotifications,
          emailNewMessages: recipientProfile?.emailNewMessages
        });

        // Check if recipient wants email notifications
        if (recipientAuth?.user?.email && recipientProfile &&
            recipientProfile.emailNotifications !== false &&
            recipientProfile.emailNewMessages !== false) {
          console.log('✅ Conditions met, sending email to:', recipientAuth.user.email);
          // For now, get listing context if available (optional enhancement for later)
          const messagePreview = content 
            ? (content.length > 100 ? content.substring(0, 100) + '...' : content)
            : messageType === 'PHOTO' 
            ? '📷 Photo' 
            : messageType === 'VOICE' 
            ? '🎤 Voice message' 
            : 'New message';

          await sendNewMessageNotification({
            recipientEmail: recipientAuth.user.email,
            recipientName: recipientProfile.name || 'there',
            senderName: senderProfile.name,
            listingTitle: '', // Could fetch related listing if needed
            messagePreview,
            conversationUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/messages?conversation=${conversationId}`
          });
          
          console.log('✅ Email sent successfully to:', recipientAuth.user.email);
        } else {
          console.log('ℹ️ Email not sent. Reason:', {
            noEmail: !recipientAuth?.user?.email,
            noProfile: !recipientProfile,
            notificationsDisabled: recipientProfile?.emailNotifications === false,
            newMessagesDisabled: recipientProfile?.emailNewMessages === false
          });
        }
      } catch (emailError) {
        // Don't fail the request if email fails
        console.error('❌ Failed to send email notification:', emailError);
        if (emailError instanceof Error) {
          console.error('Error details:', emailError.message);
        }
      }
    }

    // Broadcast the new message to all clients listening to this conversation
    // Note: In production, you'd use Supabase Realtime or a message queue
    // For now, clients will poll for updates

    return NextResponse.json({ data: message }, { status: 201 })
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: 'You do not have access to this conversation' }, { status: 403 })
    }
    console.error("POST /api/messages/[id] error:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}

// DELETE /api/messages/[id] - Delete/unsend a message
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication
    const authResult = await requireAuth(req)
    if (authResult instanceof NextResponse) return authResult
    const { user } = authResult

    const { id } = await context.params
    const messageId = parseInt(id)
    if (isNaN(messageId)) {
      return NextResponse.json({ error: "Invalid message ID" }, { status: 400 })
    }

    // Rate limiting
    const rateLimitIdentifier = getRateLimitIdentifier(req, "messages:delete", user.id)
    const rateLimitResponse = rateLimit(rateLimitIdentifier, RateLimits.STRICT)
    if (rateLimitResponse) return rateLimitResponse

    // Authorization - verify ownership
    const canModify = await canModifyMessage(user.id, messageId)
    await assertOwnership(canModify)

    // Delete the message
    const supabase = await sbServer()
    const { error } = await supabase
      .from('Message')
      .delete()
      .eq('id', messageId)

    if (error) {
      console.error("DELETE message error:", error)
      return NextResponse.json({ error: "Failed to delete message" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: 'You can only delete your own messages' }, { status: 403 })
    }
    console.error("DELETE /api/messages/[id] error:", error)
    return NextResponse.json({ error: "Failed to delete message" }, { status: 500 })
  }
}
