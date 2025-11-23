/**
 * API Route: /api/admin/prohibited-items
 * Manage prohibited items (keywords, patterns, categories)
 * Admin only
 */

import { NextRequest, NextResponse } from 'next/server'
import { sbServer } from '@/lib/supabase/server'
import { requireAdmin, logAdminAction } from '@/lib/admin-middleware'
import { z } from 'zod'

// Validation schema
const prohibitedItemSchema = z.object({
  type: z.enum(['keyword', 'regex', 'category', 'url_pattern']),
  pattern: z.string().min(1).max(500),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  action: z.enum(['flag', 'auto_reject', 'warn']).default('flag'),
  category: z.string().max(100).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  isActive: z.boolean().default(true),
})

// GET /api/admin/prohibited-items - List all prohibited items
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAdmin(req)
    if (authResult instanceof NextResponse) return authResult
    const { admin } = authResult

    const supabase = await sbServer()
    const url = new URL(req.url)
    
    // Query parameters
    const isActive = url.searchParams.get('isActive')
    const type = url.searchParams.get('type')
    const severity = url.searchParams.get('severity')
    const category = url.searchParams.get('category')

    let query = supabase
      .from('ProhibitedItem')
      .select('*')
      .order('severity', { ascending: false })
      .order('createdAt', { ascending: false })

    if (isActive !== null) {
      query = query.eq('isActive', isActive === 'true')
    }
    if (type) {
      query = query.eq('type', type)
    }
    if (severity) {
      query = query.eq('severity', severity)
    }
    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) {
      console.error('Failed to fetch prohibited items:', error)
      return NextResponse.json(
        { error: 'Failed to fetch prohibited items' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('GET /api/admin/prohibited-items error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/admin/prohibited-items - Create new prohibited item
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAdmin(req)
    if (authResult instanceof NextResponse) return authResult
    const { admin } = authResult

    const body = await req.json()
    const validation = prohibitedItemSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      )
    }

    const supabase = await sbServer()
    const { data, error } = await supabase
      .from('ProhibitedItem')
      .insert({
        ...validation.data,
        createdBy: admin.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create prohibited item:', error)
      return NextResponse.json(
        { error: 'Failed to create prohibited item' },
        { status: 500 }
      )
    }

    // Log admin action
    await logAdminAction(
      admin.id,
      'created_prohibited_item',
      'ProhibitedItem',
      data.id,
      { pattern: data.pattern, severity: data.severity }
    )

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('POST /api/admin/prohibited-items error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/prohibited-items - Update prohibited item
export async function PATCH(req: NextRequest) {
  try {
    const authResult = await requireAdmin(req)
    if (authResult instanceof NextResponse) return authResult
    const { admin } = authResult

    const body = await req.json()
    const { id, ...updates } = body

    if (!id || typeof id !== 'number') {
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 }
      )
    }

    const validation = prohibitedItemSchema.partial().safeParse(updates)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      )
    }

    const supabase = await sbServer()
    const { data, error } = await supabase
      .from('ProhibitedItem')
      .update({
        ...validation.data,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Failed to update prohibited item:', error)
      return NextResponse.json(
        { error: 'Failed to update prohibited item' },
        { status: 500 }
      )
    }

    // Log admin action
    await logAdminAction(
      admin.id,
      'updated_prohibited_item',
      'ProhibitedItem',
      data.id,
      { updates: validation.data }
    )

    return NextResponse.json({ data })
  } catch (error) {
    console.error('PATCH /api/admin/prohibited-items error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/prohibited-items?id=123 - Delete prohibited item
export async function DELETE(req: NextRequest) {
  try {
    const authResult = await requireAdmin(req)
    if (authResult instanceof NextResponse) return authResult
    const { admin } = authResult

    const url = new URL(req.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 }
      )
    }

    const supabase = await sbServer()
    const { error } = await supabase
      .from('ProhibitedItem')
      .delete()
      .eq('id', parseInt(id))

    if (error) {
      console.error('Failed to delete prohibited item:', error)
      return NextResponse.json(
        { error: 'Failed to delete prohibited item' },
        { status: 500 }
      )
    }

    // Log admin action
    await logAdminAction(
      admin.id,
      'deleted_prohibited_item',
      'ProhibitedItem',
      parseInt(id)
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/admin/prohibited-items error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
