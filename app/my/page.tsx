"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import ListingCard from "@/components/ListingCard"

type Listing = {
  id: number
  title: string
  description: string
  priceCents: number
  condition: string
  imageUrl: string | null
  isSold: boolean
  createdAt: string
  category: {
    id: number
    name: string
  } | null
}

export default function MyListingsPage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "active" | "sold">("all")

  useEffect(() => {
    fetchListings()
  }, [])

  async function fetchListings() {
    try {
      const res = await fetch('/api/profile')
      if (!res.ok) return
      
      const profileData = await res.json()
      const userId = profileData.data?.id
      
      if (!userId) return

      const listingsRes = await fetch('/api/listings?limit=100')
      const listingsData = await listingsRes.json()
      
      const myListings = listingsData.data.filter((l: any) => l.seller.id === userId)
      setListings(myListings)
    } catch (error) {
      console.error('Failed to fetch listings:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredListings = listings.filter(listing => {
    if (filter === "active") return !listing.isSold
    if (filter === "sold") return listing.isSold
    return true
  })

  return (
    <div className="pb-20">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-[var(--background-elevated)] p-8 mb-6 shadow-float">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(129,140,248,0.35),_transparent_60%)]" aria-hidden />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(14,116,144,0.25),_transparent_70%)]" aria-hidden />
        <div className="relative">
          <h1 className="text-4xl font-bold mb-3 text-foreground">My Listings</h1>
          <p className="text-lg text-foreground-secondary mb-6">
            Manage your marketplace posts
          </p>
          <Link 
            href="/listings/new"
            className="inline-block rounded-lg bg-primary px-6 py-3 font-semibold text-white shadow-subtle hover:bg-primary-hover transition"
          >
            + Create New Listing
          </Link>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setFilter("all")}
          className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
            filter === "all"
              ? "bg-primary text-white shadow-subtle"
              : "border border-border bg-[var(--background-secondary)] text-foreground-secondary hover:text-foreground"
          }`}
        >
          All ({listings.length})
        </button>
        <button
          onClick={() => setFilter("active")}
          className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
            filter === "active"
              ? "bg-primary text-white shadow-subtle"
              : "border border-border bg-[var(--background-secondary)] text-foreground-secondary hover:text-foreground"
          }`}
        >
          Active ({listings.filter(l => !l.isSold).length})
        </button>
        <button
          onClick={() => setFilter("sold")}
          className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
            filter === "sold"
              ? "bg-primary text-white shadow-subtle"
              : "border border-border bg-[var(--background-secondary)] text-foreground-secondary hover:text-foreground"
          }`}
        >
          Sold ({listings.filter(l => l.isSold).length})
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-foreground-secondary">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-border border-t-primary mb-4"></div>
          <p>Loading your listings...</p>
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="text-center py-16 bg-[var(--card-bg)] rounded-xl border border-border text-foreground-secondary shadow-subtle">
          <div className="text-6xl mb-4"></div>
          <p className="text-xl text-foreground mb-2">
            {filter === "all" ? "No listings yet" : `No ${filter} listings`}
          </p>
          <p className="text-sm mb-6">
            {filter === "all" ? "Create your first listing to get started!" : ""}
          </p>
          {filter === "all" && (
            <Link 
              href="/listings/new"
              className="inline-block bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-hover transition-all font-medium shadow-subtle"
            >
              Create Listing
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing) => (
            <div key={listing.id} className="animate-fade-in">
              <ListingCard listing={listing} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
