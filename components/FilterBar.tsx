'use client'
import { useRouter, useSearchParams } from 'next/navigation'

export default function FilterBar({ categories }: { categories: { id: number; name: string }[] }) {
  const router = useRouter()
  const sp = useSearchParams()
  function setQS(next: Record<string, string | number | undefined>) {
    const q = new URLSearchParams(sp.toString())
    Object.entries(next).forEach(([k, v]) => { if (!v) q.delete(k); else q.set(k, String(v)) })
    router.push(`/?${q.toString()}`)
  }
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
  <input defaultValue={sp.get('q') || ''} onChange={(e)=>setQS({ q: e.target.value })} placeholder="Search..." className="w-56 rounded-xl border border-border bg-[var(--input-bg)] px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary" />
  <select defaultValue={sp.get('categoryId') || ''} onChange={(e)=>setQS({ categoryId: e.target.value })} className="rounded-xl border border-border bg-[var(--input-bg)] px-3 py-2 text-foreground focus:border-primary">
        <option value="">All</option>
        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
  <input type="number" step="0.01" placeholder="Min $" defaultValue={sp.get('min')||''} onBlur={(e)=>setQS({ min: e.target.value })} className="w-28 rounded-xl border border-border bg-[var(--input-bg)] px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary" />
  <input type="number" step="0.01" placeholder="Max $" defaultValue={sp.get('max')||''} onBlur={(e)=>setQS({ max: e.target.value })} className="w-28 rounded-xl border border-border bg-[var(--input-bg)] px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary" />
    </div>
  )
}
