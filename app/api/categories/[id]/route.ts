import { NextResponse } from 'next/server'
import { sbServer } from '@/lib/supabase/server'

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await context.params
  const id = Number(rawId)
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

    const supabase = await sbServer()
    const { data: category, error } = await supabase
      .from('Category')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error || !category) {
      console.error(`PATCH /api/categories/${rawId} failed:`, error)
      return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
    }

    return NextResponse.json({ data: category })
  } catch (error) {
    console.error(`PATCH /api/categories/${rawId} failed:`, error)
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await context.params
  const id = Number(rawId)
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  try {
    const supabase = await sbServer()
    const { error } = await supabase
      .from('Category')
      .delete()
      .eq('id', id)

    if (error) {
      console.error(`DELETE /api/categories/${rawId} failed:`, error)
      return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error(`DELETE /api/categories/${rawId} failed:`, error)
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}