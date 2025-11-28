import { sbServer } from "@/lib/supabase/server"
import ListingCard from "@/components/ListingCard"
import FilterChips from "@/components/FilterChips"
import SearchBar from "@/components/SearchBar"
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
    <main className="min-h-screen w-full">
      {/* Hero Section with Search */}
      <section className="bg-gradient-to-br from-primary/10 via-background-secondary to-secondary/10 py-24 w-full">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent animate-slide-up">
            The Campus Marketplace
          </h1>
          <p className="text-lg md:text-2xl text-foreground-secondary mb-10 animate-fade-in">
            Your one-stop shop to buy, sell, and connect with the university community.
          </p>

          {/* Prominent Search Bar */}
          <div className="max-w-3xl mx-auto">
            <SearchBar />
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="bg-[var(--background)] py-8 w-full border-b border-border">
        <div className="mx-auto max-w-7xl px-6">
          <div className="space-y-6">
            {/* Category Filters */}
            <div>
              <h3 className="text-sm font-semibold text-foreground-secondary mb-3 uppercase tracking-wider">
                Categories
              </h3>
              <FilterChips categories={categories} type="category" />
            </div>

            {/* Condition Filters */}
            <div>
              <h3 className="text-sm font-semibold text-foreground-secondary mb-3 uppercase tracking-wider">
                Condition
              </h3>
              <FilterChips categories={[]} type="condition" />
            </div>

            {/* Sort Options */}
            <div>
              <h3 className="text-sm font-semibold text-foreground-secondary mb-3 uppercase tracking-wider">
                Sort By
              </h3>
              <FilterChips categories={[]} type="sort" />
            </div>
          </div>
        </div>
      </section>

      {/* Listings Grid */}
      <section className="py-12 w-full bg-[var(--background-secondary)]">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-3xl font-bold text-foreground mb-8">
            {categoryFilter && categoryFilter !== 'all'
              ? `${categoryFilter.charAt(0).toUpperCase() + categoryFilter.slice(1)} Listings`
              : 'All Listings'
            }
          </h2>

          {listings.length === 0 ? (
            <div className="text-center py-20 text-foreground-secondary">
              <div className="text-8xl mb-6 animate-float">📦</div>
              <p className="text-2xl text-foreground mb-3 font-semibold">No listings found</p>
              <p className="text-lg">Try adjusting your filters or be the first to post an item!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {listings.map((listing) => (
                <div key={listing.id} className="animate-fade-in">
                  <ListingCard listing={listing} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
