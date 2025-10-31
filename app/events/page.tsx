"use client"
import { useState, useEffect } from "react"
import Link from "next/link"

type Event = {
  id: number
  title: string
  description: string
  eventDate: string
  startTime: string
  endTime: string | null
  location: string
  imageUrl: string | null
  category: string | null
  attendeeCount: number
  isExternal: boolean
  externalSource: string | null
  organizer: {
    id: number
    name: string | null
  }
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "upcoming">("upcoming")
  const [sourceFilter, setSourceFilter] = useState<"all" | "community" | "official">("all")
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const [deletingEventId, setDeletingEventId] = useState<number | null>(null)

  useEffect(() => {
    fetchEvents()
    fetchCurrentUser()
  }, [filter])

  async function fetchCurrentUser() {
    try {
      const res = await fetch("/api/profile")
      const data = await res.json()
      if (data.data) {
        setCurrentUserId(data.data.id)
      }
    } catch (error) {
      console.error("Failed to fetch user:", error)
    }
  }

  // Filter events by source
  const filteredEvents = events.filter(event => {
    if (sourceFilter === "all") return true
    if (sourceFilter === "official") return event.isExternal
    if (sourceFilter === "community") return !event.isExternal
    return true
  })

  async function fetchEvents() {
    try {
      const params = new URLSearchParams()
      if (filter === "upcoming") {
        params.append("upcoming", "true")
      }
      
      const res = await fetch(`/api/events?${params}`)
      const data = await res.json()
      
      if (data.data) {
        setEvents(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch events:", error)
    } finally {
      setLoading(false)
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric"
    })
  }

  function formatTime(time: string) {
    // Convert 24h time to 12h format
    const [hours, minutes] = time.split(":")
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  async function handleDeleteEvent(eventId: number, eventTitle: string, e: React.MouseEvent) {
    e.preventDefault() // Prevent navigation to event detail page
    e.stopPropagation()
    
    const confirmed = confirm(`Are you sure you want to delete "${eventTitle}"? This action cannot be undone.`)
    if (!confirmed) return

    setDeletingEventId(eventId)
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "DELETE"
      })

      if (res.ok) {
        // Remove event from local state
        setEvents(events.filter(e => e.id !== eventId))
      } else {
        const error = await res.json()
        alert(error.error || "Failed to delete event")
      }
    } catch (error) {
      console.error("Delete failed:", error)
      alert("Failed to delete event")
    } finally {
      setDeletingEventId(null)
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">UMass Boston Events</h1>
          <p className="mt-1 text-foreground-secondary">Discover and join campus events</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/events/sync"
            className="rounded-lg bg-secondary px-4 py-2 text-white shadow-subtle hover:opacity-90 transition"
          >
            🔄 Sync UMB Events
          </Link>
          <Link
            href="/events/new"
            className="rounded-lg bg-primary px-4 py-2 text-white shadow-subtle hover:bg-primary-hover transition"
          >
            ➕ Create Event
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-3">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("upcoming")}
            className={`px-4 py-2 rounded-lg transition ${
              filter === "upcoming"
                ? "bg-primary text-white shadow-subtle"
                : "border border-border bg-[var(--background-secondary)] text-foreground-secondary hover:text-foreground"
            }`}
          >
            Upcoming Events
          </button>
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg transition ${
              filter === "all"
                ? "bg-primary text-white shadow-subtle"
                : "border border-border bg-[var(--background-secondary)] text-foreground-secondary hover:text-foreground"
            }`}
          >
            All Events
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setSourceFilter("all")}
            className={`px-4 py-2 rounded-lg transition text-sm ${
              sourceFilter === "all"
                ? "bg-primary text-white shadow-subtle"
                : "border border-border bg-[var(--background-secondary)] text-foreground-secondary hover:text-foreground"
            }`}
          >
            All Sources
          </button>
          <button
            onClick={() => setSourceFilter("official")}
            className={`px-4 py-2 rounded-lg transition text-sm ${
              sourceFilter === "official"
                ? "bg-success text-white shadow-subtle"
                : "border border-border bg-[var(--background-secondary)] text-foreground-secondary hover:text-foreground"
            }`}
          >
            🏛️ Official UMass
          </button>
          <button
            onClick={() => setSourceFilter("community")}
            className={`px-4 py-2 rounded-lg transition text-sm ${
              sourceFilter === "community"
                ? "bg-primary text-white shadow-subtle"
                : "border border-border bg-[var(--background-secondary)] text-foreground-secondary hover:text-foreground"
            }`}
          >
            👥 Community Events
          </button>
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="text-center py-12 text-foreground-secondary">
          <p>Loading events...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-12 bg-[var(--card-bg)] rounded-xl border border-border text-foreground-secondary shadow-subtle">
          <p className="text-lg text-foreground">No events found</p>
          <p className="text-sm mt-2">
            {sourceFilter === "official" 
              ? "Try syncing UMass Boston events or check back later"
              : "Be the first to create an event!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => {
            const isOrganizer = event.organizer.id === currentUserId
            return (
            <div key={event.id} className="relative group">
              <Link
                href={`/events/${event.id}`}
                className="block rounded-xl border border-border bg-[var(--card-bg)] overflow-hidden hover:shadow-float transition"
              >
              {/* Event Image */}
              <div className="aspect-video bg-gradient-to-br from-[rgba(129,140,248,0.35)] via-[rgba(14,21,33,0.65)] to-[rgba(14,116,144,0.4)] relative overflow-hidden">
                {event.imageUrl ? (
                  <img
                    src={event.imageUrl}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-6xl">
                    {event.isExternal ? '🏛️' : '📅'}
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-2">
                  {event.isExternal && (
                    <span className="bg-success text-white px-3 py-1 rounded-full text-xs font-bold shadow-subtle">
                      🏛️ Official UMass
                    </span>
                  )}
                  {event.category && !event.isExternal && (
                    <span className="bg-[rgba(17,26,45,0.88)] backdrop-blur px-3 py-1 rounded-full text-xs font-medium text-foreground">
                      {event.category}
                    </span>
                  )}
                </div>
              </div>

              {/* Event Info */}
                <div className="p-4 space-y-2">
                <h3 className="font-bold text-lg line-clamp-2 text-foreground group-hover:text-primary transition">
                  {event.title}
                </h3>
                
                <p className="text-sm text-foreground-secondary line-clamp-2">
                  {event.description}
                </p>

                <div className="space-y-1 text-sm pt-2">
                  <div className="flex items-center gap-2 text-foreground-secondary">
                    <span>📅</span>
                    <span>{formatDate(event.eventDate)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-foreground-secondary">
                    <span>🕐</span>
                    <span>
                      {formatTime(event.startTime)}
                      {event.endTime && ` - ${formatTime(event.endTime)}`}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-foreground-secondary">
                    <span>📍</span>
                    <span className="line-clamp-1">{event.location}</span>
                  </div>

                  <div className="flex items-center gap-2 text-foreground-secondary pt-1">
                    <span>👥</span>
                    <span>{event.attendeeCount} attending</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-border text-xs text-foreground-secondary">
                  {event.isExternal ? (
                    <div className="flex items-center justify-between">
                      <span>Official UMass Boston Event</span>
                      {event.externalSource && (
                        <a
                          href={event.externalSource}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-primary hover:underline"
                        >
                          View Details →
                        </a>
                      )}
                    </div>
                  ) : (
                    <span>Organized by {event.organizer.name || "Anonymous"}</span>
                  )}
                </div>
              </div>
            </Link>
            
            {/* Delete Button (for organizers only, shows on hover) */}
            {isOrganizer && !event.isExternal && (
              <button
                onClick={(e) => handleDeleteEvent(event.id, event.title, e)}
                disabled={deletingEventId === event.id}
                className="absolute top-2 left-2 bg-error text-white px-3 py-1 rounded-lg text-xs font-medium shadow-subtle opacity-0 group-hover:opacity-100 transition hover:opacity-90 disabled:opacity-50 z-10"
                title="Delete event"
              >
                {deletingEventId === event.id ? "Deleting..." : "🗑️ Delete"}
              </button>
            )}
          </div>
          )})}
        </div>
      )}
    </div>
  )
}
