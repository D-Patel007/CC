"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

type Listing = {
  id: number
  title: string
  description: string
  priceCents: number
  condition: string
  imageUrl: string | null
  campus: string | null
  isSold: boolean
  createdAt: string
  updatedAt: string
  category: {
    id: number
    name: string
  } | null
  seller: {
    id: number
    name: string | null
    avatarUrl: string | null
    createdAt: string
  }
}

type PageProps = {
  params: Promise<{ id: string }>
}

export default function ListingDetailPage({ params }: PageProps) {
  const [listing, setListing] = useState<Listing | null>(null)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [listingId, setListingId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    params.then(p => setListingId(p.id))
  }, [params])

  useEffect(() => {
    if (!listingId) return

    async function fetchData() {
      try {
        // Fetch listing
        const listingRes = await fetch(`/api/listings/${listingId}`)
        if (!listingRes.ok) {
          router.push('/404')
          return
        }
        const listingData = await listingRes.json()
        setListing(listingData.data)

        // Fetch current user
        const profileRes = await fetch('/api/profile')
        if (profileRes.ok) {
          const profileData = await profileRes.json()
          setCurrentUserId(profileData.data?.id || null)
        }
      } catch (error) {
        console.error('Failed to fetch listing:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [listingId, router])

  async function handleMarkAsSold() {
    if (!listing || !confirm('Mark this listing as sold?')) return
    
    setActionLoading(true)
    try {
      const res = await fetch(`/api/listings/${listing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isSold: true })
      })

      if (res.ok) {
        const data = await res.json()
        setListing(data.data)
        alert('Listing marked as sold!')
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to mark as sold')
      }
    } catch (error) {
      console.error('Failed to mark as sold:', error)
      alert('Failed to mark as sold')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleDelete() {
    if (!listing || !confirm('Are you sure you want to delete this listing? This cannot be undone.')) return
    
    setActionLoading(true)
    try {
      const res = await fetch(`/api/listings/${listing.id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        alert('Listing deleted successfully!')
        router.push('/')
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to delete listing')
        setActionLoading(false)
      }
    } catch (error) {
      console.error('Failed to delete listing:', error)
      alert('Failed to delete listing')
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-border border-t-primary mb-4"></div>
          <p className="text-foreground-secondary">Loading listing...</p>
        </div>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-xl text-foreground-secondary mb-4">Listing not found</p>
          <Link href="/" className="text-primary hover:underline">
            ← Back to Marketplace
          </Link>
        </div>
      </div>
    )
  }

  const isOwnListing = currentUserId === listing.seller.id
  const price = `$${(listing.priceCents / 100).toFixed(2)}`
  const sellerName = listing.seller.name || "Anonymous"

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="bg-[var(--card-bg)] rounded-xl border border-border overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Image */}
          <div className="aspect-square bg-[var(--background-elevated)]">
            {listing.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={listing.imageUrl} 
                alt={listing.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-foreground-secondary">
                <span className="text-6xl">📦</span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="p-6 space-y-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{listing.title}</h1>
              <p className="text-3xl font-bold text-primary">{price}</p>
            </div>

            <div className="flex gap-2 text-sm">
              {listing.category && (
                <span className="px-3 py-1 bg-primary/20 text-primary rounded-full">
                  {listing.category.name}
                </span>
              )}
              <span className="px-3 py-1 bg-[var(--background-elevated)] text-foreground rounded-full">
                {listing.condition}
              </span>
              {listing.isSold && (
                <span className="px-3 py-1 bg-error/20 text-error rounded-full">
                  SOLD
                </span>
              )}
            </div>

            <div className="border-t border-border pt-4">
              <h2 className="font-semibold mb-2">Description</h2>
              <p className="text-foreground whitespace-pre-wrap">{listing.description}</p>
            </div>

            {listing.campus && (
              <div className="border-t border-border pt-4">
                <h2 className="font-semibold mb-2">Location</h2>
                <p className="text-foreground">{listing.campus}</p>
              </div>
            )}

            <div className="border-t border-border pt-4">
              <h2 className="font-semibold mb-2">Seller</h2>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  {sellerName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">{sellerName}</p>
                  <p className="text-sm text-foreground-secondary">
                    Member since {new Date(listing.seller.createdAt).getFullYear()}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-border pt-4 space-y-2">
              {!isOwnListing && !listing.isSold && (
                <form action="/api/conversations/create" method="POST">
                  <input type="hidden" name="listingId" value={listing.id} />
                  <input type="hidden" name="sellerId" value={listing.seller.id} />
                  <button 
                    type="submit"
                    className="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary-hover transition font-medium shadow-subtle"
                  >
                    💬 Message Seller
                  </button>
                </form>
              )}
              
              {isOwnListing && (
                <div className="space-y-2">
                  <p className="text-sm text-foreground-secondary text-center font-medium">This is your listing</p>
                  
                  {!listing.isSold && (
                    <button 
                      onClick={handleMarkAsSold}
                      disabled={actionLoading}
                      className="w-full bg-success text-white py-3 rounded-lg hover:opacity-90 transition font-medium disabled:opacity-50 shadow-subtle"
                    >
                      {actionLoading ? 'Processing...' : '✓ Mark as Sold'}
                    </button>
                  )}
                  
                  <button 
                    onClick={handleDelete}
                    disabled={actionLoading}
                    className="w-full bg-error text-white py-3 rounded-lg hover:opacity-90 transition font-medium disabled:opacity-50 shadow-subtle"
                  >
                    {actionLoading ? 'Deleting...' : '🗑️ Delete Listing'}
                  </button>
                </div>
              )}

              <Link 
                href="/"
                className="block text-center py-3 text-foreground-secondary hover:text-foreground transition font-medium"
              >
                ← Back to Marketplace
              </Link>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="border-t p-6 bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Posted</p>
              <p className="font-medium">
                {new Date(listing.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Last Updated</p>
              <p className="font-medium">
                {new Date(listing.updatedAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Listing ID</p>
              <p className="font-medium">#{listing.id}</p>
            </div>
            <div>
              <p className="text-gray-500">Status</p>
              <p className="font-medium">
                {listing.isSold ? "Sold" : "Available"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
