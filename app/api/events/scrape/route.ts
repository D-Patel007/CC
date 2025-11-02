import { NextRequest, NextResponse } from "next/server"
import { load } from "cheerio"
import { sbServer } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"

// Helper function to parse event details from the UMass Boston events page
async function scrapeUMBEvents(date?: string) {
  try {
    // If no date provided, use today
    const today = date ? new Date(date) : new Date()
    const day = today.getDate()
    const month = today.getMonth() + 1
    const year = today.getFullYear()
    
    // Fetch events for the specified date
    const url = `https://www.umb.edu/events/?day=${day}&month=${month}&year=${year}&search=day`
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch UMB events: ${response.status}`)
    }
    
    const html = await response.text()
    const $ = load(html)
    
    const events: any[] = []
    
    // Parse event items
    $('a[href*="/events/events/"]').each((i, element) => {
      const $el = $(element)
      const title = $el.text().trim()
      const href = $el.attr('href')
      
      if (!title || !href) return
      
      // Find the event details (usually in the next elements or parent)
      const $parent = $el.parent()
      const $container = $parent.parent()
      
      // Try to extract time and location
      const text = $container.text()
      
      // Extract time (format: "Time: 10:00 AM - 11:30 AM")
      const timeMatch = text.match(/Time:\s*(\d{1,2}:\d{2}\s*[AP]M)(?:\s*-\s*(\d{1,2}:\d{2}\s*[AP]M))?/)
      const startTime = timeMatch ? timeMatch[1] : null
      const endTime = timeMatch && timeMatch[2] ? timeMatch[2] : null
      
      // Extract location (format: "Location: Building, room")
      const locationMatch = text.match(/Location:\s*([^\n]+?)(?:Organization:|$)/)
      const location = locationMatch ? locationMatch[1].trim() : "TBA"
      
      // Extract organization
      const orgMatch = text.match(/Organization:\s*([^\n]+?)$/)
      const organization = orgMatch ? orgMatch[1].trim() : "UMass Boston"
      
      if (title && startTime) {
        events.push({
          title,
          url: href.startsWith('http') ? href : `https://www.umb.edu${href}`,
          startTime,
          endTime,
          location,
          organization,
          eventDate: `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
        })
      }
    })
    
    return events
  } catch (error) {
    console.error("Error scraping UMB events:", error)
    throw error
  }
}

// Helper function to fetch detailed event description
async function fetchEventDescription(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    if (!response.ok) return "No description available."
    
    const html = await response.text()
    const $ = load(html)
    
    // Try to find the main content/description
    // This may need adjustment based on the actual page structure
    const description = $('article p').first().text().trim() || 
                       $('.content p').first().text().trim() ||
                       $('main p').first().text().trim() ||
                       "No description available."
    
    return description.substring(0, 2000) // Limit to 2000 chars
  } catch (error) {
    return "No description available."
  }
}

// Convert 12-hour time to 24-hour format
function convertTo24Hour(time12h: string): string {
  const [time, modifier] = time12h.split(' ')
  let [hours, minutes] = time.split(':')
  
  if (hours === '12') {
    hours = '00'
  }
  
  if (modifier === 'PM') {
    hours = String(parseInt(hours, 10) + 12)
  }
  
  return `${hours.padStart(2, '0')}:${minutes}`
}

// GET /api/events/scrape - Scrape and optionally save UMass Boston events
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const saveToDb = searchParams.get("save") === "true"
    const dateParam = searchParams.get("date") // Format: YYYY-MM-DD
    
    // Check authentication if saving to DB
    if (saveToDb) {
      const { profile } = await getCurrentUser()
      if (!profile) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
      }
    }
    
    const scrapedEvents = await scrapeUMBEvents(dateParam || undefined)
    
    if (!saveToDb) {
      return NextResponse.json({ 
        data: scrapedEvents,
        message: `Found ${scrapedEvents.length} events. Add ?save=true to import them.`
      })
    }
    
    // Save events to database
    const savedEvents = []
    const { profile } = await getCurrentUser()
    const supabase = await sbServer()
    
    for (const event of scrapedEvents) {
      // Fetch full description
      const description = await fetchEventDescription(event.url)
      
      // Check if event already exists (by title and date)
      const { data: existing } = await supabase
        .from('Event')
        .select('id')
        .eq('title', event.title)
        .eq('eventDate', event.eventDate)
        .eq('isExternal', true)
        .single()
      
      if (existing) {
        continue // Skip duplicates
      }
      
      // Create the event
      const { data: saved, error } = await supabase
        .from('Event')
        .insert({
          title: event.title,
          description: description,
          eventDate: event.eventDate,
          startTime: convertTo24Hour(event.startTime),
          endTime: event.endTime ? convertTo24Hour(event.endTime) : null,
          location: event.location,
          imageUrl: null, // UMB events don't have images in the listing
          category: "Academic", // Default category, could be improved with AI
          organizerId: profile!.id, // Use authenticated user as organizer
          isExternal: true,
          externalSource: event.url
        })
        .select()
        .single()
      
      if (!error && saved) {
        savedEvents.push(saved)
      }
    }
    
    return NextResponse.json({ 
      data: savedEvents,
      message: `Successfully imported ${savedEvents.length} new events from UMass Boston.`,
      total: scrapedEvents.length,
      duplicates: scrapedEvents.length - savedEvents.length
    })
  } catch (error) {
    console.error("GET /api/events/scrape error:", error)
    return NextResponse.json({ 
      error: "Failed to scrape events",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
