import { NextResponse } from "next/server"
import { sbServer } from "@/lib/supabase/server"

export async function GET() {
  try {
    // Check if env vars exist
    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
    const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!hasUrl || !hasKey) {
      return NextResponse.json({
        error: "Missing environment variables",
        hasUrl,
        hasKey,
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "exists" : "missing",
        key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "exists" : "missing"
      }, { status: 500 })
    }

    // Try to connect to Supabase
    const supabase = await sbServer()
    
    // Try a simple query
    const { data, error } = await supabase
      .from('Listing')
      .select('id')
      .limit(1)

    if (error) {
      return NextResponse.json({
        error: "Database query failed",
        details: error.message,
        code: error.code,
        hint: error.hint
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Supabase connection working!",
      hasData: !!data && data.length > 0
    })
  } catch (error: any) {
    return NextResponse.json({
      error: "Unexpected error",
      message: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
