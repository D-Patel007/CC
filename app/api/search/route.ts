import { NextRequest, NextResponse } from "next/server"
import { sbServer } from "@/lib/supabase/server"
import { rateLimit, RateLimits, getRateLimitIdentifier } from "@/lib/rate-limit"

// GET /api/search - Unified search for listings and events
export async function GET(req: NextRequest) {
  try {
    // Rate limiting for searches
    const rateLimitIdentifier = getRateLimitIdentifier(req, "search")
    const rateLimitResponse = rateLimit(rateLimitIdentifier, RateLimits.MODERATE)
    if (rateLimitResponse) return rateLimitResponse

    const { searchParams } = new URL(req.url)
    const query = searchParams.get("q")?.trim()
    
    if (!query || query.length < 2) {
      return NextResponse.json({ 
        listings: [], 
        events: [] 
      })
    }

    const supabase = await sbServer()
    
    // Search listings
    const { data: listings } = await supabase
      .from('Listing')
      .select(`
        id,
        title,
        description,
        priceCents,
        imageUrl,
        isSold,
        category:Category(name)
      `)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .eq('isSold', false)
      .limit(5)
      .order('createdAt', { ascending: false })

    // Search events
    const { data: events } = await supabase
      .from('Event')
      .select(`
        id,
        title,
        description,
        eventDate,
        location,
        imageUrl,
        category
      `)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,location.ilike.%${query}%`)
      .gte('eventDate', new Date().toISOString())
      .limit(5)
      .order('eventDate', { ascending: true })

    return NextResponse.json({
      listings: listings || [],
      events: events || []
    })
  } catch (error) {
    console.error("GET /api/search error:", error)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}
