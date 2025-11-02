import { NextRequest, NextResponse } from "next/server"
import { sbServer } from "@/lib/supabase/server"

export type AuthenticatedUser = {
  id: number
  supabaseId: string
  name: string | null
}

export type AuthenticatedRequest = NextRequest & {
  user: AuthenticatedUser
}

/**
 * Middleware to authenticate requests using Supabase session.
 * Returns the authenticated user's profile or sends 401 response.
 */
export async function requireAuth(
  req: NextRequest
): Promise<{ user: AuthenticatedUser } | NextResponse> {
  try {
    const supabase = await sbServer()
    const {
      data: { user: supabaseUser },
      error,
    } = await supabase.auth.getUser()

    if (error || !supabaseUser) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      )
    }

    // Fetch user profile from database using Supabase
    const { data: profile, error: profileError } = await supabase
      .from('Profile')
      .select('id, supabaseId, name')
      .eq('supabaseId', supabaseUser.id)
      .single()

    if (profileError || !profile || !profile.supabaseId) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      )
    }

    return {
      user: {
        id: profile.id,
        supabaseId: profile.supabaseId,
        name: profile.name,
      },
    }
  } catch (err) {
    console.error("Auth middleware error:", err)
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    )
  }
}

/**
 * Optional authentication - returns user if logged in, null otherwise.
 * Does not block the request.
 */
export async function optionalAuth(
  req: NextRequest
): Promise<AuthenticatedUser | null> {
  try {
    const supabase = await sbServer()
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser()

    if (!supabaseUser) {
      return null
    }

    const { data: profile } = await supabase
      .from('Profile')
      .select('id, supabaseId, name')
      .eq('supabaseId', supabaseUser.id)
      .single()

    if (!profile || !profile.supabaseId) {
      return null
    }

    return {
      id: profile.id,
      supabaseId: profile.supabaseId,
      name: profile.name,
    }
  } catch (err) {
    console.error("Optional auth error:", err)
    return null
  }
}
