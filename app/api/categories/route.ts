import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { listings: true } },
    },
  })

  return NextResponse.json({ data: categories })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const slugInput = typeof body.slug === 'string' ? body.slug : ''

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const slug = slugInput ? slugify(slugInput) : slugify(name)
    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 })
    }

    const category = await prisma.category.create({
      data: { name, slug },
    })

    return NextResponse.json({ data: category }, { status: 201 })
  } catch (error) {
    console.error('POST /api/categories failed:', error)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}
