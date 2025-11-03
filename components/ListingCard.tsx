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
      className="group block rounded-modern-lg border border-border bg-[var(--card-bg)] text-foreground shadow-subtle hover-lift overflow-hidden"
    >
      <div className="aspect-video w-full overflow-hidden bg-gradient-to-br from-[rgba(0,61,165,0.05)] via-[rgba(255,184,28,0.05)] to-[rgba(0,40,85,0.08)] relative">
        {listing.isSold && (
          <div className="absolute top-3 right-3 bg-error text-white text-xs font-bold px-3 py-1.5 rounded-full z-10 shadow-lg">
            SOLD
          </div>
        )}
        {imageCount > 1 && (
          <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1.5 rounded-full z-10 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            {imageCount}
          </div>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={displayImage} 
          alt={altText}
          className="h-full w-full object-cover transition-all duration-500 group-hover:scale-105 group-hover:brightness-105" 
        />
      </div>
      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 font-bold text-lg text-foreground group-hover:text-primary transition-colors flex-1 leading-snug">
            {listing.title}
          </h3>
          <span className="whitespace-nowrap text-xl font-bold text-primary flex-shrink-0">
            {price}
          </span>
        </div>
        <p className="line-clamp-2 text-sm text-foreground-secondary leading-relaxed">
          {listing.description}
        </p>
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
          <div className="flex items-center gap-2 flex-wrap">
            {listing.category && (
              <span className="inline-block bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full border border-primary/20">
                {listing.category.name}
              </span>
            )}
            <span className="inline-block bg-background-secondary text-foreground-secondary text-xs font-medium px-3 py-1.5 rounded-full border border-border">
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

