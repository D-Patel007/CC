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
  organizer: {
    id: number
    name: string | null
  }
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "upcoming">("upcoming")

  useEffect(() => {
    fetchEvents()
  }, [filter])

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

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">UMass Boston Events</h1>
          <p className="mt-1 text-gray-500">Discover and join campus events</p>
        </div>
        <Link
          href="/events/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition"
        >
          ➕ Create Event
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setFilter("upcoming")}
          className={`px-4 py-2 rounded-lg transition ${
            filter === "upcoming"
              ? "bg-blue-600 text-white"
              : "bg-white border hover:bg-gray-50"
          }`}
        >
          Upcoming Events
        </button>
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg transition ${
            filter === "all"
              ? "bg-blue-600 text-white"
              : "bg-white border hover:bg-gray-50"
          }`}
        >
          All Events
        </button>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading events...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border">
          <p className="text-gray-500 text-lg">No events found</p>
          <p className="text-sm text-gray-400 mt-2">
            Be the first to create an event!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Link
              key={event.id}
              href={`/events/${event.id}`}
              className="bg-white rounded-xl border overflow-hidden hover:shadow-lg transition group"
            >
              {/* Event Image */}
              <div className="aspect-video bg-gradient-to-br from-blue-400 to-purple-500 relative overflow-hidden">
                {event.imageUrl ? (
                  <img
                    src={event.imageUrl}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-6xl">
                    📅
                  </div>
                )}
                {event.category && (
                  <span className="absolute top-2 right-2 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-medium">
                    {event.category}
                  </span>
                )}
              </div>

              {/* Event Info */}
              <div className="p-4 space-y-2">
                <h3 className="font-bold text-lg line-clamp-2 group-hover:text-blue-600 transition">
                  {event.title}
                </h3>
                
                <p className="text-sm text-gray-600 line-clamp-2">
                  {event.description}
                </p>

                <div className="space-y-1 text-sm pt-2">
                  <div className="flex items-center gap-2 text-gray-700">
                    <span>📅</span>
                    <span>{formatDate(event.eventDate)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-gray-700">
                    <span>🕐</span>
                    <span>
                      {formatTime(event.startTime)}
                      {event.endTime && ` - ${formatTime(event.endTime)}`}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-gray-700">
                    <span>📍</span>
                    <span className="line-clamp-1">{event.location}</span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-700 pt-1">
                    <span>👥</span>
                    <span>{event.attendeeCount} attending</span>
                  </div>
                </div>

                <div className="pt-2 border-t text-xs text-gray-500">
                  Organized by {event.organizer.name || "Anonymous"}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
