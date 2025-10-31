import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { sanitizeString, validateDate, validateInteger, checkRateLimit } from "@/lib/validation"

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
      },
      take: 100 // Limit to prevent too many results
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

    // Rate limiting: 5 events per hour per user
    if (!checkRateLimit(`event-create:${profile.id}`, 5, 3600000)) {
      return NextResponse.json({ error: "Too many events created. Please try again later." }, { status: 429 })
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
    
    // Validate required fields
    const sanitizedTitle = sanitizeString(title, 200)
    const sanitizedDescription = sanitizeString(description, 2000)
    const sanitizedLocation = sanitizeString(location, 300)
    
    if (!sanitizedTitle || !sanitizedDescription || !sanitizedLocation) {
      return NextResponse.json(
        { error: "Missing or invalid required fields" },
        { status: 400 }
      )
    }

    // Validate date
    const validatedDate = validateDate(eventDate)
    if (!validatedDate) {
      return NextResponse.json({ error: "Invalid event date" }, { status: 400 })
    }

    // Ensure event is not in the past
    if (validatedDate < new Date()) {
      return NextResponse.json({ error: "Event date must be in the future" }, { status: 400 })
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    if (!startTime || !timeRegex.test(startTime)) {
      return NextResponse.json({ error: "Invalid start time format" }, { status: 400 })
    }

    if (endTime && !timeRegex.test(endTime)) {
      return NextResponse.json({ error: "Invalid end time format" }, { status: 400 })
    }

    // Validate capacity
    let validatedCapacity = null
    if (capacity) {
      validatedCapacity = validateInteger(capacity, 1, 10000)
      if (validatedCapacity === null) {
        return NextResponse.json({ error: "Invalid capacity value" }, { status: 400 })
      }
    }

    // Validate category
    const allowedCategories = ["Academic", "Social", "Sports", "Arts & Culture", "Professional", "Community Service", "Other"]
    const sanitizedCategory = category ? sanitizeString(category, 50) : null
    if (sanitizedCategory && !allowedCategories.includes(sanitizedCategory)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 })
    }
    
    const event = await prisma.event.create({
      data: {
        title: sanitizedTitle,
        description: sanitizedDescription,
        eventDate: validatedDate,
        startTime,
        endTime: endTime || null,
        location: sanitizedLocation,
        imageUrl: imageUrl ? sanitizeString(imageUrl, 500) : null,
        capacity: validatedCapacity,
        category: sanitizedCategory,
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
