/**
 * API Route: /api/reports
 * Submit user reports for inappropriate content
 * Authenticated users only
 */

import { NextRequest, NextResponse } from 'next/server'
import { sbServer } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth-middleware'
import { rateLimit, RateLimits, getRateLimitIdentifier } from '@/lib/rate-limit'
import { z } from 'zod'
import { sendContentFlaggedNotification } from '@/lib/email'

const reportSchema = z.object({
  contentType: z.enum(['listing', 'message', 'profile', 'event']),
  contentId: z.number().int().positive(),
  category: z.string().min(1).max(100), // 'scam', 'spam', 'inappropriate', 'harassment', 'fake', 'other'
  description: z.string().max(1000).optional(),
})

// POST /api/reports - Submit a report
export async function POST(req: NextRequest) {
  try {
    // Authentication
    const authResult = await requireAuth(req)
    if (authResult instanceof NextResponse) return authResult
    const { user } = authResult

    // Rate limiting - prevent report spam
    const rateLimitIdentifier = getRateLimitIdentifier(req, 'reports:create', user.id)
    const rateLimitResponse = rateLimit(rateLimitIdentifier, RateLimits.STRICT)
    if (rateLimitResponse) return rateLimitResponse

    // Validation
    const body = await req.json()
    const validation = reportSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { contentType, contentId, category, description } = validation.data
    const supabase = await sbServer()

    // Check if content exists
    let contentExists = false
    if (contentType === 'listing') {
      const { data } = await supabase
        .from('Listing')
        .select('id')
        .eq('id', contentId)
        .single()
      contentExists = !!data
    } else if (contentType === 'message') {
      const { data } = await supabase
        .from('Message')
        .select('id')
        .eq('id', contentId)
        .single()
      contentExists = !!data
    } else if (contentType === 'profile') {
      const { data } = await supabase
        .from('Profile')
        .select('id')
        .eq('id', contentId)
        .single()
      contentExists = !!data
    } else if (contentType === 'event') {
      const { data } = await supabase
        .from('Event')
        .select('id')
        .eq('id', contentId)
        .single()
      contentExists = !!data
    }

    if (!contentExists) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      )
    }

    // Check for duplicate reports from same user
    const { data: existingReport } = await supabase
      .from('UserReport')
      .select('id')
      .eq('reporterId', user.id)
      .eq('contentType', contentType)
      .eq('contentId', contentId)
      .single()

    if (existingReport) {
      return NextResponse.json(
        { error: 'You have already reported this content' },
        { status: 400 }
      )
    }

    // Create the report
    const { data: report, error: reportError } = await supabase
      .from('UserReport')
      .insert({
        reporterId: user.id,
        contentType,
        contentId,
        category,
        description: description || null,
        status: 'pending',
      })
      .select()
      .single()

    if (reportError) {
      console.error('Failed to create report:', reportError)
      return NextResponse.json(
        { error: 'Failed to submit report' },
        { status: 500 }
      )
    }

    // Auto-create flagged content if multiple reports for same content
    const { data: reportCount } = await supabase
      .from('UserReport')
      .select('id', { count: 'exact' })
      .eq('contentType', contentType)
      .eq('contentId', contentId)

    // If 3+ reports, auto-flag for admin review
    if (reportCount && reportCount.length >= 3) {
      // Get content owner
      let contentOwnerId = null
      if (contentType === 'listing') {
        const { data } = await supabase
          .from('Listing')
          .select('sellerId')
          .eq('id', contentId)
          .single()
        contentOwnerId = data?.sellerId
      } else if (contentType === 'message') {
        const { data } = await supabase
          .from('Message')
          .select('senderId')
          .eq('id', contentId)
          .single()
        contentOwnerId = data?.senderId
      } else if (contentType === 'event') {
        const { data } = await supabase
          .from('Event')
          .select('organizerId')
          .eq('id', contentId)
          .single()
        contentOwnerId = data?.organizerId
      } else if (contentType === 'profile') {
        contentOwnerId = contentId
      }

      if (contentOwnerId) {
        // Check if already flagged
        const { data: existingFlag } = await supabase
          .from('FlaggedContent')
          .select('id')
          .eq('contentType', contentType)
          .eq('contentId', contentId)
          .single()

        if (!existingFlag) {
          await supabase.from('FlaggedContent').insert({
            contentType,
            contentId,
            userId: contentOwnerId,
            reason: `Multiple user reports: ${category}`,
            severity: 'high',
            status: 'pending',
            source: 'user_report',
            details: {
              reportCount: reportCount.length,
              categories: [category],
            },
          })

          // Send email notification to content owner
          try {
            const { data: ownerAuth } = await supabase.auth.admin.getUserById(
              contentOwnerId.toString()
            )
            const { data: ownerProfile } = await supabase
              .from('Profile')
              .select('name, emailNotifications, emailContentFlags')
              .eq('id', contentOwnerId)
              .single()

            if (ownerAuth?.user?.email && ownerProfile &&
                ownerProfile.emailNotifications !== false &&
                ownerProfile.emailContentFlags !== false) {
              // Get content title
              let contentTitle = 'Your content'
              if (contentType === 'listing') {
                const { data: listing } = await supabase
                  .from('Listing')
                  .select('title')
                  .eq('id', contentId)
                  .single()
                contentTitle = listing?.title || 'Your listing'
              } else if (contentType === 'event') {
                const { data: event } = await supabase
                  .from('Event')
                  .select('title')
                  .eq('id', contentId)
                  .single()
                contentTitle = event?.title || 'Your event'
              } else if (contentType === 'message') {
                contentTitle = 'Your message'
              } else if (contentType === 'profile') {
                contentTitle = 'Your profile'
              }

              await sendContentFlaggedNotification({
                userEmail: ownerAuth.user.email,
                userName: ownerProfile.name || 'User',
                contentType,
                contentTitle,
                reason: `Multiple user reports: ${category}`,
                severity: 'high',
                dashboardUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/profile`
              })
            }
          } catch (emailError) {
            console.error('Failed to send flagged content email:', emailError)
          }
        }
      }
    }

    return NextResponse.json(
      {
        data: report,
        message: 'Report submitted successfully. Our team will review it shortly.',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/reports error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/reports - Get user's own reports
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(req)
    if (authResult instanceof NextResponse) return authResult
    const { user } = authResult

    const supabase = await sbServer()
    const { data, error } = await supabase
      .from('UserReport')
      .select('*')
      .eq('reporterId', user.id)
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('Failed to fetch reports:', error)
      return NextResponse.json(
        { error: 'Failed to fetch reports' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('GET /api/reports error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
