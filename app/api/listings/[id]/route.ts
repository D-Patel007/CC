import { NextRequest, NextResponse } from 'next/server'
import { Condition, Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

function parseCondition(value: unknown) {
  if (typeof value !== 'string') return undefined
  const normalized = value.toUpperCase()
  return Object.values(Condition).includes(normalized as Condition)
    ? (normalized as Condition)
    : undefined
}

function parseBoolean(value: unknown) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (['true', '1', 'yes', 'on'].includes(normalized)) return true
    if (['false', '0', 'no', 'off', ''].includes(normalized)) return false
  }
  return undefined
}

async function ensureOwner(listingId: number) {
  const { profile } = await getCurrentUser()
  if (!profile) {
    return {
      response: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }),
    }
  }

  const listing = await prisma.listing.findUnique({ where: { id: listingId } })
  if (!listing) {
    return {
      response: NextResponse.json({ error: 'Not found' }, { status: 404 }),
    }
  }

  if (listing.sellerId !== profile.id) {
    return {
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    }
  }

  return { listing, profile }
}

async function applyUpdate(listingId: number, payload: Record<string, unknown>) {
  const auth = await ensureOwner(listingId)
  if ('response' in auth) return auth.response

  const data: Prisma.ListingUpdateInput = {}

  if (typeof payload.title === 'string') {
    const value = payload.title.trim()
    if (!value) return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 })
    data.title = value
  }

  if (typeof payload.description === 'string') {
    const value = payload.description.trim()
    if (!value)
      return NextResponse.json({ error: 'Description cannot be empty' }, { status: 400 })
    data.description = value
  }

  if (typeof payload.imageUrl === 'string') {
    const trimmed = payload.imageUrl.trim()
    data.imageUrl = trimmed ? trimmed : null
  }

  if (payload.priceCents !== undefined) {
    const priceCents = Math.round(Number(payload.priceCents))
    if (!Number.isFinite(priceCents) || priceCents <= 0) {
      return NextResponse.json({ error: 'priceCents must be > 0' }, { status: 400 })
    }
    data.priceCents = priceCents
  } else if (payload.price !== undefined) {
    const priceCents = Math.round(Number(payload.price) * 100)
    if (!Number.isFinite(priceCents) || priceCents <= 0) {
      return NextResponse.json({ error: 'price must be > 0' }, { status: 400 })
    }
    data.priceCents = priceCents
  }

  const condition = parseCondition(payload.condition)
  if (condition) {
    data.condition = condition
  }

  if (typeof payload.campus === 'string') {
    const trimmed = payload.campus.trim()
    data.campus = trimmed || null
  }

  if (payload.categoryId !== undefined) {
    if (payload.categoryId === null || payload.categoryId === '') {
      data.category = { disconnect: true }
    } else {
      const categoryId = Number(payload.categoryId)
      if (!Number.isInteger(categoryId)) {
        return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
      }
      const category = await prisma.category.findUnique({ where: { id: categoryId } })
      if (!category) {
        return NextResponse.json({ error: 'Category not found' }, { status: 400 })
      }
      data.category = { connect: { id: categoryId } }
    }
  }

  const markSold = parseBoolean(payload.markSold)
  const nextSold = markSold !== undefined ? markSold : parseBoolean(payload.isSold)
  if (nextSold !== undefined) {
    data.isSold = nextSold
    data.soldAt = nextSold ? new Date() : null
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No changes supplied' }, { status: 400 })
  }

  const listing = await prisma.listing.update({
    where: { id: listingId },
    data,
    include: {
      category: true,
      seller: { select: { id: true, name: true, avatarUrl: true } },
    },
  })

  return NextResponse.json({ data: listing })
}

async function applyDelete(listingId: number) {
  const auth = await ensureOwner(listingId)
  if ('response' in auth) return auth.response

  await prisma.listing.delete({ where: { id: listingId } })
  return NextResponse.json({ ok: true })
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id)
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      category: true,
      seller: { select: { id: true, name: true, avatarUrl: true } },
    },
  })
  if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: listing })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id)
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  const contentType = req.headers.get('content-type') || ''
  let payload: Record<string, unknown> = {}
  if (contentType.includes('application/json')) {
    payload = await req.json()
  } else {
    const form = await req.formData()
    form.forEach((value, key) => {
      payload[key] = value
    })
  }

  return applyUpdate(id, payload)
}

export async function POST(req: NextRequest, ctx: { params: { id: string } }) {
  const form = await req.formData()
  const method = String(form.get('_method') || '').toUpperCase()

  if (method === 'DELETE') {
    return DELETE(req, ctx)
  }

  const id = Number(ctx.params.id)
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  const payload: Record<string, unknown> = {}
  form.forEach((value, key) => {
    if (key !== '_method') {
      payload[key] = value
    }
  })
  return applyUpdate(id, payload)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id)
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  return applyDelete(id)
}
