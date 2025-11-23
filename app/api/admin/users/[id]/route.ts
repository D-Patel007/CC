import { NextRequest, NextResponse } from 'next/server';
import { sbServer } from '@/lib/supabase/server';
import { requireFullAdmin, logAdminAction } from '@/lib/admin-middleware';

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireFullAdmin(req);
    if (authResult instanceof NextResponse) return authResult;
    const { admin } = authResult;

    const { id } = await context.params;
    const targetId = Number(id);
    if (!Number.isInteger(targetId) || targetId <= 0) {
      return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });
    }

    const body = await req.json();
    const requestedRole = body.role as 'admin' | 'user' | 'moderator' | undefined;
    const requestedStatus = body.status as 'active' | 'suspended' | undefined;
    const suspensionReason = body.suspensionReason as string | undefined;

    if (!requestedRole && !requestedStatus) {
      return NextResponse.json(
        { error: 'Provide role or status to update' },
        { status: 400 }
      );
    }

    if (
      requestedRole &&
      requestedRole !== 'admin' &&
      requestedRole !== 'user' &&
      requestedRole !== 'moderator'
    ) {
      return NextResponse.json(
        { error: 'Invalid role. Use admin, moderator, or user.' },
        { status: 400 }
      );
    }

    if (
      requestedStatus &&
      requestedStatus !== 'active' &&
      requestedStatus !== 'suspended'
    ) {
      return NextResponse.json(
        { error: 'Invalid status. Use active or suspended.' },
        { status: 400 }
      );
    }

    const supabase = await sbServer();

    const { data: existingUser, error: fetchError } = await supabase
      .from('Profile')
      .select('id, name, role, isSuspended, isAdmin')
      .eq('id', targetId)
      .single();

    if (fetchError || !existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (existingUser.id === admin.id) {
      if (requestedRole && requestedRole !== 'admin') {
        return NextResponse.json(
          { error: 'You cannot change your own role.' },
          { status: 400 }
        );
      }
      if (requestedStatus === 'suspended') {
        return NextResponse.json(
          { error: 'You cannot suspend your own account.' },
          { status: 400 }
        );
      }
    }

    const updates: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    let roleChanged = false;
    let suspensionChanged = false;

    if (requestedRole && requestedRole !== existingUser.role) {
      updates.role = requestedRole;
      updates.isAdmin = requestedRole === 'admin';
      roleChanged = true;
    }

    if (requestedStatus) {
      const shouldSuspend = requestedStatus === 'suspended';
      if (shouldSuspend !== existingUser.isSuspended) {
        updates.isSuspended = shouldSuspend;
        updates.suspensionReason = shouldSuspend
          ? suspensionReason || 'Suspended by admin'
          : null;
        updates.suspendedUntil = null;
        suspensionChanged = true;
      }
    }

    if (!roleChanged && !suspensionChanged) {
      return NextResponse.json({
        data: {
          id: existingUser.id,
          role: existingUser.role,
          isSuspended: existingUser.isSuspended,
          isAdmin: existingUser.isAdmin,
        },
        message: 'No changes applied',
      });
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from('Profile')
      .update(updates)
      .eq('id', targetId)
      .select('id, name, role, isSuspended, isAdmin, suspensionReason')
      .single();

    if (updateError || !updatedUser) {
      console.error('Failed to update admin user:', updateError);
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }

    if (roleChanged) {
      await logAdminAction(
        admin.id,
        requestedRole === 'admin' ? 'promoted_admin' : 'updated_role',
        'Profile',
        updatedUser.id,
        {
          previousRole: existingUser.role,
          newRole: requestedRole,
        }
      );
    }

    if (suspensionChanged) {
      await logAdminAction(
        admin.id,
        updatedUser.isSuspended ? 'suspended_user' : 'unsuspended_user',
        'Profile',
        updatedUser.id,
        {
          reason: updates.suspensionReason,
        }
      );
    }

    return NextResponse.json({
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        role: updatedUser.role,
        isSuspended: updatedUser.isSuspended,
        isAdmin: updatedUser.isAdmin,
        suspensionReason: updatedUser.suspensionReason,
      },
      message: 'User updated successfully',
    });
  } catch (error) {
    console.error('PATCH /api/admin/users/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
