import { sbServer } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

interface CreateNotificationParams {
  userId: number;
  type: 'message' | 'rsvp' | 'listing_sold' | 'listing_interest' | 'event_update';
  title: string;
  message: string;
  relatedId?: string;
  relatedType?: 'message' | 'event' | 'listing' | 'conversation';
}

/**
 * Helper function to create a notification for a user
 * Uses service role to bypass RLS since we're creating notifications for other users
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    console.log('🔔 createNotification called with params:', {
      userId: params.userId,
      type: params.type,
      title: params.title,
    });
    
    // Use service role client to bypass RLS
    // We need this because we're creating notifications for OTHER users
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    const now = new Date().toISOString();

    const notificationData = {
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      relatedId: params.relatedId,
      relatedType: params.relatedType,
      read: false,
      createdAt: now,
      updatedAt: now,
    };
    
    console.log('📝 Inserting notification into database:', notificationData);

    const { data, error } = await supabase
      .from('Notification')
      .insert(notificationData)
      .select()
      .single();

    if (error) {
      console.error('❌ Database error creating notification:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      return { error };
    }

    console.log('✅ Notification created in database:', data);
    return { data };
  } catch (error) {
    console.error('❌ Unexpected error in createNotification:', error);
    return { error };
  }
}

/**
 * Send a notification when a new message is sent
 */
export async function notifyNewMessage(
  recipientId: number,
  senderName: string,
  messagePreview: string,
  conversationId: string
) {
  console.log('📬 Creating in-app notification:', {
    recipientId,
    senderName,
    messagePreview: messagePreview.substring(0, 50),
    conversationId
  });
  
  const result = await createNotification({
    userId: recipientId,
    type: 'message',
    title: `New message from ${senderName}`,
    message: messagePreview.substring(0, 100),
    relatedId: conversationId,
    relatedType: 'conversation',
  });
  
  if (result.error) {
    console.error('❌ Failed to create notification:', result.error);
  } else {
    console.log('✅ Notification created successfully:', result.data?.id);
  }
  
  return result;
}

/**
 * Send a notification when someone RSVPs to an event
 */
export async function notifyEventRSVP(
  organizerId: number,
  userName: string,
  eventTitle: string,
  eventId: string
) {
  await createNotification({
    userId: organizerId,
    type: 'rsvp',
    title: `New RSVP for ${eventTitle}`,
    message: `${userName} has RSVP'd to your event`,
    relatedId: eventId,
    relatedType: 'event',
  });
}

/**
 * Send a notification for listing interest/sale
 */
export async function notifyListingInterest(
  sellerId: number,
  buyerName: string,
  listingTitle: string,
  listingId: string
) {
  await createNotification({
    userId: sellerId,
    type: 'listing_interest',
    title: `Interest in "${listingTitle}"`,
    message: `${buyerName} is interested in your listing`,
    relatedId: listingId,
    relatedType: 'listing',
  });
}

/**
 * Send a notification when an event is updated
 */
export async function notifyEventUpdate(
  attendeeId: number,
  eventTitle: string,
  eventId: string
) {
  await createNotification({
    userId: attendeeId,
    type: 'event_update',
    title: `Event Updated: ${eventTitle}`,
    message: `An event you're attending has been updated`,
    relatedId: eventId,
    relatedType: 'event',
  });
}
