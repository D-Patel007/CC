import { NextRequest, NextResponse } from "next/server"
import { sbServer } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth-middleware"
import { validateRequest, createListingSchema } from "@/lib/validation-schemas"
import { rateLimit, RateLimits, getRateLimitIdentifier } from "@/lib/rate-limit"

// CREATE a listing
export async function POST(req: NextRequest) {
  try {
    // Authentication
    const authResult = await requireAuth(req)
    if (authResult instanceof NextResponse) return authResult
    const { user } = authResult

    // Rate limiting - strict for write operations
    const rateLimitIdentifier = getRateLimitIdentifier(req, "listings:create", user.id)
    const rateLimitResponse = rateLimit(rateLimitIdentifier, RateLimits.STRICT)
    if (rateLimitResponse) return rateLimitResponse

    // Validation
    const validation = await validateRequest(req, createListingSchema)
    if ('error' in validation) {
      return NextResponse.json(
        { error: validation.error, details: validation.details },
        { status: 400 }
      )
    }
    const { title, description, priceCents, condition, categoryId, imageUrl, campus } = validation.data

    const supabase = await sbServer()

    // Verify category exists if provided
    if (categoryId) {
      const { data: category } = await supabase
        .from('Category')
        .select('id')
        .eq('id', categoryId)
        .single()
      
      if (!category) {
        return NextResponse.json({ error: "Category not found" }, { status: 400 })
      }
    }

    const { data: listing, error } = await supabase
      .from('Listing')
      .insert({
        title,
        description,
        priceCents,
        categoryId: categoryId ?? null,
        condition,
        imageUrl: imageUrl ?? null,
        campus: campus ?? null,
        sellerId: user.id,
      })
      .select(`
        *,
        category:Category(*),
        seller:Profile!Listing_sellerId_fkey(id, name, avatarUrl)
      `)
      .single()

    if (error || !listing) {
      console.error("Failed to create listing:", error)
      return NextResponse.json({ error: "Failed to create listing" }, { status: 500 })
    }

    return NextResponse.json({ data: listing }, { status: 201 })
  } catch (err: any) {
    console.error("POST /api/listings failed:", err)
    return NextResponse.json({ error: "Failed to create listing" }, { status: 500 })
  }
}

// READ listings (kept for completeness)
export async function GET(req: NextRequest) {
  try {
    // Rate limiting - lenient for public read operations
    const rateLimitIdentifier = getRateLimitIdentifier(req, "listings:read")
    const rateLimitResponse = rateLimit(rateLimitIdentifier, RateLimits.LENIENT)
    if (rateLimitResponse) return rateLimitResponse

    const { searchParams } = new URL(req.url)
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1)
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20", 10), 1), 50)
    const skip = (page - 1) * limit

    const supabase = await sbServer()
    const q = searchParams.get("q")
    const category = searchParams.get("category")
    const status = searchParams.get("status")?.toLowerCase()
    
    let query = supabase
      .from('Listing')
      .select(`
        *,
        category:Category(*),
        seller:Profile!Listing_sellerId_fkey(id, name, avatarUrl)
      `, { count: 'exact' })

    // Search filter
    if (q) {
      query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`)
    }

    // Category filter
    if (category) {
      const { data: categoryData } = await supabase
        .from('Category')
        .select('id')
        .or(`name.ilike.${category},slug.eq.${category.toLowerCase()}`)
        .single()
      
      if (categoryData) {
        query = query.eq('categoryId', categoryData.id)
      }
    }

    // Status filter
    if (status === "active") {
      query = query.eq('isSold', false)
    } else if (status === "sold") {
      query = query.eq('isSold', true)
    }

    const { data: items, error, count } = await query
      .order('createdAt', { ascending: false })
      .range(skip, skip + limit - 1)

    if (error) {
      console.error("GET /api/listings failed:", error)
      return NextResponse.json({ error: "Failed to load listings" }, { status: 500 })
    }

    const total = count ?? 0

    return NextResponse.json({
      data: items || [],
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    })
  } catch (e) {
    console.error("GET /api/listings failed:", e)
    return NextResponse.json({ error: "Failed to load listings" }, { status: 500 })
  }
}
