import { sbServer } from "@/lib/supabase/server"
import ListingCard from "@/components/ListingCard"
import HorizontalScroll from "@/components/HorizontalScroll"
import Link from "next/link"
import type { Database } from "@/lib/supabase/databaseTypes"

type Listing = Database['public']['Tables']['Listing']['Row']
type Category = Database['public']['Tables']['Category']['Row']
type ListingWithCategory = Listing & { category: Category | null }

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
  organizer: {
    id: number
    name: string | null
  }
}

export const dynamic = "force-dynamic"

export default async function HomePage() {
  let featuredListings: any[] = []
  let featuredEvents: Event[] = []

  try {
    const supabase = await sbServer()

    // Fetch featured listings (latest 8 for horizontal scroll)
    const { data: listingsData, error: listingsError } = await supabase
      .from('Listing')
      .select(`
        *,
        category:Category(*)
      `)
      .eq('isSold', false)
      .order('createdAt', { ascending: false })
      .limit(8)

    if (!listingsError && listingsData) {
      featuredListings = listingsData
    }

    // Fetch featured events (upcoming 8 for horizontal scroll)
    const { data: eventsData, error: eventsError } = await supabase
      .from('Event')
      .select(`
        id,
        title,
        description,
        eventDate,
        startTime,
        endTime,
        location,
        imageUrl,
        category,
        attendeeCount,
        isExternal,
        externalSource,
        organizer:organizerId(id, name)
      `)
      .gte('eventDate', new Date().toISOString().split('T')[0])
      .order('eventDate', { ascending: true })
      .limit(8)

    if (!eventsError && eventsData) {
      featuredEvents = eventsData as any
    }
  } catch (err) {
    console.error('Error loading data:', err)
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric"
    })
  }

  function formatTime(time: string) {
    const [hours, minutes] = time.split(":")
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  return (
    <main className="min-h-screen w-full">
      {/* Hero Section with Campus Image Background */}
      <section className="relative h-[85vh] w-full overflow-hidden">
        {/* Campus Image Background - Add your campus.jpg to /public folder */}
        <div className="absolute inset-0">
          {/* Animated gradient background with decorative elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-secondary/20 animate-zoom-in" style={{ animationDuration: '1.2s' }}>
            {/* Decorative circles */}
            <div className="absolute top-20 left-10 w-96 h-96 bg-primary/30 rounded-full blur-3xl animate-float"></div>
            <div className="absolute bottom-20 right-10 w-[32rem] h-[32rem] bg-secondary/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
          </div>
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/40 to-background"></div>
        </div>

        {/* Hero Content */}
        <div className="relative h-full flex items-center justify-center px-6">
          <div className="text-center max-w-5xl animate-slide-up" style={{ animationDelay: '0.3s', opacity: 0, animationFillMode: 'forwards' }}>
            <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent drop-shadow-lg">
              Campus Connect
            </h1>
            <p className="text-2xl md:text-4xl text-foreground font-medium mb-8">
              by Beacons, for Beacons
            </p>
            <p className="text-lg md:text-2xl text-foreground-secondary max-w-3xl mx-auto mb-12">
              Your all-in-one platform to buy, sell, discover events, and connect with the university community.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link
                href="/marketplace"
                className="group bg-primary hover:bg-primary-hover text-white text-lg px-10 py-5 rounded-2xl inline-block font-bold shadow-2xl hover:shadow-primary/50 hover:scale-105 transition-all"
              >
                Browse Marketplace
                <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </Link>
              <Link
                href="/events"
                className="group bg-secondary hover:bg-secondary/90 text-white text-lg px-10 py-5 rounded-2xl inline-block font-bold shadow-2xl hover:shadow-secondary/50 hover:scale-105 transition-all"
              >
                Explore Events
                <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
          <svg className="w-8 h-8 text-foreground-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Featured Events Section */}
      <section className="py-20 bg-[var(--background)] w-full">
        {featuredEvents.length === 0 ? (
          <div className="text-center py-16 text-foreground-secondary px-6">
            <div className="text-6xl mb-4">📅</div>
            <p className="text-xl text-foreground mb-2">No upcoming events</p>
            <p className="text-sm">Check back soon for new events!</p>
          </div>
        ) : (
          <HorizontalScroll title="Featured Events" viewAllHref="/events">
            {featuredEvents.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="group card min-w-[320px] md:min-w-[380px] flex-shrink-0 transition-all duration-300"
              >
                {/* Event Image */}
                <div className="aspect-video w-full overflow-hidden rounded-xl mb-4 bg-[var(--background-secondary)]">
                  {event.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={event.imageUrl}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl">
                      📅
                    </div>
                  )}
                </div>

                {/* Event Info */}
                <div className="space-y-3">
                  {event.isExternal && (
                    <span className="inline-block bg-accent/20 text-accent text-xs font-medium px-3 py-1 rounded-full">
                      Official Event
                    </span>
                  )}
                  <h3 className="font-bold text-xl text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {event.title}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formatDate(event.eventDate)} • {formatTime(event.startTime)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {event.location}
                  </div>
                </div>
              </Link>
            ))}
          </HorizontalScroll>
        )}
      </section>

      {/* Featured Listings Section */}
      <section className="py-20 bg-[var(--background-secondary)] w-full">
        {featuredListings.length === 0 ? (
          <div className="text-center py-16 text-foreground-secondary px-6">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-xl text-foreground mb-2">No listings yet</p>
            <p className="text-sm">Be the first to post an item!</p>
          </div>
        ) : (
          <HorizontalScroll title="Featured Listings" viewAllHref="/marketplace">
            {featuredListings.map((listing) => (
              <div key={listing.id} className="min-w-[280px] md:min-w-[340px] flex-shrink-0">
                <ListingCard listing={listing} />
              </div>
            ))}
          </HorizontalScroll>
        )}
      </section>

      {/* Services Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-background via-primary/5 to-background w-full">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">Choose Your Plan</h2>
            <p className="text-xl text-muted-foreground">
              Get started with Campus Connect today
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Free Account */}
            <div className="card bg-[var(--card-bg)] p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full -mr-16 -mt-16"></div>
              <div className="relative">
                <div className="inline-block bg-secondary/20 text-secondary px-4 py-2 rounded-full text-sm font-semibold mb-4">
                  FREE
                </div>
                <h3 className="text-3xl font-bold text-foreground mb-3">Free Account</h3>
                <p className="text-muted-foreground mb-6">
                  Perfect for getting started with Campus Connect
                </p>
                <div className="text-4xl font-bold text-foreground mb-8">
                  $0<span className="text-lg text-muted-foreground font-normal">/month</span>
                </div>

                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-success flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-foreground">Post up to 10 listings</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-success flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-foreground">Browse all events and listings</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-success flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-foreground">Direct messaging</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-success flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-foreground">Event RSVP</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-success flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-foreground">Email notifications</span>
                  </li>
                </ul>

                <Link
                  href="/login"
                  className="block w-full text-center bg-secondary hover:bg-secondary/90 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-sm hover:shadow-md"
                >
                  Get Started Free
                </Link>
              </div>
            </div>

            {/* Pro Account */}
            <div className="card bg-gradient-to-br from-primary to-primary-hover p-8 relative overflow-hidden text-white border-2 border-primary">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
              <div className="absolute -top-3 -right-3 bg-warning text-white px-4 py-1 rounded-full text-sm font-bold rotate-12 shadow-lg">
                POPULAR
              </div>
              <div className="relative">
                <div className="inline-block bg-white/20 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4">
                  PRO
                </div>
                <h3 className="text-3xl font-bold mb-3">Pro Account</h3>
                <p className="text-white/90 mb-6">
                  Unlock the full potential of Campus Connect
                </p>
                <div className="text-4xl font-bold mb-8">
                  $9.99<span className="text-lg text-white/80 font-normal">/month</span>
                </div>

                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-white flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Unlimited listings</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-white flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Priority listing placement</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-white flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Verified badge</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-white flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Advanced analytics</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-white flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Create events with custom branding</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-white flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Priority customer support</span>
                  </li>
                </ul>

                <Link
                  href="/login"
                  className="block w-full text-center bg-white text-primary hover:bg-white/95 font-bold py-3 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl"
                >
                  Upgrade to Pro
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
