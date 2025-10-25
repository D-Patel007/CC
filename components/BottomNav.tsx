'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const items = [
  { href: '/', label: 'Marketplace', icon: '🏪' },
  { href: '/listings/new', label: 'Post', icon: '➕' },
  { href: '/profile', label: 'Profile', icon: '👤' },
]

export default function BottomNav() {
  const path = usePathname()
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-white/95 backdrop-blur">
      <ul className="mx-auto flex max-w-2xl items-center justify-around p-2 text-sm">
        {items.map(i => {
          const active = path === i.href
          return (
            <li key={i.href}>
              <Link href={i.href}
                className={`flex flex-col items-center rounded-xl px-3 py-1 ${active ? 'text-blue-600' : 'text-gray-600'}`}>
                <span aria-hidden>{i.icon}</span><span>{i.label}</span>
              </Link>
              youness
              rachid
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
