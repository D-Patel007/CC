import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function PATCH(req: Request, context: { params: { id: string } }) {
  const id = Number(context.params.id)
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  try {
    const body = await req.json()
    const updates: { name?: string; slug?: string } = {}

    if (typeof body.name === 'string') {
      const value = body.name.trim()
      if (!value) return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 })
      updates.name = value
    }

    if (typeof body.slug === 'string') {
      const slug = slugify(body.slug)
      if (!slug) return NextResponse.json({ error: 'Slug cannot be empty' }, { status: 400 })
      updates.slug = slug
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No changes supplied' }, { status: 400 })
    }

    const category = await prisma.category.update({
      where: { id },
      data: updates,
    })

    return NextResponse.json({ data: category })
  } catch (error) {
    console.error(`PATCH /api/categories/${context.params.id} failed:`, error)
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, context: { params: { id: string } }) {
  const id = Number(context.params.id)
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  try {
    await prisma.category.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error(`DELETE /api/categories/${context.params.id} failed:`, error)
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}