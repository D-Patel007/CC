import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { sbServer } from "@/lib/supabase/server"

// CREATE a listing
export async function POST(req: Request) {
  try {
    const supabase = sbServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await req.json()

    const title = String(body.title ?? "").trim()
    const description = String(body.description ?? "").trim()
    const priceCents = Math.round(Number(body.price) * 100) || 0
    const category = body.category ? String(body.category) : null
    const condition = (body.condition ? String(body.condition) : "GOOD").toUpperCase()
    const imageUrl = body.imageUrl ? String(body.imageUrl).trim() : null

    if (!title || !description || priceCents <= 0) {
      return NextResponse.json(
        { error: "Missing required fields: title, description, price" },
        { status: 400 }
      )
    }

    const listing = await prisma.listing.create({
      data: {
        title,
        description,
        priceCents,
        category,
        condition,   // e.g. NEW / LIKE_NEW / GOOD / FAIR / USED
        imageUrl,
        sellerId: user.id,
      },
    })

    return NextResponse.json({ data: listing }, { status: 201 })
  } catch (err: any) {
    console.error("POST /api/listings failed:", err)
    return NextResponse.json({ error: "Failed to create listing" }, { status: 500 })
  }
}

// READ listings (kept for completeness)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1)
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20", 10), 1), 50)
    const skip = (page - 1) * limit

    const where: any = {}
    const q = searchParams.get("q")
    const category = searchParams.get("category")
    if (q) where.title = { contains: q, mode: "insensitive" }
    if (category) where.category = category

    const [items, total] = await Promise.all([
      prisma.listing.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit }),
      prisma.listing.count({ where }),
    ])

    return NextResponse.json({
      data: items,
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
