import { NextRequest, NextResponse } from 'next/server';
import { sbServer } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth-middleware';

// DELETE /api/notifications/[id] - Delete a specific notification
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const { id } = await context.params;
    const notificationId = parseInt(id);
    
    if (isNaN(notificationId)) {
      return NextResponse.json({ error: 'Invalid notification ID' }, { status: 400 });
    }

    const supabase = await sbServer();
    
    // Delete only if it belongs to the current user
    const { error } = await supabase
      .from('Notification')
      .delete()
      .eq('id', notificationId)
      .eq('userId', user.id);

    if (error) {
      console.error('Error deleting notification:', error);
      return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/notifications/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
