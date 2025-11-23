import { sbServer } from "@/lib/supabase/server"
import ListingCard from "@/components/ListingCard"
import CategoryTabs from "@/components/CategoryTabs"
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
    <main className="min-h-screen">
      {/* Hero Section with Search */}
      <section className="bg-[var(--background-secondary)] py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 text-primary">
            The Campus Marketplace
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8">
            Your one-stop shop to buy, sell, and connect with the university community.
          </p>

          {/* Prominent Search Bar */}
          <div className="max-w-2xl mx-auto">
            <SearchBar />
          </div>
        </div>
      </section>

      {/* Featured Listings Section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold text-foreground mb-8">Featured Listings</h2>

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
