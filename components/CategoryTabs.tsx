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
    <div className="mb-6 flex items-center justify-between">
      <div className="flex items-center gap-3 flex-wrap">
        {options.map((option) => {
          const isActive = selected === option.value.toLowerCase()
          return (
            <button
              key={option.value}
              onClick={() => setCategory(option.value)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                isActive
                  ? 'border border-primary bg-primary/15 text-foreground dark:border-transparent dark:bg-primary dark:text-white shadow-subtle'
                  : 'border border-border bg-[var(--background-secondary)] text-foreground-secondary hover:text-foreground hover:border-primary'
              }`}
              aria-pressed={isActive}
              aria-label={`Filter by ${option.label}`}
            >
              {option.label}
            </button>
          )
        })}
        {options.length === 1 && (
          <span className="text-sm text-foreground-secondary">
            No categories yet — create one to get started.
          </span>
        )}
      </div>
      <div>
        <select
          defaultValue={sp.get('sort') || 'recent'}
          onChange={(e) => {
            const q = new URLSearchParams(sp.toString())
            if (!e.target.value) q.delete('sort')
            else q.set('sort', e.target.value)
            router.push(`/?${q.toString()}`)
          }}
          className="rounded-xl border border-border bg-[var(--input-bg)] px-3 py-2 text-sm text-foreground"
          aria-label="Sort listings"
        >
          <option value="recent">Most Recent</option>
          <option value="price_low">Price (low to high)</option>
          <option value="price_high">Price (high to low)</option>
        </select>
      </div>
    </div>
  )
}