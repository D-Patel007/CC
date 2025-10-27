// app/page.tsx
import Link from "next/link"
import { prisma } from "@/lib/db"
import CategoryTabs from "@/components/CategoryTabs"

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
  }[] = []

  try {
    listings = await prisma.listing.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
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
      ? listings.filter((l: any) => (l?.category || "").toLowerCase() === selected.toLowerCase())
      : listings

  return (
    <main className="mx-auto max-w-5xl p-6">
      <header className="mb-2">
        <h1 className="text-2xl font-semibold">Campus Connect</h1>
        <p className="text-sm text-gray-500">For Beacons, by Beacons</p>
      </header>

      {/* Category filter writes ?category=... in the URL */}
      <CategoryTabs />

      {filtered.length === 0 ? (
        <p className="text-gray-600">No listings found.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((l) => {
            const img = l.imageUrl && l.imageUrl.trim() !== "" ? l.imageUrl : "/no-image.svg"
            const price =
              typeof l.priceCents === "number"
                ? (l.priceCents ?? 0) / 100
                : (l.price ?? 0)

            return (
              <li key={String(l.id)} className="rounded-xl border hover:bg-gray-50">
                <Link href={`/listings/${l.id}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt={l.title} className="h-48 w-full rounded-t-xl object-cover" />
                  <div className="space-y-1 p-3">
                    <div className="line-clamp-1 font-medium">{l.title}</div>
                    {typeof (l as any).category === "string" && (l as any).category ? (
                      <div className="text-xs text-gray-500">{(l as any).category}</div>
                    ) : null}
                    <div className="font-semibold">${Number(price).toFixed(2)}</div>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
