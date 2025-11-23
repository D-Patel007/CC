/**
 * API Route: /api/cron/event-reminders
 * Sends email reminders to users for events starting in 24 hours
 * Should be called by a cron job (e.g., Vercel Cron, GitHub Actions, or external service)
 */

import { NextRequest, NextResponse } from 'next/server'
import { sbServer } from '@/lib/supabase/server'
import { sendEventReminder } from '@/lib/email'

// Protect this endpoint with a secret token
const CRON_SECRET = process.env.CRON_SECRET || 'your-secret-token-here'

export async function POST(req: NextRequest) {
  try {
    // Verify authorization
    const authHeader = req.headers.get('authorization')
    if (!authHeader || authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await sbServer()

    // Calculate time window: 23-25 hours from now
    // This gives us a 2-hour window in case the cron job runs slightly off schedule
    const now = new Date()
    const twentyThreeHoursFromNow = new Date(now.getTime() + 23 * 60 * 60 * 1000)
    const twentyFiveHoursFromNow = new Date(now.getTime() + 25 * 60 * 60 * 1000)

    // Find events starting in ~24 hours
    const { data: upcomingEvents, error: eventsError } = await supabase
      .from('Event')
      .select('*')
      .gte('startDate', twentyThreeHoursFromNow.toISOString())
      .lte('startDate', twentyFiveHoursFromNow.toISOString())
      .eq('status', 'active')

    if (eventsError) {
      console.error('Failed to fetch upcoming events:', eventsError)
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
    }

    if (!upcomingEvents || upcomingEvents.length === 0) {
      return NextResponse.json({ 
        message: 'No events in the next 24 hours',
        sent: 0 
      })
    }

    let totalSent = 0
    let totalFailed = 0

    // Process each event
    for (const event of upcomingEvents) {
      try {
        // Get all RSVPs for this event
        const { data: rsvps, error: rsvpError } = await supabase
          .from('EventRSVP')
          .select('userId, status')
          .eq('eventId', event.id)
          .eq('status', 'going')

        if (rsvpError || !rsvps || rsvps.length === 0) {
          console.log(`No RSVPs for event ${event.id}`)
          continue
        }

        // Send reminder to each attendee
        for (const rsvp of rsvps) {
          try {
            // Get user email and name
            const { data: userAuth } = await supabase.auth.admin.getUserById(
              rsvp.userId.toString()
            )
            const { data: userProfile } = await supabase
              .from('Profile')
              .select('name, emailNotifications, emailEventReminders')
              .eq('id', rsvp.userId)
              .single()

            if (!userAuth?.user?.email || !userProfile ||
                userProfile.emailNotifications === false ||
                userProfile.emailEventReminders === false) {
              console.log(`User ${rsvp.userId} not found`)
              continue
            }

            // Calculate hours until event
            const eventStartTime = new Date(event.startDate).getTime()
            const hoursUntilEvent = Math.round((eventStartTime - now.getTime()) / (1000 * 60 * 60))

            // Send reminder email
            await sendEventReminder({
              attendeeEmail: userAuth.user.email,
              attendeeName: userProfile.name || 'Attendee',
              eventTitle: event.title,
              eventDate: new Date(event.startDate).toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              }),
              eventLocation: event.location || 'Location TBD',
              eventUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/events/${event.id}`,
              hoursUntilEvent
            })

            totalSent++
          } catch (userError) {
            console.error(`Failed to send reminder to user ${rsvp.userId}:`, userError)
            totalFailed++
          }
        }
      } catch (eventError) {
        console.error(`Failed to process event ${event.id}:`, eventError)
        totalFailed++
      }
    }

    return NextResponse.json({
      message: 'Event reminders sent successfully',
      events: upcomingEvents.length,
      sent: totalSent,
      failed: totalFailed
    })
  } catch (error) {
    console.error('POST /api/cron/event-reminders error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET endpoint for testing (should be disabled in production)
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'GET not allowed in production' }, { status: 405 })
  }
  
  // In development, allow GET for testing
  return POST(req)
}
