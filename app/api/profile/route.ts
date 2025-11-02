import { NextRequest, NextResponse } from "next/server"
import { sbServer } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth-middleware"
import { validateRequest, updateProfileSchema } from "@/lib/validation-schemas"
import { rateLimit, RateLimits, getRateLimitIdentifier } from "@/lib/rate-limit"

export async function GET(req: NextRequest) {
  try {
    // Authentication
    const authResult = await requireAuth(req)
    if (authResult instanceof NextResponse) return authResult
    const { user } = authResult

    // Rate limiting
    const rateLimitIdentifier = getRateLimitIdentifier(req, "profile:read", user.id)
    const rateLimitResponse = rateLimit(rateLimitIdentifier, RateLimits.MODERATE)
    if (rateLimitResponse) return rateLimitResponse

    const supabase = await sbServer()
    const { data: profile, error } = await supabase
      .from('Profile')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    return NextResponse.json({ data: profile })
  } catch (error) {
    console.error("Error fetching profile:", error)
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    // Authentication
    const authResult = await requireAuth(req)
    if (authResult instanceof NextResponse) return authResult
    const { user } = authResult

    // Rate limiting
    const rateLimitIdentifier = getRateLimitIdentifier(req, "profile:update", user.id)
    const rateLimitResponse = rateLimit(rateLimitIdentifier, RateLimits.STRICT)
    if (rateLimitResponse) return rateLimitResponse

    // Validation
    const validation = await validateRequest(req, updateProfileSchema)
    if ('error' in validation) {
      return NextResponse.json(
        { error: validation.error, details: validation.details },
        { status: 400 }
      )
    }

    const { name, year, major, bio, avatarUrl } = validation.data

    // Build update object with only provided fields
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (year !== undefined) updateData.year = year
    if (major !== undefined) updateData.major = major
    if (bio !== undefined) updateData.bio = bio
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl

    const supabase = await sbServer()
    const { data: profile, error } = await supabase
      .from('Profile')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating profile:", error)
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
    }

    return NextResponse.json({ data: profile })
  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
