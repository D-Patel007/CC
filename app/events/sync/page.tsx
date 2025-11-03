"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function EventsSyncPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [previewMode, setPreviewMode] = useState(true)

  async function handleSync() {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const url = `/api/events/scrape?date=${selectedDate}${!previewMode ? '&save=true' : ''}`
      const res = await fetch(url)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to sync events')
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  function handleDateChange(days: number) {
    const date = new Date(selectedDate)
    date.setDate(date.getDate() + days)
    setSelectedDate(date.toISOString().split('T')[0])
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Sync UMass Boston Events</h1>
        <p className="mt-1 text-foreground-secondary">
          Import official UMass Boston events into Campus Connect
        </p>
      </div>

      <div className="bg-white rounded-xl border p-6 space-y-6">
        {/* Date Selector */}
        <div>
          <label className="block text-sm font-medium mb-2">Select Date</label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDateChange(-1)}
              className="px-3 py-2 border rounded-lg hover:bg-gray-50"
            >
              ← Previous Day
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-lg"
            />
            <button
              onClick={() => handleDateChange(1)}
              className="px-3 py-2 border rounded-lg hover:bg-gray-50"
            >
              Next Day →
            </button>
          </div>
        </div>

        {/* Mode Toggle */}
        <div>
          <label className="block text-sm font-medium mb-2">Mode</label>
          <div className="flex gap-2">
            <button
              onClick={() => setPreviewMode(true)}
              className={`px-4 py-2 rounded-lg transition ${
                previewMode
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              Preview Only
            </button>
            <button
              onClick={() => setPreviewMode(false)}
              className={`px-4 py-2 rounded-lg transition ${
                !previewMode
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              Import to Database
            </button>
          </div>
          <p className="text-sm text-foreground-secondary mt-2">
            {previewMode
              ? 'Preview mode will show events without saving them'
              : '⚠️ Import mode will save events to the database'}
          </p>
        </div>

        {/* Sync Button */}
        <button
          onClick={handleSync}
          disabled={loading}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
        >
          {loading ? 'Loading...' : previewMode ? 'Preview Events' : 'Import Events'}
        </button>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 font-medium">Error</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Results Display */}
        {result && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-700 font-medium">✓ {result.message}</p>
            {result.total !== undefined && (
              <p className="text-sm text-green-600 mt-1">
                Found: {result.total} events
                {result.duplicates !== undefined && ` | Duplicates skipped: ${result.duplicates}`}
                {result.data?.length > 0 && ` | New: ${result.data.length}`}
              </p>
            )}
          </div>
        )}

        {/* Preview Events List */}
        {result?.data && result.data.length > 0 && (
          <div className="border-t pt-6">
            <h3 className="font-bold text-lg mb-4">
              {previewMode ? 'Preview' : 'Imported'} Events ({result.data.length})
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {result.data.map((event: any, index: number) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition"
                >
                  <div className="font-semibold">{event.title}</div>
                  <div className="text-sm text-foreground-secondary mt-1">
                    <div>🕐 {event.startTime} {event.endTime && `- ${event.endTime}`}</div>
                    <div>📍 {event.location}</div>
                    {event.organization && (
                      <div>🏢 {event.organization}</div>
                    )}
                    {event.description && previewMode && (
                      <div className="mt-2 text-foreground-secondary text-xs line-clamp-2">
                        {event.description}
                      </div>
                    )}
                    {event.url && (
                      <a
                        href={event.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-xs mt-1 inline-block"
                      >
                        View on UMass Boston →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Back Button */}
        <button
          onClick={() => router.push('/events')}
          className="w-full border px-4 py-2 rounded-lg hover:bg-gray-50 transition"
        >
          Back to Events
        </button>
      </div>
    </div>
  )
}
