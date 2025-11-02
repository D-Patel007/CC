import { ListingCardSkeleton } from "@/components/Skeleton"

export default function Loading() {
  return (
    <main className="min-h-screen pb-20">
      {/* Hero Section Skeleton */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.45),_transparent_60%)]" aria-hidden />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(14,116,144,0.28),_transparent_65%)]" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-6 py-12 rounded-3xl border border-border bg-[var(--background-elevated)] shadow-float">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-gray-300 dark:bg-gray-700 rounded-lg w-2/3"></div>
            <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded-lg w-3/4"></div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Category Tabs Skeleton */}
        <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div 
              key={i}
              className="h-10 w-24 bg-gray-300 dark:bg-gray-700 rounded-lg animate-pulse flex-shrink-0"
            />
          ))}
        </div>

        {/* Listings Grid Skeleton */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </main>
  )
}
