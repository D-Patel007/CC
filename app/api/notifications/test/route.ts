import { NextRequest, NextResponse } from 'next/server';
import { sbServer } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth-middleware';

// POST /api/notifications/test - Create a test notification
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const supabase = await sbServer();
    
    // Get the user's profile to get their numeric ID
    const { data: profile, error: profileError } = await supabase
      .from('Profile')
      .select('id')
  .eq('supabaseId', user.supabaseId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Create a test notification
    const { data: notification, error } = await supabase
      .from('Notification')
      .insert({
        userId: profile.id,
        type: 'message',
        title: '🧪 Test Notification',
        message: `This is a test notification created at ${new Date().toLocaleTimeString()}`,
        read: false,
        relatedType: 'message',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating test notification:', error);
      return NextResponse.json({ error: 'Failed to create test notification', details: error }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Test notification created! Check your notification bell.',
      notification 
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/notifications/test:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
