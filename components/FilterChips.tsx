'use client'

import { useRouter, useSearchParams } from 'next/navigation'

interface FilterChipsProps {
  categories: Array<{ id: number; name: string; slug: string | null }>
  type?: 'category' | 'condition' | 'sort'
}

export default function FilterChips({ categories, type = 'category' }: FilterChipsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentCategory = searchParams.get('category') || 'all'
  const currentCondition = searchParams.get('condition') || 'all'
  const currentSort = searchParams.get('sort') || 'newest'

  const handleFilterChange = (value: string, filterType: string) => {
    const params = new URLSearchParams(searchParams.toString())

    if (value === 'all') {
      params.delete(filterType)
    } else {
      params.set(filterType, value)
    }

    router.push(`?${params.toString()}`, { scroll: false })
  }

  // Condition filters
  const conditions = [
    { id: 0, name: 'All Conditions', slug: 'all' },
    { id: 1, name: 'New', slug: 'new' },
    { id: 2, name: 'Like New', slug: 'like-new' },
    { id: 3, name: 'Good', slug: 'good' },
    { id: 4, name: 'Fair', slug: 'fair' },
  ]

  // Sort options
  const sortOptions = [
    { id: 0, name: 'Newest First', slug: 'newest' },
    { id: 1, name: 'Price: Low to High', slug: 'price_low' },
    { id: 2, name: 'Price: High to Low', slug: 'price_high' },
  ]

  const items = type === 'category'
    ? [{ id: 0, name: 'All', slug: 'all' }, ...categories]
    : type === 'condition'
    ? conditions
    : sortOptions

  const currentValue = type === 'category'
    ? currentCategory
    : type === 'condition'
    ? currentCondition
    : currentSort

  return (
    <div className="flex flex-wrap gap-3">
      {items.map((item) => {
        const isActive = currentValue.toLowerCase() === (item.slug || item.name).toLowerCase()
        return (
          <button
            key={item.id}
            onClick={() => handleFilterChange(item.slug || item.name.toLowerCase(), type)}
            className={`
              px-5 py-2.5 rounded-full font-medium transition-all duration-300
              ${isActive
                ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105'
                : 'bg-white/50 dark:bg-white/5 text-foreground hover:bg-white/80 dark:hover:bg-white/10 hover:shadow-md border border-border'
              }
            `}
          >
            {item.name}
          </button>
        )
      })}
    </div>
  )
}
