import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { sanitizeString, validateDate, validateInteger, checkRateLimit } from "@/lib/validation"

type RouteParams = {
  params: Promise<{ id: string }>
}

// GET /api/events/[id] - Get event details
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const eventId = parseInt(id)
    
    if (isNaN(eventId)) {
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 })
    }
    
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            createdAt: true
          }
        },
        attendees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true
              }
            }
          }
        }
      }
    })
    
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }
    
    return NextResponse.json({ data: event })
  } catch (error) {
    console.error("GET /api/events/[id] error:", error)
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 })
  }
}

// POST /api/events/[id] - RSVP to event
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { profile } = await getCurrentUser()
    if (!profile) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }
    
    const { id } = await params
    const eventId = parseInt(id)
    
    if (isNaN(eventId)) {
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 })
    }
    
    const body = await req.json()
    const { action } = body // "rsvp" or "cancel"
    
    if (action === "rsvp") {
      // Check if user already RSVPed
      const existing = await prisma.eventAttendee.findUnique({
        where: {
          eventId_userId: {
            eventId,
            userId: profile.id
          }
        }
      })
      
      if (existing) {
        return NextResponse.json({ error: "Already RSVPed" }, { status: 400 })
      }
      
      // Check capacity
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
          attendees: true
        }
      })
      
      if (!event) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 })
      }
      
      if (event.capacity && event.attendees.length >= event.capacity) {
        return NextResponse.json({ error: "Event is at capacity" }, { status: 400 })
      }
      
      // Create RSVP
      await prisma.eventAttendee.create({
        data: {
          eventId,
          userId: profile.id
        }
      })
      
      return NextResponse.json({ message: "RSVP successful" })
    } else if (action === "cancel") {
      // Cancel RSVP
      await prisma.eventAttendee.delete({
        where: {
          eventId_userId: {
            eventId,
            userId: profile.id
          }
        }
      })
      
      return NextResponse.json({ message: "RSVP cancelled" })
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("POST /api/events/[id] error:", error)
    return NextResponse.json({ error: "Failed to process RSVP" }, { status: 500 })
  }
}

// PATCH /api/events/[id] - Update event (organizer only)
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { profile } = await getCurrentUser()
    if (!profile) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { id } = await params
    const eventId = parseInt(id)
    
    if (isNaN(eventId)) {
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 })
    }

    // Check if user is the organizer
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId }
    })

    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    if (existingEvent.organizerId !== profile.id) {
      return NextResponse.json({ error: "Only the organizer can edit this event" }, { status: 403 })
    }

    // Rate limiting: 10 updates per hour per user
    if (!checkRateLimit(`event-update:${profile.id}`, 10, 3600000)) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 })
    }

    const body = await req.json()
    const updateData: any = {}

    // Validate and sanitize each field if present
    if (body.title !== undefined) {
      const sanitizedTitle = sanitizeString(body.title, 200)
      if (!sanitizedTitle) {
        return NextResponse.json({ error: "Invalid title" }, { status: 400 })
      }
      updateData.title = sanitizedTitle
    }

    if (body.description !== undefined) {
      const sanitizedDescription = sanitizeString(body.description, 2000)
      if (!sanitizedDescription) {
        return NextResponse.json({ error: "Invalid description" }, { status: 400 })
      }
      updateData.description = sanitizedDescription
    }

    if (body.location !== undefined) {
      const sanitizedLocation = sanitizeString(body.location, 300)
      if (!sanitizedLocation) {
        return NextResponse.json({ error: "Invalid location" }, { status: 400 })
      }
      updateData.location = sanitizedLocation
    }

    if (body.eventDate !== undefined) {
      const validatedDate = validateDate(body.eventDate)
      if (!validatedDate || validatedDate < new Date()) {
        return NextResponse.json({ error: "Event date must be in the future" }, { status: 400 })
      }
      updateData.eventDate = validatedDate
    }

    if (body.startTime !== undefined) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      if (!timeRegex.test(body.startTime)) {
        return NextResponse.json({ error: "Invalid start time format" }, { status: 400 })
      }
      updateData.startTime = body.startTime
    }

    if (body.endTime !== undefined) {
      if (body.endTime) {
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
        if (!timeRegex.test(body.endTime)) {
          return NextResponse.json({ error: "Invalid end time format" }, { status: 400 })
        }
        updateData.endTime = body.endTime
      } else {
        updateData.endTime = null
      }
    }

    if (body.capacity !== undefined) {
      if (body.capacity === null || body.capacity === "") {
        updateData.capacity = null
      } else {
        const validatedCapacity = validateInteger(body.capacity, 1, 10000)
        if (validatedCapacity === null) {
          return NextResponse.json({ error: "Invalid capacity value" }, { status: 400 })
        }
        updateData.capacity = validatedCapacity
      }
    }

    if (body.category !== undefined) {
      const allowedCategories = ["Academic", "Social", "Sports", "Arts & Culture", "Professional", "Community Service", "Other"]
      if (body.category) {
        const sanitizedCategory = sanitizeString(body.category, 50)
        if (!allowedCategories.includes(sanitizedCategory)) {
          return NextResponse.json({ error: "Invalid category" }, { status: 400 })
        }
        updateData.category = sanitizedCategory
      } else {
        updateData.category = null
      }
    }

    if (body.imageUrl !== undefined) {
      updateData.imageUrl = body.imageUrl ? sanitizeString(body.imageUrl, 500) : null
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: updateData,
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        }
      }
    })

    return NextResponse.json({ data: updatedEvent })
  } catch (error) {
    console.error("PATCH /api/events/[id] error:", error)
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 })
  }
}

// DELETE /api/events/[id] - Delete event (organizer only)
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { profile } = await getCurrentUser()
    if (!profile) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { id } = await params
    const eventId = parseInt(id)
    
    if (isNaN(eventId)) {
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 })
    }

    // Check if user is the organizer
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId }
    })

    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    if (existingEvent.organizerId !== profile.id) {
      return NextResponse.json({ error: "Only the organizer can delete this event" }, { status: 403 })
    }

    // Delete the event (cascade will delete attendees)
    await prisma.event.delete({
      where: { id: eventId }
    })

    return NextResponse.json({ message: "Event deleted successfully" })
  } catch (error) {
    console.error("DELETE /api/events/[id] error:", error)
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 })
  }
}

