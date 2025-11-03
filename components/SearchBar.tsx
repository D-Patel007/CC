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
    <div ref={searchRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search..."
          className="w-full rounded-lg border border-border bg-[var(--input-bg)] px-3 py-2 pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
        />
        <svg
          className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
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
          <div className="absolute right-2.5 top-2.5">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
        {query && !isLoading && (
          <button
            onClick={() => {
              setQuery("")
              setIsOpen(false)
            }}
            className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground transition"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && query.length >= 2 && (
        <div className="absolute top-full mt-2 w-full min-w-[320px] rounded-lg border border-border bg-[var(--background-elevated)] shadow-xl max-h-96 overflow-y-auto z-50">
          {totalResults === 0 ? (
            <div className="p-4 text-center">
              <div className="text-3xl mb-2">🔍</div>
              <p className="text-sm text-foreground-secondary">
                No results for <span className="font-semibold text-foreground">"{query}"</span>
              </p>
            </div>
          ) : (
            <>
              {/* Listings */}
              {results.listings.length > 0 && (
                <div className="border-b border-border">
                  <div className="px-3 py-2 text-xs font-semibold text-primary uppercase tracking-wide bg-primary/5">
                    Listings ({results.listings.length})
                  </div>
                  {results.listings.map((listing) => (
                    <button
                      key={listing.id}
                      onClick={() => handleResultClick("listing", listing.id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-primary/5 transition text-left border-b border-border/30 last:border-b-0"
                    >
                      {listing.imageUrl ? (
                        <img
                          src={listing.imageUrl}
                          alt={listing.title}
                          className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-background-secondary rounded-lg flex items-center justify-center text-xl flex-shrink-0">
                          📦
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {listing.title}
                        </p>
                        <p className="text-xs text-foreground-secondary mt-0.5">
                          <span className="font-semibold text-primary">${(listing.priceCents / 100).toFixed(2)}</span>
                          {listing.category && <span> • {listing.category.name}</span>}
                          {listing.isSold && <span className="text-error"> • SOLD</span>}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Events */}
              {results.events.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-xs font-semibold text-primary uppercase tracking-wide bg-primary/5">
                    Events ({results.events.length})
                  </div>
                  {results.events.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => handleResultClick("event", event.id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-primary/5 transition text-left border-b border-border/30 last:border-b-0"
                    >
                      {event.imageUrl ? (
                        <img
                          src={event.imageUrl}
                          alt={event.title}
                          className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-background-secondary rounded-lg flex items-center justify-center text-xl flex-shrink-0">
                          📅
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {event.title}
                        </p>
                        <p className="text-xs text-foreground-secondary mt-0.5">
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
