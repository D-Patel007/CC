'use client'
import { useState } from 'react'

type Category = { id: number; name: string }

export default function ListingForm({ categories = [] as Category[] }) {
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const form = e.currentTarget
    const fd = new FormData(form)
    const data = Object.fromEntries(fd.entries())

    // optional: coerce number fields
    if (typeof data.price === 'string') {
      data.price = parseFloat(data.price as string)
    }

    const res = await fetch('/api/listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    setLoading(false)
    if (res.ok) window.location.href = '/'
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input
        name="title"
        placeholder="Title"
        required
        className="w-full rounded-xl border p-3"
      />

      <textarea
        name="description"
        placeholder="Description"
        required
        className="w-full rounded-xl border p-3"
        rows={5}
      />

      <div className="grid grid-cols-2 gap-3">
        <input
          name="price"
          type="number"
          step="0.01"
          placeholder="Price (USD)"
          required
          className="rounded-xl border p-3"
        />

        <select name="condition" className="rounded-xl border p-3" defaultValue="GOOD">
          <option value="NEW">New</option>
          <option value="LIKE_NEW">Like New</option>
          <option value="GOOD">Good</option>
          <option value="FAIR">Fair</option>
          <option value="USED">Used</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <select name="categoryId" className="rounded-xl border p-3" defaultValue="">
          <option value="">Select a category</option>
          {(categories ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <input
          name="imageUrl"
          placeholder="Image URL (optional)"
          className="rounded-xl border p-3"
        />
      </div>

      <button disabled={loading} className="rounded-xl bg-black px-5 py-3 text-white">
        {loading ? 'Creating…' : 'Create Listing'}
      </button>
    </form>
  )
}
