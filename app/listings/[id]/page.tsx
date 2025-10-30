import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import Link from "next/link"

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function ListingDetailPage({ params }: PageProps) {
  const { id } = await params
  const listingId = parseInt(id)
  
  if (isNaN(listingId)) {
    notFound()
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: {
      category: true,
      seller: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          createdAt: true
        }
      }
    }
  })

  if (!listing) {
    notFound()
  }

  const { profile } = await getCurrentUser()
  const isOwnListing = profile?.id === listing.seller.id
  const price = `$${(listing.priceCents / 100).toFixed(2)}`
  const sellerName = listing.seller.name || "Anonymous"

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Image */}
          <div className="aspect-square bg-gray-100">
            {listing.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={listing.imageUrl} 
                alt={listing.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <span className="text-6xl">📦</span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="p-6 space-y-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{listing.title}</h1>
              <p className="text-3xl font-bold text-blue-600">{price}</p>
            </div>

            <div className="flex gap-2 text-sm">
              {listing.category && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                  {listing.category.name}
                </span>
              )}
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
                {listing.condition}
              </span>
              {listing.isSold && (
                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full">
                  SOLD
                </span>
              )}
            </div>

            <div className="border-t pt-4">
              <h2 className="font-semibold mb-2">Description</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{listing.description}</p>
            </div>

            {listing.campus && (
              <div className="border-t pt-4">
                <h2 className="font-semibold mb-2">Location</h2>
                <p className="text-gray-700">{listing.campus}</p>
              </div>
            )}

            <div className="border-t pt-4">
              <h2 className="font-semibold mb-2">Seller</h2>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                  {sellerName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">{sellerName}</p>
                  <p className="text-sm text-gray-500">
                    Member since {new Date(listing.seller.createdAt).getFullYear()}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="border-t pt-4 space-y-2">
              {!isOwnListing && !listing.isSold && (
                <form action="/api/conversations/create" method="POST">
                  <input type="hidden" name="listingId" value={listing.id} />
                  <input type="hidden" name="sellerId" value={listing.seller.id} />
                  <button 
                    type="submit"
                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium"
                  >
                    💬 Message Seller
                  </button>
                </form>
              )}
              
              {isOwnListing && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-500 text-center">This is your listing</p>
                  <button 
                    className="w-full border border-gray-300 py-3 rounded-lg hover:bg-gray-50 transition"
                  >
                    Edit Listing
                  </button>
                  {!listing.isSold && (
                    <button 
                      className="w-full border border-red-300 text-red-600 py-3 rounded-lg hover:bg-red-50 transition"
                    >
                      Mark as Sold
                    </button>
                  )}
                </div>
              )}

              <Link 
                href="/"
                className="block text-center py-3 text-gray-600 hover:text-gray-900 transition"
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
