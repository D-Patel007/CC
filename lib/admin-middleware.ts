/**
 * Admin authentication and authorization middleware
 * Checks if user has admin or moderator privileges
 */

import { NextRequest, NextResponse } from 'next/server'
import { sbServer } from './supabase/server'
import type { Database } from './supabase/databaseTypes'

type ProfileRow = Database['public']['Tables']['Profile']['Row']

export interface AdminUser {
  id: number
  supabaseId: string | null
  name: string | null
  email: string | null
  role: 'admin' | 'moderator'
  isAdmin: boolean
}

/**
 * Require admin or moderator role
 * Returns admin user profile or 403 response
 */
export async function requireAdmin(
  req: NextRequest
): Promise<{ admin: AdminUser } | NextResponse> {
  try {
    const supabase = await sbServer()

    // Get authenticated user
    const {
      data: { user: supabaseUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !supabaseUser) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      )
    }

    // Get user profile with role
    const { data: profile, error: profileError } = await supabase
      .from('Profile')
      .select('*')
      .eq('supabaseId', supabaseUser.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Check if user has admin or moderator role
    if (profile.role !== 'admin' && profile.role !== 'moderator') {
      console.warn(`Unauthorized admin access attempt by user ${profile.id} (${profile.name})`)
      return NextResponse.json(
        { error: 'Forbidden - Admin or moderator access required' },
        { status: 403 }
      )
    }

    // Check if user is suspended
    if (profile.isSuspended) {
      return NextResponse.json(
        { error: 'Your account is suspended' },
        { status: 403 }
      )
    }

    const admin: AdminUser = {
      id: profile.id,
      supabaseId: profile.supabaseId,
      name: profile.name,
      email: supabaseUser.email ?? null,
      role: profile.role as 'admin' | 'moderator',
      isAdmin: profile.isAdmin,
    }

    return { admin }
  } catch (error) {
    console.error('Admin middleware error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Require full admin role (not just moderator)
 */
export async function requireFullAdmin(
  req: NextRequest
): Promise<{ admin: AdminUser } | NextResponse> {
  const result = await requireAdmin(req)
  
  if (result instanceof NextResponse) {
    return result
  }

  if (result.admin.role !== 'admin') {
    return NextResponse.json(
      { error: 'Forbidden - Full admin access required' },
      { status: 403 }
    )
  }

  return result
}

/**
 * Check if current user is admin (for client-side checks)
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const supabase = await sbServer()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return false
    }

    const { data: profile } = await supabase
      .from('Profile')
      .select('role, isAdmin')
      .eq('supabaseId', user.id)
      .single()

    if (!profile) {
      return false
    }

    return profile.role === 'admin' || profile.role === 'moderator'
  } catch (error) {
    console.error('isAdmin check error:', error)
    return false
  }
}

/**
 * Log admin action to ModerationLog table
 */
export async function logAdminAction(
  adminId: number,
  action: string,
  targetType: string,
  targetId: number,
  details?: any
): Promise<void> {
  try {
    const supabase = await sbServer()

    await supabase.from('ModerationLog').insert({
      adminId,
      action,
      targetType,
      targetId,
      details: details || null,
    })
  } catch (error) {
    console.error('Failed to log admin action:', error)
    // Don't throw - logging failure shouldn't break the action
  }
}
