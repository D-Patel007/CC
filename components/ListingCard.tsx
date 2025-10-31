import Link from 'next/link'

export default function ListingCard({ listing }: { listing: any }) {
  const price = `$${(listing.priceCents / 100).toFixed(2)}`
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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={listing.imageUrl || '/no-image.png'} 
          alt={listing.title}
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
        <div className="flex items-center gap-2 pt-1">
          {listing.category && (
            <span className="inline-block bg-[rgba(129,140,248,0.16)] text-primary text-xs font-medium px-2.5 py-1 rounded-full">
              {listing.category.name}
            </span>
          )}
          <span className="inline-block bg-[var(--background-secondary)] text-foreground-secondary text-xs font-medium px-2.5 py-1 rounded-full">
            {listing.condition}
          </span>
        </div>
      </div>
    </Link>
  )
}

