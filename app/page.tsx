import { prisma } from "@/lib/db"
import CategoryTabs from "@/components/CategoryTabs"
import ListingCard from "@/components/ListingCard"

type Search = { category?: string | null }

export const dynamic = "force-dynamic" // avoid caching during dev

export default async function Marketplace({ searchParams }: { searchParams?: Search }) {
  const selected = (searchParams?.category ?? "All") as string

  // Fetch listings only (no prisma.category calls, so no crash)
  let listings: {
    id: number | string
    title: string
    description?: string | null
    imageUrl?: string | null
    createdAt?: Date
    // optional fields that may or may not exist in your schema:
    category?: string | null
    priceCents?: number | null
    price?: number | null
    condition?: string | null
    isSold?: boolean
    campus?: string | null
    soldAt?: Date | null
  }[] = []

  try {
    listings = await prisma.listing.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
    })
  } catch (err) {
    // If Prisma fails for any reason, render a friendly message (no crash)
    return (
      <main className="mx-auto max-w-5xl p-6">
        <h1 className="mb-2 text-2xl font-semibold">Campus Connect</h1>
        <p className="rounded-lg border bg-red-50 p-4 text-sm">
          Couldn’t load listings. Check your Prisma schema and server logs.
        </p>
      </main>
    )
  }

  // In-memory filter by category (safe even if `category` field doesn’t exist)
  const filtered =
    selected && selected !== "All"
      ? listings.filter((l: any) => {
          if (!l?.category) return false
          if (typeof l.category === "string") {
            return l.category.toLowerCase() === selected.toLowerCase()
          }
          if (typeof l.category?.name === "string") {
            if (l.category.name.toLowerCase() === selected.toLowerCase()) return true
          }
          if (typeof l.category?.slug === "string") {
            return l.category.slug.toLowerCase() === selected.toLowerCase()
          }
          return false
        })
      : listings

  return (
    <main className="mx-auto max-w-5xl p-6">
      <header className="mb-4">
        <h1 className="text-3xl font-bold">Campus Connect</h1>
        <p className="mt-1 text-sm text-gray-500">For Beacons, by Beacons</p>
      </header>

      {/* Category filter writes ?category=... in the URL */}
      <CategoryTabs />

      {filtered.length === 0 ? (
        <p className="text-gray-600">No listings found.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 list-none">
          {filtered.map((listing) => (
            <li key={String(listing.id)}>
              <ListingCard listing={listing} />
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
