import { NextRequest, NextResponse } from "next/server"
import { sbServer } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")
  const errorDescription = searchParams.get("error_description")
  const next = searchParams.get("next") ?? "/"

  console.log("Auth callback:", { 
    code: !!code, 
    error, 
    errorDescription,
    userAgent: request.headers.get("user-agent")
  })

  // If there's an explicit error from Supabase and no code, fail
  if (error && !code) {
    console.error("Supabase auth error:", error, errorDescription)
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error)}`)
  }

  if (code) {
    const supabase = await sbServer()
    
    // Exchange the code for a session
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError || !data.session) {
      console.error("Error exchanging code:", exchangeError)
      return NextResponse.redirect(`${origin}/login?error=auth_failed`)
    }

    console.log("Session established:", data.session.user.email)

    // Check if user needs onboarding
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", data.session.user.id)
        .single()

      if (!profile?.name) {
        return NextResponse.redirect(`${origin}/onboarding`)
      }
    } catch (err) {
      console.error("Error checking profile:", err)
      // Continue anyway
    }

    // Success - redirect to the next page
    return NextResponse.redirect(`${origin}${next}`)
  }

  // No code and no error - something is wrong
  console.error("No auth code in callback URL")
  return NextResponse.redirect(`${origin}/login?error=invalid_request`)
}
