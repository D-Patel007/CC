'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface FlaggedContentItem {
  id: number
  contentType: 'listing' | 'message' | 'profile' | 'event'
  contentId: number
  userId: number
  reason: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending' | 'approved' | 'rejected' | 'deleted'
  source: 'auto' | 'user_report' | 'admin'
  details: any
  createdAt: string
  user?: {
    id: number
    name: string | null
  }
}

interface Stats {
  overview: {
    totalFlags: number
    pendingFlags: number
    rejectedFlags: number
    deletedContent: number
    totalStrikes: number
    activeStrikes: number
    suspendedUsers: number
    totalReports: number
    pendingReports: number
    flagsToday: number
  }
  severity: Record<string, number>
  contentType: Record<string, number>
}

export default function AdminModerationPage() {
  const router = useRouter()
  const [flaggedContent, setFlaggedContent] = useState<FlaggedContentItem[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('pending')
  const [severityFilter, setSeverityFilter] = useState<string>('')
  const [contentTypeFilter, setContentTypeFilter] = useState<string>('')
  const [selectedItem, setSelectedItem] = useState<FlaggedContentItem | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchData()
  }, [statusFilter, severityFilter, contentTypeFilter])

  async function fetchData() {
    try {
      setLoading(true)
      
      // Fetch flagged content
      const params = new URLSearchParams()
      // Only add filters if they have a non-empty value
      if (statusFilter && statusFilter !== '') params.append('status', statusFilter)
      if (severityFilter && severityFilter !== '') params.append('severity', severityFilter)
      if (contentTypeFilter && contentTypeFilter !== '') params.append('contentType', contentTypeFilter)
      
      const flagsRes = await fetch(`/api/admin/flagged-content?${params}`)
      const flagsData = await flagsRes.json()
      
      if (flagsRes.status === 403) {
        alert('You do not have admin access')
        router.push('/')
        return
      }
      
      if (flagsRes.ok) {
        setFlaggedContent(flagsData.data || [])
      }

      // Fetch stats
      const statsRes = await fetch('/api/admin/stats')
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData.data)
      }
    } catch (error) {
      console.error('Failed to fetch admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleReview(
    id: number,
    status: 'approved' | 'rejected' | 'deleted',
    deleteContent: boolean = false,
    issueStrike: boolean = false
  ) {
    setProcessing(true)
    try {
      const res = await fetch('/api/admin/flagged-content', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status,
          reviewNotes,
          deleteContent,
          issueStrike,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to review content')
      }

      alert(`Content ${status} successfully!`)
      setSelectedItem(null)
      setReviewNotes('')
      fetchData()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setProcessing(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      case 'low': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    }
  }

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">Loading admin dashboard...</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          🛡️ Moderation Dashboard
        </h1>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => router.push('/admin/users')}
            className="px-4 py-2 border border-border text-sm font-medium rounded-md hover:bg-background-secondary transition-colors"
          >
            User Management
          </button>
          <button
            onClick={() => router.push('/admin/prohibited-items')}
            className="px-4 py-2 bg-gray-800 !text-white rounded-md hover:bg-gray-700 transition-colors font-medium"
          >
            Manage Prohibited Items
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">{stats.overview.pendingFlags}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Pending Flags</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-red-600">{stats.overview.deletedContent}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Deleted Content</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-orange-600">{stats.overview.activeStrikes}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Active Strikes</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-purple-600">{stats.overview.suspendedUsers}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Suspended Users</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">{stats.overview.flagsToday}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Flags Today</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-200">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white [&>option]:text-gray-900 [&>option]:bg-white dark:[&>option]:text-white dark:[&>option]:bg-gray-700"
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="deleted">Deleted</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-200">Severity</label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white [&>option]:text-gray-900 [&>option]:bg-white dark:[&>option]:text-white dark:[&>option]:bg-gray-700"
            >
              <option value="">All</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-200">Content Type</label>
            <select
              value={contentTypeFilter}
              onChange={(e) => setContentTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white [&>option]:text-gray-900 [&>option]:bg-white dark:[&>option]:text-white dark:[&>option]:bg-gray-700"
            >
              <option value="">All</option>
              <option value="listing">Listings</option>
              <option value="message">Messages</option>
              <option value="profile">Profiles</option>
              <option value="event">Events</option>
            </select>
          </div>
        </div>
      </div>

      {/* Flagged Content List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold">Flagged Content Queue ({flaggedContent.length})</h2>
        </div>
        
        <div className="divide-y dark:divide-gray-700">
          {flaggedContent.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No flagged content found with current filters
            </div>
          ) : (
            flaggedContent.map((item) => (
              <div key={item.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(item.severity)}`}>
                        {item.severity.toUpperCase()}
                      </span>
                      <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700">
                        {item.contentType}
                      </span>
                      <span className="text-xs text-gray-500">
                        Source: {item.source}
                      </span>
                    </div>
                    <div className="font-medium text-gray-900 dark:text-white mb-1">
                      {item.reason}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      User: {item.user?.name || 'Unknown'} (ID: {item.userId}) • 
                      Content ID: {item.contentId} • 
                      {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedItem(item)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                  >
                    Review
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Review Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">Review Flagged Content</h3>
            
            <div className="space-y-3 mb-6">
              <div>
                <span className="font-medium">Content Type:</span> {selectedItem.contentType}
              </div>
              <div>
                <span className="font-medium">Content ID:</span> {selectedItem.contentId}
              </div>
              <div>
                <span className="font-medium">User:</span> {selectedItem.user?.name} (ID: {selectedItem.userId})
              </div>
              <div>
                <span className="font-medium">Reason:</span> {selectedItem.reason}
              </div>
              <div>
                <span className="font-medium">Severity:</span> 
                <span className={`ml-2 px-2 py-1 rounded text-xs ${getSeverityColor(selectedItem.severity)}`}>
                  {selectedItem.severity}
                </span>
              </div>
              <div>
                <span className="font-medium">Details:</span>
                <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs overflow-auto">
                  {JSON.stringify(selectedItem.details, null, 2)}
                </pre>
              </div>
            </div>

            <div className="mb-4">
              <label className="block font-medium mb-2">Review Notes</label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                rows={3}
                placeholder="Add notes about your decision..."
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleReview(selectedItem.id, 'approved', false, false)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                disabled={processing}
              >
                ✅ Approve
              </button>
              <button
                onClick={() => handleReview(selectedItem.id, 'rejected', false, false)}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                disabled={processing}
              >
                ⚠️ Reject
              </button>
              <button
                onClick={() => handleReview(selectedItem.id, 'rejected', false, true)}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                disabled={processing}
              >
                🚨 Reject + Strike
              </button>
              <button
                onClick={() => handleReview(selectedItem.id, 'deleted', true, true)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                disabled={processing}
              >
                🗑️ Delete + Strike
              </button>
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                disabled={processing}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
