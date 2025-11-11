import { NextRequest, NextResponse } from 'next/server';
import { sbServer } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth-middleware';
import { z } from 'zod';

// GET /api/notifications - Fetch user's notifications
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const supabase = await sbServer();
    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get('unread') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('Notification')
      .select('*')
      .eq('userId', user.id)
      .order('createdAt', { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq('read', false);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('Error in GET /api/notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/notifications - Create a notification (internal use)
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const body = await req.json();
    
    const schema = z.object({
      userId: z.number(),
      type: z.enum(['message', 'rsvp', 'listing_sold', 'listing_interest', 'event_update']),
      title: z.string().min(1),
      message: z.string().min(1),
      relatedId: z.string().optional(),
      relatedType: z.enum(['message', 'event', 'listing', 'conversation']).optional(),
    });

    const validated = schema.parse(body);

    const supabase = await sbServer();
    const { data: notification, error } = await supabase
      .from('Notification')
      .insert({
        ...validated,
        read: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
    }

    return NextResponse.json({ notification }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/notifications:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid notification data', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/notifications - Mark notifications as read
export async function PATCH(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const body = await req.json();
    const notificationIdSchema = z
      .union([z.string(), z.number()])
      .transform((value) => Number(value))
      .pipe(z.number().int().nonnegative());

    const schema = z.object({
      notificationIds: z.array(notificationIdSchema).optional(),
      markAllAsRead: z.boolean().optional(),
    });

    const { notificationIds, markAllAsRead } = schema.parse(body);

    const supabase = await sbServer();

    if (markAllAsRead) {
      // Mark all user's notifications as read
      const { error } = await supabase
        .from('Notification')
        .update({ read: true, updatedAt: new Date().toISOString() })
        .eq('userId', user.id)
        .eq('read', false);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'All notifications marked as read' });
    }

    if (notificationIds && notificationIds.length > 0) {
      // Mark specific notifications as read
      const { error } = await supabase
        .from('Notification')
        .update({ read: true, updatedAt: new Date().toISOString() })
        .in('id', notificationIds)
        .eq('userId', user.id);

      if (error) {
        console.error('Error marking notifications as read:', error);
        return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: `${notificationIds.length} notification(s) marked as read` });
    }

    return NextResponse.json({ error: 'Must provide notificationIds or markAllAsRead' }, { status: 400 });
  } catch (error) {
    console.error('Error in PATCH /api/notifications:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
