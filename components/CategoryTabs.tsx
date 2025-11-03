"use client"
import { useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"

type CategoryTab = {
  id: number
  name: string
  slug: string | null
}

type CategoryTabsProps = {
  categories: CategoryTab[]
}

// Category icon mapping - UMB inspired
const categoryIcons: Record<string, string> = {
  "all": "🏛️",
  "electronics": "💻",
  "books": "📚",
  "furniture": "🛋️",
  "clothing": "👕",
  "appliances": "🔌",
  "sports equipment": "⚽",
  "school supplies": "✏️",
  "other": "📦",
}

function getCategoryIcon(categoryName: string): string {
  const key = categoryName.toLowerCase()
  return categoryIcons[key] || "📦"
}

function fallbackSlug(label: string) {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export default function CategoryTabs({ categories }: CategoryTabsProps) {
  const router = useRouter()
  const sp = useSearchParams()
  const selected = (sp.get("category") || "all").toLowerCase()

  const options = useMemo(() => {
    const dynamic = categories.map((category) => {
      const value = category.slug?.toLowerCase() || fallbackSlug(category.name)
      return {
        label: category.name,
        value,
      }
    })

    return [
      { label: "All", value: "all" },
      ...dynamic,
    ]
  }, [categories])

  function setCategory(value: string) {
    const q = new URLSearchParams(sp.toString())
    if (!value || value === "all") q.delete("category")
    else q.set("category", value)
    router.push(`/?${q.toString()}`)
  }

  return (
    <div className="mb-8 space-y-4">
      {/* Category Pills */}
      <div className="flex items-center gap-3 flex-wrap">
        {options.map((option) => {
          const isActive = selected === option.value.toLowerCase()
          const icon = getCategoryIcon(option.label)
          return (
            <button
              key={option.value}
              onClick={() => setCategory(option.value)}
              className={`group rounded-modern px-5 py-3 text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                isActive
                  ? 'border-2 border-primary bg-primary text-white shadow-lg scale-105'
                  : 'border-2 border-border bg-background-elevated text-foreground-secondary hover:text-foreground hover:border-primary hover:scale-105 hover:shadow-subtle'
              }`}
              aria-pressed={isActive}
              aria-label={`Filter by ${option.label}`}
            >
              <span className="text-lg">{icon}</span>
              <span>{option.label}</span>
            </button>
          )
        })}
        {options.length === 1 && (
          <span className="text-sm text-foreground-secondary italic">
            No categories yet — create one to get started.
          </span>
        )}
      </div>

      {/* Sort Dropdown */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p className="text-sm text-foreground-secondary">
          Showing <span className="font-semibold text-foreground">{selected === "all" ? "all" : selected}</span> items
        </p>
        <div className="flex items-center gap-2">
          <label htmlFor="sort-select" className="text-sm font-medium text-foreground-secondary">
            Sort by:
          </label>
          <select
            id="sort-select"
            defaultValue={sp.get('sort') || 'recent'}
            onChange={(e) => {
              const q = new URLSearchParams(sp.toString())
              if (!e.target.value) q.delete('sort')
              else q.set('sort', e.target.value)
              router.push(`/?${q.toString()}`)
            }}
            className="rounded-modern border-2 border-border bg-background-elevated px-4 py-2 text-sm font-medium text-foreground hover:border-primary transition-colors cursor-pointer"
            aria-label="Sort listings"
          >
            <option value="recent">Most Recent</option>
            <option value="price_low">Price (Low to High)</option>
            <option value="price_high">Price (High to Low)</option>
          </select>
        </div>
      </div>
    </div>
  )
}