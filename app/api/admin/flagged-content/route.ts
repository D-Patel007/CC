/**
 * API Route: /api/admin/flagged-content
 * View and manage flagged content (moderation queue)
 * Admin/Moderator only
 */

import { NextRequest, NextResponse } from 'next/server'
import { sbServer } from '@/lib/supabase/server'
import { requireAdmin, logAdminAction } from '@/lib/admin-middleware'

// GET /api/admin/flagged-content - List flagged content with filters
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAdmin(req)
    if (authResult instanceof NextResponse) return authResult
    const { admin } = authResult

    const supabase = await sbServer()
    const url = new URL(req.url)
    
    // Query parameters
    const status = url.searchParams.get('status') // Don't default to 'pending'
    const contentType = url.searchParams.get('contentType')
    const severity = url.searchParams.get('severity')
    const source = url.searchParams.get('source')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    let query = supabase
      .from('FlaggedContent')
      .select(`
        *,
        user:Profile!FlaggedContent_userId_fkey (
          id,
          name,
          supabaseId
        )
      `)
      .order('createdAt', { ascending: false })
      .range(offset, offset + limit - 1)

    // Only filter by status if explicitly provided (not empty string)
    if (status && status !== '') {
      query = query.eq('status', status)
    }
    if (contentType) {
      query = query.eq('contentType', contentType)
    }
    if (severity) {
      query = query.eq('severity', severity)
    }
    if (source) {
      query = query.eq('source', source)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Failed to fetch flagged content:', error)
      return NextResponse.json(
        { error: 'Failed to fetch flagged content', details: error },
        { status: 500 }
      )
    }

    console.log(`📋 Admin Dashboard: Fetched ${data?.length || 0} flagged content items (total: ${count})`)
    console.log('Filters:', { status, contentType, severity, source })

    return NextResponse.json({ 
      data,
      pagination: {
        total: count,
        limit,
        offset,
      }
    })
  } catch (error) {
    console.error('GET /api/admin/flagged-content error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/flagged-content - Review flagged content
export async function PATCH(req: NextRequest) {
  try {
    const authResult = await requireAdmin(req)
    if (authResult instanceof NextResponse) return authResult
    const { admin } = authResult

    const body = await req.json()
    const { id, status, reviewNotes, deleteContent, issueStrike } = body

    if (!id || typeof id !== 'number') {
      return NextResponse.json(
        { error: 'Flagged content ID is required' },
        { status: 400 }
      )
    }

    if (!status || !['approved', 'rejected', 'deleted'].includes(status)) {
      return NextResponse.json(
        { error: 'Valid status is required (approved, rejected, deleted)' },
        { status: 400 }
      )
    }

    const supabase = await sbServer()

    // Get the flagged content first
    const { data: flaggedContent, error: fetchError } = await supabase
      .from('FlaggedContent')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !flaggedContent) {
      return NextResponse.json(
        { error: 'Flagged content not found' },
        { status: 404 }
      )
    }

    // Update flagged content status
    const { data, error } = await supabase
      .from('FlaggedContent')
      .update({
        status,
        reviewedBy: admin.id,
        reviewedAt: new Date().toISOString(),
        reviewNotes: reviewNotes || null,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Failed to update flagged content:', error)
      return NextResponse.json(
        { error: 'Failed to update flagged content' },
        { status: 500 }
      )
    }

    // Delete the actual content if requested
    if (deleteContent && status === 'deleted') {
      const { contentType, contentId } = flaggedContent
      
      let deleteError = null
      if (contentType === 'listing') {
        const { error: err } = await supabase
          .from('Listing')
          .delete()
          .eq('id', contentId)
        deleteError = err
      } else if (contentType === 'message') {
        const { error: err } = await supabase
          .from('Message')
          .delete()
          .eq('id', contentId)
        deleteError = err
      } else if (contentType === 'event') {
        const { error: err } = await supabase
          .from('Event')
          .delete()
          .eq('id', contentId)
        deleteError = err
      }

      if (deleteError) {
        console.error('Failed to delete content:', deleteError)
      }

      // Log deletion
      await logAdminAction(
        admin.id,
        `deleted_${contentType}`,
        contentType,
        contentId,
        { flaggedContentId: id, reason: reviewNotes }
      )
    }

    // Issue strike if requested and content was rejected
    if (issueStrike && (status === 'rejected' || status === 'deleted')) {
      const { error: strikeError } = await supabase
        .from('UserStrike')
        .insert({
          userId: flaggedContent.userId,
          reason: flaggedContent.reason,
          severity: flaggedContent.severity === 'critical' ? 'severe' : 
                   flaggedContent.severity === 'high' ? 'major' : 'minor',
          flaggedContentId: id,
          issuedBy: admin.id,
          notes: reviewNotes,
        })

      if (strikeError) {
        console.error('Failed to issue strike:', strikeError)
      } else {
        await logAdminAction(
          admin.id,
          'issued_strike',
          'UserStrike',
          flaggedContent.userId,
          { flaggedContentId: id, reason: flaggedContent.reason }
        )
      }
    }

    // Log review action
    await logAdminAction(
      admin.id,
      `reviewed_${status}`,
      'FlaggedContent',
      id,
      { contentType: flaggedContent.contentType, contentId: flaggedContent.contentId }
    )

    return NextResponse.json({ data })
  } catch (error) {
    console.error('PATCH /api/admin/flagged-content error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
