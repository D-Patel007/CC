// app/page.tsx
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic" // avoid caching during dev

export default async function Marketplace() {
  // Try to load categories from DB; fall back to a static list if the table doesn't exist yet
  let categories:
    | { id: number | string; name: string }[]
    | undefined = undefined

  try {
    categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    })
  } catch {
    // Fallback so the page still renders even if Category table isn't created yet
    categories = [
      { id: 1, name: "Books" },
      { id: 2, name: "Clothing" },
      { id: 3, name: "Electronics" },
      { id: 4, name: "Furniture" },
    ]
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="mb-4 text-2xl font-bold">Campus Connect</h1>

      <section className="mb-6">
        <h2 className="mb-2 text-lg font-semibold">Categories</h2>
        <div className="flex flex-wrap gap-2">
          {(categories ?? []).map((c) => (
            <span
              key={String(c.id)}
              className="rounded-full bg-gray-200 px-3 py-1 text-sm"
            >
              {c.name}
            </span>
          ))}
        </div>
      </section>

      {/* Your listings grid goes here */}
      <p className="text-gray-600">
        Add your listings grid here (e.g., fetch from <code>prisma.listing</code> and render cards).
      </p>
    </main>
  )
}
