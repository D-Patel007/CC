import Link from 'next/link'
import type { Database } from '@/lib/supabase/databaseTypes'
import VerifiedBadge from './VerifiedBadge'

type ListingRow = Database['public']['Tables']['Listing']['Row']
type CategoryRow = Database['public']['Tables']['Category']['Row']
type ProfileRow = Database['public']['Tables']['Profile']['Row']

type ListingWithCategory = ListingRow & { 
  category?: CategoryRow | null
  seller?: Partial<ProfileRow> | { id: number; name: string | null } | null
}

type ListingCardProps = {
  listing: ListingWithCategory
}

export default function ListingCard({ listing }: ListingCardProps) {
  const price = typeof listing.priceCents === 'number'
    ? `$${(listing.priceCents / 100).toFixed(2)}`
    : '—'
  const altText = listing.title ? `Listing: ${listing.title}` : 'Marketplace listing image'
  
  // Use first image from images array, fallback to imageUrl, then placeholder
  const displayImage = listing.images && listing.images.length > 0 
    ? listing.images[0] 
    : listing.imageUrl || '/no-image.png'
  
  const imageCount = listing.images?.length || (listing.imageUrl ? 1 : 0)
  
  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group block rounded-2xl bg-[var(--card-bg)] border border-border overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
    >
      <div className="flex flex-col sm:flex-row gap-0 sm:gap-4 h-full">
        {/* Square Image Container */}
        <div className="relative w-full sm:w-48 h-48 flex-shrink-0 overflow-hidden bg-[var(--background-secondary)]">
          {listing.isSold && (
            <div className="absolute top-3 right-3 bg-error text-white text-xs font-bold px-3 py-1.5 rounded-full z-10 shadow-sm">
              SOLD
            </div>
          )}
          {imageCount > 1 && (
            <div className="absolute top-3 left-3 bg-black/70 text-white text-xs font-medium px-2.5 py-1 rounded-full z-10 flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
              {imageCount}
            </div>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={displayImage}
            alt={altText}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        {/* Content Area */}
        <div className="flex-1 p-4 sm:py-4 sm:pr-4 sm:pl-0 flex flex-col justify-center space-y-3">
          {listing.category && (
            <div className="inline-block w-fit">
              <span className="bg-[var(--primary-light)] text-primary text-xs font-medium px-3 py-1 rounded-full">
                {listing.category.name}
              </span>
            </div>
          )}
          <div className="space-y-2">
            <h3 className="font-bold text-xl text-foreground line-clamp-2 group-hover:text-primary transition-colors">
              {listing.title}
            </h3>
            <p className="text-2xl font-bold text-primary">
              {price}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-foreground-secondary">
            <span className="px-2 py-1 bg-[var(--background-secondary)] rounded-md">
              {listing.condition ?? 'Unknown condition'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

