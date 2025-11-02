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
      className="group block rounded-xl border border-border bg-[var(--card-bg)] text-foreground shadow-subtle hover:shadow-float transition-all duration-300 hover:-translate-y-1 overflow-hidden"
    >
      <div className="aspect-video w-full overflow-hidden bg-gradient-to-br from-[rgba(99,102,241,0.08)] via-[rgba(14,21,33,0.12)] to-[rgba(2,132,199,0.12)] relative">
        {listing.isSold && (
          <div className="absolute top-2 right-2 bg-error text-white text-xs font-bold px-3 py-1 rounded-full z-10 shadow-subtle">
            SOLD
          </div>
        )}
        {imageCount > 1 && (
          <div className="absolute top-2 left-2 bg-black/70 text-white text-xs font-medium px-2 py-1 rounded-full z-10 flex items-center gap-1">
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
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" 
        />
      </div>
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 font-semibold text-foreground group-hover:text-primary transition-colors flex-1">
            {listing.title}
          </h3>
          <span className="whitespace-nowrap text-lg font-bold text-primary flex-shrink-0">
            {price}
          </span>
        </div>
        <p className="line-clamp-2 text-sm text-foreground-secondary leading-relaxed">
          {listing.description}
        </p>
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2 flex-wrap">
            {listing.category && (
              <span className="inline-block bg-[rgba(129,140,248,0.16)] text-primary text-xs font-medium px-2.5 py-1 rounded-full">
                {listing.category.name}
              </span>
            )}
            <span className="inline-block bg-[var(--background-secondary)] text-foreground-secondary text-xs font-medium px-2.5 py-1 rounded-full">
              {listing.condition ?? 'Unknown'}
            </span>
          </div>
          {listing.seller && 'isVerified' in listing.seller && listing.seller.isVerified && (
            <VerifiedBadge isVerified={true} size="sm" />
          )}
        </div>
      </div>
    </Link>
  )
}

