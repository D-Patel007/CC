import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

// GET /api/events - List all events
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get("category")
    const upcoming = searchParams.get("upcoming") === "true"
    
    const where: any = {}
    
    if (category) {
      where.category = category
    }
    
    if (upcoming) {
      where.eventDate = {
        gte: new Date()
      }
    }
    
    const events = await prisma.event.findMany({
      where,
      orderBy: { eventDate: "asc" },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        },
        attendees: {
          select: {
            userId: true
          }
        }
      }
    })
    
    // Add attendee count to each event
    const eventsWithCount = events.map(event => ({
      ...event,
      attendeeCount: event.attendees.length
    }))
    
    return NextResponse.json({ data: eventsWithCount })
  } catch (error) {
    console.error("GET /api/events error:", error)
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 })
  }
}

// POST /api/events - Create new event
export async function POST(req: NextRequest) {
  try {
    const { profile } = await getCurrentUser()
    if (!profile) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }
    
    const body = await req.json()
    const {
      title,
      description,
      eventDate,
      startTime,
      endTime,
      location,
      imageUrl,
      capacity,
      category
    } = body
    
    if (!title || !description || !eventDate || !startTime || !location) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }
    
    const event = await prisma.event.create({
      data: {
        title,
        description,
        eventDate: new Date(eventDate),
        startTime,
        endTime: endTime || null,
        location,
        imageUrl: imageUrl || null,
        capacity: capacity ? parseInt(capacity) : null,
        category: category || null,
        organizerId: profile.id
      },
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
    
    return NextResponse.json({ data: event }, { status: 201 })
  } catch (error) {
    console.error("POST /api/events error:", error)
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 })
  }
}
