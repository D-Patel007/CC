/**
 * API Route: /api/admin/stats
 * Get moderation statistics and metrics
 * Admin/Moderator only
 */

import { NextRequest, NextResponse } from 'next/server'
import { sbServer } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin-middleware'

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAdmin(req)
    if (authResult instanceof NextResponse) return authResult

    const supabase = await sbServer()

    // Get overall stats
    const [
      flaggedContentStats,
      userStrikeStats,
      suspendedUserStats,
      reportStats,
      todayStats,
    ] = await Promise.all([
      // Flagged content stats by status
      supabase
        .from('FlaggedContent')
        .select('status', { count: 'exact', head: false })
        .then(res => {
          if (res.error) throw res.error
          const stats: Record<string, number> = { total: 0 }
          res.data?.forEach(item => {
            stats[item.status] = (stats[item.status] || 0) + 1
            stats.total++
          })
          return stats
        }),

      // User strike stats
      supabase
        .from('UserStrike')
        .select('isActive', { count: 'exact' })
        .then(res => ({
          total: res.count || 0,
          active: res.data?.filter(s => s.isActive).length || 0,
        })),

      // Suspended users
      supabase
        .from('Profile')
        .select('id', { count: 'exact' })
        .eq('isSuspended', true)
        .then(res => res.count || 0),

      // Report stats
      supabase
        .from('UserReport')
        .select('status', { count: 'exact', head: false })
        .then(res => {
          if (res.error) throw res.error
          const stats: Record<string, number> = { total: 0 }
          res.data?.forEach(item => {
            stats[item.status] = (stats[item.status] || 0) + 1
            stats.total++
          })
          return stats
        }),

      // Today's activity
      supabase
        .from('FlaggedContent')
        .select('id', { count: 'exact' })
        .gte('createdAt', new Date().toISOString().split('T')[0])
        .then(res => ({ flagsToday: res.count || 0 })),
    ])

    // Get severity breakdown
    const { data: severityData } = await supabase
      .from('FlaggedContent')
      .select('severity')
      .eq('status', 'pending')

    const severityBreakdown: Record<string, number> = {}
    severityData?.forEach(item => {
      severityBreakdown[item.severity] = (severityBreakdown[item.severity] || 0) + 1
    })

    // Get content type breakdown
    const { data: contentTypeData } = await supabase
      .from('FlaggedContent')
      .select('contentType')
      .eq('status', 'pending')

    const contentTypeBreakdown: Record<string, number> = {}
    contentTypeData?.forEach(item => {
      contentTypeBreakdown[item.contentType] = (contentTypeBreakdown[item.contentType] || 0) + 1
    })

    // Get top violators (users with most flags)
    const { data: topViolators } = await supabase
      .from('FlaggedContent')
      .select(`
        userId,
        user:userId (
          id,
          name
        )
      `)
      .limit(100)

    const violatorCounts: Record<number, { name: string | null; count: number }> = {}
    topViolators?.forEach((item: any) => {
      const userId = item.userId
      if (!violatorCounts[userId]) {
        violatorCounts[userId] = {
          name: item.user?.name || 'Unknown',
          count: 0,
        }
      }
      violatorCounts[userId].count++
    })

    const topViolatorsArray = Object.entries(violatorCounts)
      .map(([userId, data]) => ({
        userId: parseInt(userId),
        name: data.name,
        flagCount: data.count,
      }))
      .sort((a, b) => b.flagCount - a.flagCount)
      .slice(0, 10)

    // Get recent moderation actions
    const { data: recentActions } = await supabase
      .from('ModerationLog')
      .select(`
        *,
        admin:adminId (
          id,
          name
        )
      `)
      .order('createdAt', { ascending: false })
      .limit(20)

    return NextResponse.json({
      data: {
        overview: {
          totalFlags: flaggedContentStats.total || 0,
          pendingFlags: flaggedContentStats.pending || 0,
          rejectedFlags: flaggedContentStats.rejected || 0,
          deletedContent: flaggedContentStats.deleted || 0,
          totalStrikes: userStrikeStats.total,
          activeStrikes: userStrikeStats.active,
          suspendedUsers: suspendedUserStats,
          totalReports: reportStats.total || 0,
          pendingReports: reportStats.pending || 0,
          flagsToday: todayStats.flagsToday,
        },
        severity: severityBreakdown,
        contentType: contentTypeBreakdown,
        topViolators: topViolatorsArray,
        recentActions: recentActions || [],
      },
    })
  } catch (error) {
    console.error('GET /api/admin/stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
