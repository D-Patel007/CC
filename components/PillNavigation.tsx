'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function PillNavigation() {
  const [isPostDropdownOpen, setIsPostDropdownOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsPostDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  return (
    <>
      {/* Fixed Pill Navigation */}
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-2xl">
        <div className="pill-nav backdrop-blur-xl bg-white/10 dark:bg-black/20 border border-white/20 dark:border-white/10 rounded-full px-6 py-3 shadow-lg">
          <div className="flex items-center justify-between">
            {/* Logo/Brand */}
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img src="/logo.png" alt="CC" className="w-8 h-8" />
              <span className="font-bold text-lg hidden sm:block text-[var(--foreground)]">
                Campus Connect
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2">
              <Link
                href="/"
                className="nav-pill px-5 py-2 rounded-full transition-all hover:bg-white/20 dark:hover:bg-white/10 hover:shadow-md text-[var(--foreground)] font-medium"
              >
                Home
              </Link>
              <Link
                href="/marketplace"
                className="nav-pill px-5 py-2 rounded-full transition-all hover:bg-white/20 dark:hover:bg-white/10 hover:shadow-md text-[var(--foreground)] font-medium"
              >
                Marketplace
              </Link>

              {/* Post Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsPostDropdownOpen(!isPostDropdownOpen)}
                  className="nav-pill px-5 py-2 rounded-full transition-all hover:bg-white/20 dark:hover:bg-white/10 hover:shadow-md text-[var(--foreground)] font-medium flex items-center gap-1"
                >
                  Post
                  <svg
                    className={`w-4 h-4 transition-transform ${isPostDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isPostDropdownOpen && (
                  <div className="absolute top-full mt-2 right-0 w-48 backdrop-blur-xl bg-white/90 dark:bg-black/80 border border-white/20 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden animate-scale-in">
                    <Link
                      href="/listings/new"
                      className="block px-4 py-3 hover:bg-white/30 dark:hover:bg-white/10 transition-colors text-[var(--foreground)] font-medium"
                      onClick={() => setIsPostDropdownOpen(false)}
                    >
                      📦 Item
                    </Link>
                    <Link
                      href="/events/new"
                      className="block px-4 py-3 hover:bg-white/30 dark:hover:bg-white/10 transition-colors text-[var(--foreground)] font-medium border-t border-white/10"
                      onClick={() => setIsPostDropdownOpen(false)}
                    >
                      📅 Event
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile/Tablet - Show all items */}
            <div className="flex md:hidden items-center gap-2">
              <Link
                href="/"
                className="nav-pill px-3 py-2 rounded-full transition-all hover:bg-white/20 dark:hover:bg-white/10 text-[var(--foreground)] text-sm font-medium"
              >
                Home
              </Link>
              <Link
                href="/marketplace"
                className="nav-pill px-3 py-2 rounded-full transition-all hover:bg-white/20 dark:hover:bg-white/10 text-[var(--foreground)] text-sm font-medium"
              >
                Market
              </Link>

              {/* Mobile Post Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsPostDropdownOpen(!isPostDropdownOpen)}
                  className="nav-pill px-3 py-2 rounded-full transition-all hover:bg-white/20 dark:hover:bg-white/10 text-[var(--foreground)] text-sm font-medium flex items-center gap-1"
                >
                  Post
                  <svg
                    className={`w-3 h-3 transition-transform ${isPostDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Mobile Dropdown */}
                {isPostDropdownOpen && (
                  <div className="absolute top-full mt-2 right-0 w-40 backdrop-blur-xl bg-white/90 dark:bg-black/80 border border-white/20 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden animate-scale-in">
                    <Link
                      href="/listings/new"
                      className="block px-3 py-2 hover:bg-white/30 dark:hover:bg-white/10 transition-colors text-[var(--foreground)] text-sm font-medium"
                      onClick={() => setIsPostDropdownOpen(false)}
                    >
                      📦 Item
                    </Link>
                    <Link
                      href="/events/new"
                      className="block px-3 py-2 hover:bg-white/30 dark:hover:bg-white/10 transition-colors text-[var(--foreground)] text-sm font-medium border-t border-white/10"
                      onClick={() => setIsPostDropdownOpen(false)}
                    >
                      📅 Event
                    </Link>
                  </div>
                )}
              </div>

              {/* Hamburger Menu Button (for phone only) */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="sm:hidden nav-pill p-2 rounded-full transition-all hover:bg-white/20 dark:hover:bg-white/10 text-[var(--foreground)]"
                aria-label="Menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Full Menu Overlay (phone only) */}
      {isMobileMenuOpen && (
        <div className="sm:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}>
          <div
            className="absolute top-20 left-4 right-4 backdrop-blur-xl bg-white/90 dark:bg-black/80 border border-white/20 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 space-y-2">
              <Link
                href="/"
                className="block px-4 py-3 rounded-xl hover:bg-white/30 dark:hover:bg-white/10 transition-colors text-[var(--foreground)] font-medium"
              >
                🏠 Home
              </Link>
              <Link
                href="/marketplace"
                className="block px-4 py-3 rounded-xl hover:bg-white/30 dark:hover:bg-white/10 transition-colors text-[var(--foreground)] font-medium"
              >
                🏪 Marketplace
              </Link>
              <Link
                href="/events"
                className="block px-4 py-3 rounded-xl hover:bg-white/30 dark:hover:bg-white/10 transition-colors text-[var(--foreground)] font-medium"
              >
                📅 Events
              </Link>
              <Link
                href="/listings/new"
                className="block px-4 py-3 rounded-xl hover:bg-white/30 dark:hover:bg-white/10 transition-colors text-[var(--foreground)] font-medium"
              >
                📦 Post Item
              </Link>
              <Link
                href="/events/new"
                className="block px-4 py-3 rounded-xl hover:bg-white/30 dark:hover:bg-white/10 transition-colors text-[var(--foreground)] font-medium"
              >
                ➕ Post Event
              </Link>
              <Link
                href="/messages"
                className="block px-4 py-3 rounded-xl hover:bg-white/30 dark:hover:bg-white/10 transition-colors text-[var(--foreground)] font-medium"
              >
                💬 Messages
              </Link>
              <Link
                href="/profile"
                className="block px-4 py-3 rounded-xl hover:bg-white/30 dark:hover:bg-white/10 transition-colors text-[var(--foreground)] font-medium"
              >
                👤 Profile
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
