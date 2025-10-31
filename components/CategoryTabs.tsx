"use client"
import { useRouter, useSearchParams } from "next/navigation"

const CATEGORIES = ["All", "Books", "Furniture", "Electronics", "Clothing", "Appliances"]

export default function CategoryTabs() {
  const router = useRouter()
  const sp = useSearchParams()
  const selected = sp.get("category") || "All"

  function setCategory(cat: string) {
    const q = new URLSearchParams(sp.toString())
    if (!cat || cat === "All") q.delete("category")
    else q.set("category", cat)
    router.push(`/?${q.toString()}`)
  }

  return (
    <div className="mb-6 flex items-center justify-between">
      <div className="flex items-center gap-3 flex-wrap">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              selected.toLowerCase() === c.toLowerCase() 
                ? 'bg-primary text-white shadow-subtle' 
                : 'border border-border bg-[var(--background-secondary)] text-foreground-secondary hover:text-foreground hover:border-primary'
            }`}
          >
            {c}
          </button>
        ))}
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
        >
          <option value="recent">Most Recent</option>
          <option value="price_low">Price (low to high)</option>
          <option value="price_high">Price (high to low)</option>
        </select>
      </div>
    </div>
  )
}