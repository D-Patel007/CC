import Link from "next/link"

export default function ListingCard({ listing }: { listing: any }) {
  // Determine price string (supports priceCents or price fields)
  let priceValue = 0
  if (typeof listing.priceCents === "number") {
    priceValue = listing.priceCents / 100
  } else if (typeof listing.price === "number") {
    priceValue = listing.price
  }
  const price = `$${priceValue.toFixed(2)}`

  // Determine category name if available (handles string or object)
  let categoryName = ""
  if (listing.category) {
    if (typeof listing.category === "string") {
      categoryName = listing.category
    } else if ("name" in listing.category) {
      categoryName = listing.category.name || ""
    }
  }

  // Image source with fallback placeholder
  const imageSrc = listing.imageUrl && listing.imageUrl.trim() !== "" 
    ? listing.imageUrl 
    : "/no-image.png"

  return (
    <Link 
      href={`/listings/${listing.id}`} 
      className="group block rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md hover:-translate-y-1 transition duration-150"
    >
      <div className="aspect-video w-full overflow-hidden rounded-t-2xl bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={imageSrc} 
          alt={listing.title} 
          className="h-full w-full object-cover transition-transform duration-150 ease-in-out group-hover:scale-105" 
        />
      </div>
      <div className="space-y-1 p-3">
        <div className="flex items-center justify-between">
          <h3 className="line-clamp-1 font-medium">{listing.title}</h3>
          <span className="whitespace-nowrap text-sm font-semibold">{price}</span>
        </div>
        <p className="line-clamp-2 text-sm text-gray-600">{listing.description}</p>
        {(categoryName || listing.condition) && (
          <div className="text-xs text-gray-500">
            {categoryName}
            {categoryName && listing.condition && " • "}
            {listing.condition}
          </div>
        )}
      </div>
    </Link>
  )
}
