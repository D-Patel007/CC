import { sbServer } from "@/lib/supabase/server"
import Link from "next/link"
import ListingCard from "@/components/ListingCard"
import CategoryTabs from "@/components/CategoryTabs"
import type { Database } from "@/lib/supabase/databaseTypes"

type Listing = Database['public']['Tables']['Listing']['Row']
type Category = Database['public']['Tables']['Category']['Row']
type ListingWithCategory = Listing & { category: Category | null }

export const dynamic = "force-dynamic"

export default async function Marketplace({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const categoryFilter = params.category as string | undefined
  const sortBy = params.sort as string | undefined

  let listings: any[] = []
  let categories: Category[] = []

  try {
    const supabase = await sbServer()

    const { data: categoryData, error: categoryError } = await supabase
      .from('Category')
      .select('id, name, slug')
      .order('name', { ascending: true })

    if (!categoryError && categoryData) {
      categories = categoryData
    }

    // Build query
    let query = supabase
      .from('Listing')
      .select(`
        *,
        category:Category(*)
      `)
      .limit(30)
    
    // Filter by category if specified and not "All"
    if (categoryFilter && categoryFilter.toLowerCase() !== "all") {
      const normalizedFilter = categoryFilter.toLowerCase()
      const categoryMatch = categories.find((cat) =>
        cat.slug?.toLowerCase() === normalizedFilter ||
        cat.name?.toLowerCase() === normalizedFilter
      )

      if (categoryMatch) {
        query = query.eq('categoryId', categoryMatch.id)
      }
    }

    // Apply sorting
    if (sortBy === "price_low") {
      query = query.order('priceCents', { ascending: true })
    } else if (sortBy === "price_high") {
      query = query.order('priceCents', { ascending: false })
    } else {
      query = query.order('createdAt', { ascending: false })
    }

    const { data, error } = await query

    if (error) throw error
    listings = data || []
  } catch (err) {
    console.error('Error loading listings:', err)
    return (
      <main className="mx-auto max-w-5xl p-6">
        <h1 className="mb-2 text-2xl font-semibold">Campus Connect</h1>
        <p className="rounded-lg border bg-red-50 p-4 text-sm">
          Could not load listings. Check your database connection and server logs.
        </p>
      </main>
    )
  }

  return (
    <main className="min-h-screen pb-20">
      {/* Hero Section - UMB Inspired */}
      <section className="relative overflow-hidden hero-gradient py-16 md:py-24">
        {/* Background decorative elements */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(0,61,165,0.15),_transparent_50%)]" aria-hidden />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(255,184,28,0.08),_transparent_50%)]" aria-hidden />
        
        <div className="relative mx-auto max-w-6xl px-6">
          <div className="text-center space-y-6 animate-fade-in">
            {/* Main heading */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight">
              Campus Connect
            </h1>
            
            {/* Subheading */}
            <p className="text-2xl md:text-3xl font-semibold text-primary">
              For Beacons, by Beacons
            </p>
            
            {/* Description */}
            <p className="text-lg md:text-xl text-foreground-secondary max-w-3xl mx-auto leading-relaxed">
              Buy, sell, and trade with fellow UMass Boston students. Discover a modern marketplace tailored to campus life—sustainable, affordable, and built for our community.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 justify-center pt-6">
              <Link 
                href="/listings/new"
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold px-8 py-4 rounded-modern shadow-subtle hover:shadow-float transition-all duration-300 hover:-translate-y-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Post a Listing
              </Link>
              <Link 
                href="/events"
                className="inline-flex items-center gap-2 bg-secondary hover:bg-accent-light text-foreground font-semibold px-8 py-4 rounded-modern border-2 border-border hover:border-primary shadow-subtle hover:shadow-float transition-all duration-300 hover:-translate-y-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Browse Events
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* By the Numbers - UMB Inspired Stats Section */}
      <section className="bg-background-subtle section-padding">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">
            Campus Connect by the Numbers
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center space-y-2 animate-fade-in">
              <div className="stat-number">{listings.length}+</div>
              <p className="text-foreground-secondary font-medium">Active Listings</p>
            </div>
            <div className="text-center space-y-2 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="stat-number">{categories.length}</div>
              <p className="text-foreground-secondary font-medium">Categories</p>
            </div>
            <div className="text-center space-y-2 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="stat-number">100%</div>
              <p className="text-foreground-secondary font-medium">For Beacons</p>
            </div>
            <div className="text-center space-y-2 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="stat-number">24/7</div>
              <p className="text-foreground-secondary font-medium">Open Marketplace</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Marketplace Section */}
      <div className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-3xl font-bold mb-6 text-foreground">Browse Marketplace</h2>
        <CategoryTabs categories={categories} />

        {listings.length === 0 ? (
          <div className="text-center py-16 text-foreground-secondary">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-xl text-foreground mb-2">No listings found</p>
            <p className="text-sm">Be the first to post an item!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-6">
            {listings.map((listing) => (
              <div key={listing.id} className="animate-fade-in">
                <ListingCard listing={listing} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Community Section - "For Beacons, by Beacons" */}
      <section className="bg-primary text-white section-padding">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold">
              Built for the Beacon Community
            </h2>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto">
              Campus Connect empowers UMass Boston students to buy, sell, and connect sustainably—reducing waste while keeping essential items affordable and accessible.
            </p>
            <div className="grid md:grid-cols-3 gap-8 pt-8">
              <div className="space-y-3">
                <div className="text-5xl mb-2">🔒</div>
                <h3 className="text-xl font-semibold">Safe & Verified</h3>
                <p className="text-white/80">
                  UMass Boston email verification ensures you're only trading with fellow Beacons
                </p>
              </div>
              <div className="space-y-3">
                <div className="text-5xl mb-2">♻️</div>
                <h3 className="text-xl font-semibold">Sustainable</h3>
                <p className="text-white/80">
                  Give items a second life and reduce waste on campus—better for your wallet and the planet
                </p>
              </div>
              <div className="space-y-3">
                <div className="text-5xl mb-2">🤝</div>
                <h3 className="text-xl font-semibold">Community First</h3>
                <p className="text-white/80">
                  Connect with classmates, discover events, and build lasting relationships at UMB
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
