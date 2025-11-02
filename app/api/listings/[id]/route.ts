import { NextRequest, NextResponse } from 'next/server'
import { sbServer } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth-middleware'
import { canModifyListing, assertOwnership, AuthorizationError } from '@/lib/authorization'
import { validateRequest, updateListingSchema } from '@/lib/validation-schemas'
import { rateLimit, RateLimits, getRateLimitIdentifier } from '@/lib/rate-limit'

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await context.params
  const id = Number(rawId)
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  // Rate limiting for reads
  const rateLimitIdentifier = getRateLimitIdentifier(_req, "listings:read:id")
  const rateLimitResponse = rateLimit(rateLimitIdentifier, RateLimits.LENIENT)
  if (rateLimitResponse) return rateLimitResponse

  const supabase = await sbServer()
  const { data: listing, error } = await supabase
    .from('Listing')
    .select(`
      *,
      category:Category(*),
      seller:Profile!Listing_sellerId_fkey(id, name)
    `)
    .eq('id', id)
    .single()

  if (error || !listing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  
  return NextResponse.json({ data: listing })
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await context.params
    const id = Number(rawId)
    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }

    // Authentication
    const authResult = await requireAuth(req)
    if (authResult instanceof NextResponse) return authResult
    const { user } = authResult

    // Rate limiting
    const rateLimitIdentifier = getRateLimitIdentifier(req, "listings:update", user.id)
    const rateLimitResponse = rateLimit(rateLimitIdentifier, RateLimits.STRICT)
    if (rateLimitResponse) return rateLimitResponse

    // Authorization - verify ownership
    const canModify = await canModifyListing(user.id, id)
    await assertOwnership(canModify)

    // Validation
    const validation = await validateRequest(req, updateListingSchema)
    if ('error' in validation) {
      return NextResponse.json(
        { error: validation.error, details: validation.details },
        { status: 400 }
      )
    }

    const { title, description, priceCents, condition, categoryId, imageUrl, campus, isSold } = validation.data

    const supabase = await sbServer()

    // Build update object with only provided fields
    const data: Record<string, any> = {}
    if (title !== undefined) data.title = title
    if (description !== undefined) data.description = description
    if (priceCents !== undefined) data.priceCents = priceCents
    if (condition !== undefined) data.condition = condition
    if (imageUrl !== undefined) data.imageUrl = imageUrl
    if (campus !== undefined) data.campus = campus
    if (isSold !== undefined) data.isSold = isSold
    
    if (categoryId !== undefined) {
      if (categoryId === null) {
        data.categoryId = null
      } else {
        const { data: category } = await supabase
          .from('Category')
          .select('id')
          .eq('id', categoryId)
          .single()
        
        if (!category) {
          return NextResponse.json({ error: 'Category not found' }, { status: 400 })
        }
        data.categoryId = categoryId
      }
    }

    const { data: listing, error } = await supabase
      .from('Listing')
      .update(data)
      .eq('id', id)
      .select(`
        *,
        category:Category(*),
        seller:Profile!Listing_sellerId_fkey(id, name, avatarUrl)
      `)
      .single()

    if (error || !listing) {
      console.error('Failed to update listing:', error)
      return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 })
    }

    return NextResponse.json({ data: listing })
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: 'You do not have permission to modify this listing' }, { status: 403 })
    }
    console.error('PATCH /api/listings/[id] failed:', error)
    return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  // Support form-based _method override for DELETE
  const contentType = req.headers.get('content-type') || ''
  if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
    const form = await req.formData()
    const method = String(form.get('_method') || '').toUpperCase()
    if (method === 'DELETE') {
      return DELETE(req, ctx)
    }
  }
  
  // Otherwise treat as PATCH
  return PATCH(req, ctx)
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await context.params
    const id = Number(rawId)
    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }

    // Authentication
    const authResult = await requireAuth(req)
    if (authResult instanceof NextResponse) return authResult
    const { user } = authResult

    // Rate limiting
    const rateLimitIdentifier = getRateLimitIdentifier(req, "listings:delete", user.id)
    const rateLimitResponse = rateLimit(rateLimitIdentifier, RateLimits.STRICT)
    if (rateLimitResponse) return rateLimitResponse

    // Authorization - verify ownership
    const canModify = await canModifyListing(user.id, id)
    await assertOwnership(canModify)

    const supabase = await sbServer()
    const { error } = await supabase
      .from('Listing')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('DELETE /api/listings/[id] failed:', error)
      return NextResponse.json({ error: 'Failed to delete listing' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: 'You do not have permission to delete this listing' }, { status: 403 })
    }
    console.error('DELETE /api/listings/[id] failed:', error)
    return NextResponse.json({ error: 'Failed to delete listing' }, { status: 500 })
  }
}
