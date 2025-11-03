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
 * Automatically creates profile if it doesn't exist.
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
    let { data: profile, error: profileError } = await supabase
      .from('Profile')
      .select('id, supabaseId, name')
      .eq('supabaseId', supabaseUser.id)
      .maybeSingle()

    // If profile doesn't exist, create it
    if (!profile) {
      const email = supabaseUser.email ?? null
      const name = supabaseUser.user_metadata?.name || 
                   supabaseUser.user_metadata?.full_name ||
                   email?.split('@')[0] ||
                   'Anonymous User'

      console.log('Creating profile for user:', {
        supabaseId: supabaseUser.id,
        email,
        name
      })

      const { data: newProfile, error: insertError } = await supabase
        .from('Profile')
        .insert({
          supabaseId: supabaseUser.id,
          name,
          avatarUrl: supabaseUser.user_metadata?.avatar_url || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .select('id, supabaseId, name')
        .single()

      if (insertError) {
        console.error('Profile creation failed:', {
          error: insertError,
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint
        })
        
        // If it's a duplicate key error, try to fetch the existing profile
        if (insertError.code === '23505') {
          console.log('Duplicate key detected, fetching existing profile')
          const { data: existingProfile } = await supabase
            .from('Profile')
            .select('id, supabaseId, name')
            .eq('supabaseId', supabaseUser.id)
            .single()
          
          if (existingProfile) {
            profile = existingProfile
          } else {
            return NextResponse.json(
              { error: "Failed to create user profile - duplicate key but profile not found" },
              { status: 500 }
            )
          }
        } else {
          return NextResponse.json(
            { 
              error: "Failed to create user profile",
              details: insertError.message 
            },
            { status: 500 }
          )
        }
      } else {
        profile = newProfile
      }
    }

    if (!profile || !profile.supabaseId) {
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
