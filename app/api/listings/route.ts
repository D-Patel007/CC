import { NextResponse } from "next/server"
import { Prisma, Condition } from "@prisma/client"
import { prisma } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

// CREATE a listing
export async function POST(req: Request) {
  try {
    const { supabaseUser, profile } = await getCurrentUser()
    if (!supabaseUser || !profile) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await req.json()

    const title = String(body.title ?? "").trim()
    const description = String(body.description ?? "").trim()
    const rawPrice =
      body.priceCents !== undefined && body.priceCents !== null
        ? Math.round(Number(body.priceCents))
        : Math.round(Number(body.price) * 100)
    const priceCents = Number.isFinite(rawPrice) ? rawPrice : 0
    const categoryId = body.categoryId ? Number(body.categoryId) : null
    const conditionInput = (body.condition ? String(body.condition) : "GOOD").toUpperCase()
    const condition: Condition =
      Object.values(Condition).includes(conditionInput as Condition)
        ? (conditionInput as Condition)
        : Condition.GOOD
    const imageUrl = body.imageUrl ? String(body.imageUrl).trim() : null
    const campusValue =
      typeof body.campus === "string" ? body.campus.trim() : undefined
    const campus = campusValue ? campusValue : undefined

    if (!title || !description || priceCents <= 0) {
      return NextResponse.json(
        { error: "Missing required fields: title, description, price" },
        { status: 400 }
      )
    }

    if (categoryId && Number.isNaN(categoryId)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 })
    }

    if (categoryId) {
      const exists = await prisma.category.findUnique({ where: { id: categoryId } })
      if (!exists) {
        return NextResponse.json({ error: "Category not found" }, { status: 400 })
      }
    }

    const listing = await prisma.listing.create({
      data: {
        title,
        description,
        priceCents,
        categoryId: categoryId ?? undefined,
        condition,
        imageUrl,
        campus,
        sellerId: profile.id,
      },
      include: {
        category: true,
        seller: { select: { id: true, name: true, avatarUrl: true } },
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

    const where: Prisma.ListingWhereInput = {}
    const q = searchParams.get("q")
    const category = searchParams.get("category")
    const status = searchParams.get("status")?.toLowerCase()
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ]
    }
    if (category) {
      where.category = {
        OR: [
          { name: { equals: category, mode: "insensitive" } },
          { slug: { equals: category.toLowerCase() } },
        ],
      }
    }

    if (status === "active") {
      where.isSold = false
    } else if (status === "sold") {
      where.isSold = true
    }

    const [items, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          category: true,
          seller: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
      }),
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
