import { sbServer } from "@/lib/supabase/server"
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
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.45),_transparent_60%)]" aria-hidden />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(14,116,144,0.28),_transparent_65%)]" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-6 py-12 rounded-3xl border border-border bg-[var(--background-elevated)] shadow-float">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground animate-fade-in">
            UMass Boston Marketplace
          </h1>
          <p className="text-lg md:text-xl text-foreground-secondary max-w-2xl">
            Buy, sell, and trade with fellow Beacons. Discover a modern marketplace tailored to campus life.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-8">
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
    </main>
  )
}
