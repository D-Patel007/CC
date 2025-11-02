import { NextRequest, NextResponse } from 'next/server'
import { sbServer } from '@/lib/supabase/server'
import { getRateLimitIdentifier, rateLimit, RateLimits } from '@/lib/rate-limit'

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function GET(req: NextRequest) {
  const identifier = getRateLimitIdentifier(req, 'categories:read')
  const limited = rateLimit(identifier, RateLimits.LENIENT)
  if (limited) return limited

  const supabase = await sbServer()
  
  const { data: categories, error } = await supabase
    .from('Category')
    .select(`
      *,
      listings:Listing(id)
    `)
    .order('name', { ascending: true })

  if (error) {
    console.error('GET /api/categories failed:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }

  // Transform to include listing count
  const categoriesWithCount = categories?.map(category => ({
    ...category,
    _count: {
      listings: category.listings?.length || 0
    }
  }))

  return NextResponse.json({ data: categoriesWithCount })
}

export async function POST(req: NextRequest) {
  try {
    const identifier = getRateLimitIdentifier(req, 'categories:create')
    const limited = rateLimit(identifier, RateLimits.STRICT)
    if (limited) return limited

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

    const supabase = await sbServer()
    const { data: category, error } = await supabase
      .from('Category')
      .insert({ name, slug })
      .select()
      .single()

    if (error || !category) {
      console.error('POST /api/categories failed:', error)
      return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
    }

    return NextResponse.json({ data: category }, { status: 201 })
  } catch (error) {
    console.error('POST /api/categories failed:', error)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}
