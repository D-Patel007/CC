import { prisma } from "@/lib/db"
import ListingCard from "@/components/ListingCard"
import CategoryTabs from "@/components/CategoryTabs"
import type { Listing, Category } from "@prisma/client"

type ListingWithCategory = Listing & { category: Category | null }

export const dynamic = "force-dynamic"

export default async function Marketplace() {
  let listings: ListingWithCategory[] = []

  try {
    listings = await prisma.listing.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        category: true,
      },
    })
  } catch (err) {
    return (
      <main className="mx-auto max-w-5xl p-6">
        <h1 className="mb-2 text-2xl font-semibold">Campus Connect</h1>
        <p className="rounded-lg border bg-red-50 p-4 text-sm">
          Could not load listings. Check your Prisma schema and server logs.
        </p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <header className="mb-4">
        <h1 className="text-3xl font-bold">Marketplace</h1>
        <p className="mt-1 text-sm text-gray-500">Browse items posted by fellow Beacons.</p>
      </header>

      <CategoryTabs />

      {listings.length === 0 ? (
        <p className="text-gray-600">No listings found.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 list-none">
          {listings.map((listing) => (
            <li key={listing.id}>
              <ListingCard listing={listing} />
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
