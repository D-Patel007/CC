"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

type PageProps = {
  params: Promise<{ id: string }>
}

type Listing = {
  id: number
  title: string
  priceCents: number
  imageUrl: string | null
  seller: {
    id: number
    name: string | null
  }
}

export default function CompleteTransactionPage({ params }: PageProps) {
  const [listingId, setListingId] = useState<string | null>(null)
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    meetupLocation: '',
    meetupDate: '',
    agreedPrice: '',
  })
  
  const router = useRouter()

  useEffect(() => {
    params.then(p => setListingId(p.id))
  }, [params])

  useEffect(() => {
    if (!listingId) return

    async function fetchListing() {
      try {
        const res = await fetch(`/api/listings/${listingId}`)
        if (!res.ok) {
          setError('Listing not found')
          return
        }
        const data = await res.json()
        setListing(data.data)
        
        // Pre-fill agreed price with listing price
        setFormData(prev => ({
          ...prev,
          agreedPrice: (data.data.priceCents / 100).toFixed(2)
        }))
      } catch (err) {
        setError('Failed to load listing')
      } finally {
        setLoading(false)
      }
    }

    fetchListing()
  }, [listingId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const price = parseFloat(formData.agreedPrice)
      if (isNaN(price) || price <= 0) {
        setError('Please enter a valid price')
        setSubmitting(false)
        return
      }

      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: parseInt(listingId!),
          price,
          meetupLocation: formData.meetupLocation || undefined,
          meetupDate: formData.meetupDate || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to create transaction')
        setSubmitting(false)
        console.error('Transaction creation failed:', data)
        return
      }

      // Success! Redirect to transactions page
      alert('Transaction created! Both parties must confirm to complete.')
      router.push('/transactions')
    } catch (err) {
      setError('An error occurred. Please try again.')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-border border-t-primary mb-4"></div>
          <p className="text-foreground-secondary">Loading...</p>
        </div>
      </div>
    )
  }

  if (error && !listing) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="bg-error/10 border border-error/30 rounded-lg p-6 text-center">
          <p className="text-error font-medium">{error}</p>
          <Link href="/" className="inline-block mt-4 text-primary hover:underline">
            ← Back to Marketplace
          </Link>
        </div>
      </div>
    )
  }

  if (!listing) return null

  const price = `$${(listing.priceCents / 100).toFixed(2)}`
  const sellerName = listing.seller.name || 'Anonymous'

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="mb-6">
        <Link href={`/listings/${listingId}`} className="text-primary hover:underline flex items-center gap-2">
          ← Back to Listing
        </Link>
      </div>

      <div className="bg-[var(--card-bg)] rounded-xl border border-border shadow-subtle p-8">
        <h1 className="text-3xl font-bold mb-2">Complete Transaction</h1>
        <p className="text-foreground-secondary mb-6">
          Record your transaction details. Both you and the seller must confirm before it's finalized.
        </p>

        {/* Listing Summary */}
        <div className="bg-[var(--background-elevated)] rounded-lg p-4 mb-6 flex gap-4">
          {listing.imageUrl && (
            <img
              src={listing.imageUrl}
              alt={listing.title}
              className="w-20 h-20 object-cover rounded-lg"
            />
          )}
          <div className="flex-1">
            <h3 className="font-semibold">{listing.title}</h3>
            <p className="text-sm text-foreground-secondary">Sold by {sellerName}</p>
            <p className="text-lg font-bold text-primary mt-1">Listed at {price}</p>
          </div>
        </div>

        {/* Transaction Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Agreed Price <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-secondary">$</span>
              <input
                type="number"
                step="0.01"
                required
                value={formData.agreedPrice}
                onChange={(e) => setFormData({ ...formData, agreedPrice: e.target.value })}
                className="w-full pl-8 pr-4 py-3 rounded-lg border border-border bg-[var(--input-bg)] text-foreground focus:border-primary"
                placeholder="0.00"
              />
            </div>
            <p className="text-xs text-foreground-secondary mt-1">
              Final price agreed upon (can differ from listing price)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Meetup Location
            </label>
            <input
              type="text"
              value={formData.meetupLocation}
              onChange={(e) => setFormData({ ...formData, meetupLocation: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-border bg-[var(--input-bg)] text-foreground focus:border-primary"
              placeholder="e.g., Campus Center, North Campus"
            />
            <p className="text-xs text-foreground-secondary mt-1">
              Optional - Where you met for the exchange
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Meetup Date & Time
            </label>
            <input
              type="datetime-local"
              value={formData.meetupDate}
              onChange={(e) => setFormData({ ...formData, meetupDate: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-border bg-[var(--input-bg)] text-foreground focus:border-primary"
            />
            <p className="text-xs text-foreground-secondary mt-1">
              Optional - When the exchange happened
            </p>
          </div>

          {error && (
            <div className="bg-error/10 border border-error/30 rounded-lg p-3 text-error text-sm">
              {error}
            </div>
          )}

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-sm">
            <p className="font-medium text-amber-600 dark:text-amber-400 mb-2">📋 Next Steps:</p>
            <ol className="list-decimal list-inside space-y-1 text-foreground-secondary">
              <li>You confirm the transaction</li>
              <li>Seller confirms the transaction</li>
              <li>Both parties rate each other</li>
              <li>Email receipt sent automatically</li>
            </ol>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary-hover transition font-medium shadow-subtle disabled:opacity-50"
          >
            {submitting ? 'Creating Transaction...' : 'Create Transaction'}
          </button>
        </form>
      </div>
    </div>
  )
}
