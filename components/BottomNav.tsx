'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const items = [
  { href: '/', label: 'Marketplace', icon: '🏪' },
  { href: '/my', label: 'My Listings', icon: '📦' },
  { href: '/listings/new', label: 'Post', icon: '➕' },
  { href: '/profile', label: 'Profile', icon: '👤' },
]

export default function BottomNav() {
  const path = usePathname()
  return (
  <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-[var(--background-elevated)] backdrop-blur shadow-subtle">
      <ul className="mx-auto flex max-w-2xl items-center justify-around p-2 text-sm text-foreground-secondary">
        {items.map(i => {
          const active = path === i.href
          return (
            <li key={i.href}>
              <Link href={i.href}
                className={`flex flex-col items-center rounded-xl px-3 py-1 transition-colors ${active ? 'text-primary' : 'hover:text-foreground text-foreground-secondary'}`}>
                <span aria-hidden>{i.icon}</span><span>{i.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
