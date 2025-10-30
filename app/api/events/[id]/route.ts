import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

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
