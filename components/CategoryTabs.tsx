'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const CATEGORIES = ['All', 'Books', 'Clothing', 'Electronics', 'Furniture'] as const

export default function CategoryTabs() {
  const router = useRouter()
  const params = useSearchParams()
  const selected = params.get('category') || 'All'

  function onSelect(name: string) {
    const sp = new URLSearchParams(params.toString())
    if (name === 'All') sp.delete('category')
    else sp.set('category', name)
    router.push(`/?${sp.toString()}`)
  }

  return (
    <div className="mb-3 flex flex-wrap gap-2">
      {CATEGORIES.map((name) => {
        const active = selected === name || (name === 'All' && !params.get('category'))
        return (
          <button
            key={name}
            onClick={() => onSelect(name)}
            className={
              active
                ? 'rounded-full bg-blue-600 px-3 py-1 text-white'
                : 'rounded-full bg-gray-100 px-3 py-1 text-gray-800 hover:bg-gray-200'
            }
          >
            {name}
          </button>
        )
      })}
    </div>
  )
}
