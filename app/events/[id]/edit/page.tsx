"use client"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
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
  capacity: number | null
  category: string | null
  organizerId: number
}

export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [event, setEvent] = useState<Event | null>(null)
  const [eventId, setEventId] = useState<string | null>(null)
  const [descriptionLength, setDescriptionLength] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    params.then(p => {
      setEventId(p.id)
      fetchEvent(p.id)
    })
  }, [params])

  async function fetchEvent(id: string) {
    try {
      const res = await fetch(`/api/events/${id}`)
      const data = await res.json()
      
      if (data.data) {
        setEvent(data.data)
        setDescriptionLength(data.data.description?.length || 0)
        if (data.data.imageUrl) {
          setImagePreview(data.data.imageUrl)
        }
      } else {
        setErrorMessage("Event not found")
      }
    } catch (error) {
      console.error("Failed to fetch event:", error)
      setErrorMessage("Failed to load event")
    } finally {
      setFetchLoading(false)
    }
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedImage(file)
    const previewUrl = URL.createObjectURL(file)
    setImagePreview(previewUrl)
  }

  function clearImage() {
    if (imagePreview && !event?.imageUrl) {
      URL.revokeObjectURL(imagePreview)
    }
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!eventId) return
    
    setLoading(true)
    setErrorMessage(null)

    try {
      const form = e.currentTarget
      const formData = new FormData(form)
      let imageUrl = event?.imageUrl || null

      // Upload new image if selected
      if (selectedImage) {
        const uploadFormData = new FormData()
        uploadFormData.append("file", selectedImage)
        uploadFormData.append("type", "listing")

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData
        })
        const uploadData = await uploadRes.json()

        if (uploadData.data?.url) {
          imageUrl = uploadData.data.url
        }
      }

      const data: any = Object.fromEntries(formData.entries())

      const title = (data.title as string)?.trim()
      const description = (data.description as string)?.trim()
      const eventDate = data.eventDate as string
      const startTimeStr = data.startTime as string
      const endTimeStr = data.endTime as string | undefined

      if (!eventDate || !startTimeStr) {
        setErrorMessage("Event date and start time are required")
        return
      }

      if (!title || title.length < 3) {
        setErrorMessage("Title must be at least 3 characters long")
        return
      }

      if (!description || description.length < 10) {
        setErrorMessage("Description must be at least 10 characters long")
        return
      }

      // Combine date + time into ISO format with timezone (Z for UTC)
      const startDateTime = `${eventDate}T${startTimeStr}:00Z`
      const endDateTime = endTimeStr ? `${eventDate}T${endTimeStr}:00Z` : null

      // Build the payload
      const payload = {
        title,
        description,
        startTime: startDateTime,
        endTime: endDateTime,
        location: data.location || null,
        imageUrl: imageUrl || null,
        category: data.category || null,
        capacity: data.capacity && data.capacity !== '' ? parseInt(data.capacity as string, 10) : null,
      }

      console.log("Event update payload:", payload)

      const res = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        const { data: updatedEvent } = await res.json()
        router.push(`/events/${updatedEvent.id}`)
      } else {
        const error = await res.json()
        console.error("Event update failed:", error)
        const validationMessages = Array.isArray(error.details)
          ? error.details.map((issue: { message?: string }) => issue.message).filter(Boolean)
          : []
        const message = validationMessages.length > 0
          ? validationMessages.join("\n")
          : error.error || "Failed to update event"
        setErrorMessage(message)
      }
    } catch (error) {
      console.error("Failed to update event:", error)
      setErrorMessage("Failed to update event")
    } finally {
      setLoading(false)
    }
  }

  // Get today's date in YYYY-MM-DD format for min attribute
  const today = new Date().toISOString().split("T")[0]

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-foreground-secondary">Loading event...</p>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="text-center py-12 text-foreground-secondary">
          <p className="text-lg text-foreground">Event not found</p>
          <Link href="/events" className="text-primary hover:underline mt-4 inline-block">
            ← Back to Events
          </Link>
        </div>
      </div>
    )
  }

  // Parse the event date and time for form defaults
  const eventDateObj = new Date(event.eventDate)
  const defaultDate = eventDateObj.toISOString().split("T")[0]
  
  // Extract time from startTime ISO string
  const startTimeObj = new Date(event.startTime)
  const defaultStartTime = startTimeObj.toISOString().substring(11, 16) // HH:MM
  
  const defaultEndTime = event.endTime 
    ? new Date(event.endTime).toISOString().substring(11, 16)
    : ""

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Link href={`/events/${eventId}`} className="text-blue-600 hover:underline">
          ← Back to Event
        </Link>
        <h1 className="text-3xl font-bold mt-4">Edit Event</h1>
        <p className="text-gray-500 mt-1">Update your event details</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 space-y-4">
        {errorMessage && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {errorMessage}
          </div>
        )}
        
        {/* Event Title */}
        <div>
          <label className="block text-sm font-medium mb-1">Event Title *</label>
          <input
            name="title"
            type="text"
            defaultValue={event.title}
            placeholder="e.g., Club Meeting, Study Session, Campus Tour"
            required
            minLength={3}
            className="w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1">Description *</label>
          <textarea
            name="description"
            defaultValue={event.description}
            placeholder="Tell people what your event is about..."
            required
            minLength={10}
            rows={5}
            onChange={(e) => setDescriptionLength(e.target.value.length)}
            className="w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            {descriptionLength} / 5000 characters (minimum 10 required)
          </p>
        </div>

        {/* Date and Time */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Date *</label>
            <input
              name="eventDate"
              type="date"
              defaultValue={defaultDate}
              min={today}
              required
              className="w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Start Time *</label>
            <input
              name="startTime"
              type="time"
              defaultValue={defaultStartTime}
              required
              className="w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">End Time</label>
            <input
              name="endTime"
              type="time"
              defaultValue={defaultEndTime}
              className="w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium mb-1">Location *</label>
          <input
            name="location"
            type="text"
            defaultValue={event.location}
            placeholder="e.g., Campus Center Room 101, Quinn Building"
            required
            className="w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Category and Capacity */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              name="category"
              defaultValue={event.category || ""}
              className="w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Category</option>
              <option value="Academic">Academic</option>
              <option value="Social">Social</option>
              <option value="Sports">Sports</option>
              <option value="Arts & Culture">Arts & Culture</option>
              <option value="Professional">Professional</option>
              <option value="Community Service">Community Service</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Capacity</label>
            <input
              name="capacity"
              type="number"
              min="1"
              defaultValue={event.capacity || ""}
              placeholder="Max attendees (optional)"
              className="w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Event Image */}
        <div>
          <label className="block text-sm font-medium mb-2">Event Image</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />

          {imagePreview ? (
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-h-48 rounded-lg border-2 border-blue-500"
              />
              <button
                type="button"
                onClick={clearImage}
                className="absolute -top-2 -right-2 bg-error text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-error-dark transition shadow-lg"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-lg border-2 border-dashed border-border p-6 text-center hover:border-primary hover:bg-primary/5 transition-all"
            >
              <div className="text-foreground-secondary">
                <span className="text-2xl block mb-2">📷</span>
                <span className="text-sm">Click to upload an image</span>
              </div>
            </button>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-4 flex gap-3">
          <button
            type="button"
            onClick={() => router.push(`/events/${eventId}`)}
            className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 font-medium transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-primary text-white py-3 rounded-lg hover:bg-primary-hover disabled:opacity-50 font-medium transition shadow-subtle"
          >
            {loading ? "Updating Event..." : "Update Event"}
          </button>
        </div>
      </form>
    </div>
  )
}
