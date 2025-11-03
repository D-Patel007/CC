"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

type SearchResult = {
  listings: Array<{
    id: number
    title: string
    description: string
    priceCents: number
    imageUrl: string | null
    isSold: boolean
    category: { name: string } | null
  }>
  events: Array<{
    id: number
    title: string
    description: string
    eventDate: string
    location: string
    imageUrl: string | null
    category: string | null
  }>
}

export default function SearchBar() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult>({ listings: [], events: [] })
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Debounce search
  useEffect(() => {
    if (query.length < 2) {
      setResults({ listings: [], events: [] })
      setIsOpen(false)
      return
    }

    const timer = setTimeout(async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        if (res.ok) {
          const data = await res.json()
          setResults(data)
          setIsOpen(true)
        }
      } catch (error) {
        console.error("Search failed:", error)
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function handleResultClick(type: "listing" | "event", id: number) {
    setIsOpen(false)
    setQuery("")
    router.push(type === "listing" ? `/listings/${id}` : `/events/${id}`)
  }

  const totalResults = results.listings.length + results.events.length

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search listings & events..."
          className="w-full rounded-lg border border-border bg-[var(--input-bg)] px-4 py-2 pl-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <svg
          className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        {isLoading && (
          <div className="absolute right-3 top-2.5">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && query.length >= 2 && (
        <div className="absolute top-full mt-2 w-full rounded-lg border border-border bg-[var(--background-elevated)] shadow-lg max-h-96 overflow-y-auto z-50">
          {totalResults === 0 ? (
            <div className="p-4 text-center text-sm text-foreground-secondary">
              No results found for "{query}"
            </div>
          ) : (
            <>
              {/* Listings */}
              {results.listings.length > 0 && (
                <div className="border-b border-border">
                  <div className="px-3 py-2 text-xs font-semibold text-foreground-secondary uppercase tracking-wide">
                    Listings
                  </div>
                  {results.listings.map((listing) => (
                    <button
                      key={listing.id}
                      onClick={() => handleResultClick("listing", listing.id)}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-[var(--background-secondary)] transition text-left"
                    >
                      {listing.imageUrl ? (
                        <img
                          src={listing.imageUrl}
                          alt={listing.title}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-[var(--background-secondary)] rounded flex items-center justify-center text-2xl">
                          📦
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {listing.title}
                        </p>
                        <p className="text-xs text-foreground-secondary">
                          ${(listing.priceCents / 100).toFixed(2)}
                          {listing.category && ` • ${listing.category.name}`}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Events */}
              {results.events.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-xs font-semibold text-foreground-secondary uppercase tracking-wide">
                    Events
                  </div>
                  {results.events.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => handleResultClick("event", event.id)}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-[var(--background-secondary)] transition text-left"
                    >
                      {event.imageUrl ? (
                        <img
                          src={event.imageUrl}
                          alt={event.title}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-[var(--background-secondary)] rounded flex items-center justify-center text-2xl">
                          📅
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {event.title}
                        </p>
                        <p className="text-xs text-foreground-secondary">
                          {new Date(event.eventDate).toLocaleDateString()} • {event.location}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
