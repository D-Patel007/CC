"use client"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function NewEventPage() {
  const [loading, setLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedImage(file)
    const previewUrl = URL.createObjectURL(file)
    setImagePreview(previewUrl)
  }

  function clearImage() {
    if (imagePreview) {
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
    setLoading(true)

    try {
      const form = e.currentTarget
      const formData = new FormData(form)
      let imageUrl = null

      // Upload image if selected
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

      // Create event
      const data: any = Object.fromEntries(formData.entries())
      if (imageUrl) {
        data.imageUrl = imageUrl
      }

      // Combine date and time fields into ISO datetime strings
      const eventDate = data.eventDate as string
      const startTimeStr = data.startTime as string
      const endTimeStr = data.endTime as string | undefined

      if (!eventDate || !startTimeStr) {
        alert('Event date and start time are required')
        return
      }

      // Combine date + time into ISO format with timezone (Z for UTC)
      const startDateTime = `${eventDate}T${startTimeStr}:00Z`
      const endDateTime = endTimeStr ? `${eventDate}T${endTimeStr}:00Z` : null

      // Build the payload with combined datetime fields
      const payload = {
        title: data.title,
        description: data.description,
        startTime: startDateTime,
        endTime: endDateTime,
        location: data.location || null,
        imageUrl: data.imageUrl || null,
        category: data.category || null,
        capacity: data.capacity && data.capacity !== '' ? parseInt(data.capacity as string, 10) : null,
      }

      console.log("Event payload:", payload)

      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        const { data: event } = await res.json()
        router.push(`/events/${event.id}`)
      } else {
        const error = await res.json()
        console.error("Event creation failed:", error)
        alert(error.error || "Failed to create event")
      }
    } catch (error) {
      console.error("Failed to create event:", error)
      alert("Failed to create event")
    } finally {
      setLoading(false)
    }
  }

  // Get today's date in YYYY-MM-DD format for min attribute
  const today = new Date().toISOString().split("T")[0]

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Link href="/events" className="text-blue-600 hover:underline">
          ← Back to Events
        </Link>
        <h1 className="text-3xl font-bold mt-4">Create New Event</h1>
        <p className="text-gray-500 mt-1">Share your event with the UMass Boston community</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 space-y-4">
        {/* Event Title */}
        <div>
          <label className="block text-sm font-medium mb-1">Event Title *</label>
          <input
            name="title"
            type="text"
            placeholder="e.g., Club Meeting, Study Session, Campus Tour"
            required
            className="w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1">Description *</label>
          <textarea
            name="description"
            placeholder="Tell people what your event is about..."
            required
            rows={5}
            className="w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Date and Time */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Date *</label>
            <input
              name="eventDate"
              type="date"
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
              required
              className="w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">End Time</label>
            <input
              name="endTime"
              type="time"
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
        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary-hover disabled:opacity-50 font-medium transition shadow-subtle"
          >
            {loading ? "Creating Event..." : "Create Event"}
          </button>
        </div>
      </form>
    </div>
  )
}
