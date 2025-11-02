import { NextRequest, NextResponse } from "next/server"
import { sbServer } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth-middleware"
import { rateLimit, RateLimits, getRateLimitIdentifier } from "@/lib/rate-limit"

// GET /api/messages - Fetch all conversations for current user
export async function GET(req: NextRequest) {
  try {
    // Authentication
    const authResult = await requireAuth(req)
    if (authResult instanceof NextResponse) return authResult
    const { user } = authResult

    // Rate limiting
    const rateLimitIdentifier = getRateLimitIdentifier(req, "messages:conversations", user.id)
    const rateLimitResponse = rateLimit(rateLimitIdentifier, RateLimits.MODERATE)
    if (rateLimitResponse) return rateLimitResponse

    const supabase = await sbServer()
    // Get all conversations where user is either user1 or user2
    const { data: conversations, error } = await supabase
      .from('Conversation')
      .select(`
        *,
        user1:Profile!Conversation_user1Id_fkey(id, name, avatarUrl),
        user2:Profile!Conversation_user2Id_fkey(id, name, avatarUrl),
        messages:Message(content, createdAt, isRead, senderId)
      `)
      .or(`user1Id.eq.${user.id},user2Id.eq.${user.id}`)
      .order('updatedAt', { ascending: false })

    if (error) {
      console.error("GET /api/messages error:", error)
      return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 })
    }

    // Transform conversations to show the "other" user and unread count
    const conversationsWithDetails = await Promise.all(
      (conversations || []).map(async (conv: any) => {
        const otherUser = conv.user1Id === user.id ? conv.user2 : conv.user1
        const messages = conv.messages || []
        const lastMessage = messages.sort((a: any, b: any) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0]
        
        // Count unread messages for current user
        const { count: unreadCount } = await supabase
          .from('Message')
          .select('id', { count: 'exact', head: true })
          .eq('conversationId', conv.id)
          .eq('receiverId', user.id)
          .eq('isRead', false)

        return {
          id: conv.id,
          otherUser,
          lastMessage,
          unreadCount: unreadCount || 0,
          updatedAt: conv.updatedAt
        }
      })
    )

    return NextResponse.json({ data: conversationsWithDetails })
  } catch (err: any) {
    console.error("GET /api/messages error:", err)
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 })
  }
}

// POST /api/messages - Create a new conversation or get existing one
export async function POST(req: NextRequest) {
  try {
    // Authentication
    const authResult = await requireAuth(req)
    if (authResult instanceof NextResponse) return authResult
    const { user } = authResult

    // Rate limiting
    const rateLimitIdentifier = getRateLimitIdentifier(req, "messages:create-conversation", user.id)
    const rateLimitResponse = rateLimit(rateLimitIdentifier, RateLimits.MODERATE)
    if (rateLimitResponse) return rateLimitResponse

    const { otherUserId } = await req.json()
    
    if (!otherUserId || typeof otherUserId !== 'number' || otherUserId === user.id) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }

    const supabase = await sbServer()
    // Check if conversation already exists (either direction)
    const { data: existingConversations, error: findError } = await supabase
      .from('Conversation')
      .select('*')
      .or(`and(user1Id.eq.${user.id},user2Id.eq.${otherUserId}),and(user1Id.eq.${otherUserId},user2Id.eq.${user.id})`)
      .limit(1)

    if (findError) {
      console.error("Find conversation error:", findError)
      return NextResponse.json({ error: "Failed to find conversation" }, { status: 500 })
    }

    let conversation = existingConversations?.[0]

    // If not, create new conversation
    if (!conversation) {
      const { data: newConv, error: createError } = await supabase
        .from('Conversation')
        .insert({
          user1Id: Math.min(user.id, otherUserId),
          user2Id: Math.max(user.id, otherUserId)
        })
        .select()
        .single()

      if (createError || !newConv) {
        console.error("Create conversation error:", createError)
        return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 })
      }

      conversation = newConv
    }

    return NextResponse.json({ data: conversation })
  } catch (err: any) {
    console.error("POST /api/messages error:", err)
    return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 })
  }
}
