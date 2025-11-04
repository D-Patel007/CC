import "./globals.css"
import UserButton from "@/components/UserButton"
import Footer from "@/components/Footer"
import ThemeToggle from "@/components/ThemeToggle"
import SearchBar from "@/components/SearchBar"
import NotificationBell from "@/components/NotificationBell"
import ClientProviders from "@/components/ClientProviders"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                  document.documentElement.classList.remove('light');
                } else {
                  document.documentElement.classList.add('light');
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground flex flex-col transition-colors">
        <ClientProviders>
          {/* Header (always visible) */}
          <header className="sticky top-0 z-10 border-b border-border bg-[var(--background-elevated)] backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 text-foreground">
              <div className="flex items-center gap-4">
                <a href="/" className="flex items-center gap-3">
                  <img src="/logo.png" alt="Campus Connect" className="w-12 h-12 rounded-lg shadow-subtle" />
                  <div className="font-semibold text-lg hidden sm:block">
                    <div className="text-foreground">Campus Connect</div>
                    <div className="text-xs text-foreground-secondary">For Beacons, by Beacons</div>
                  </div>
                </a>
                <nav className="hidden md:flex items-center gap-4 ml-6 text-sm text-foreground-secondary">
                  <a href="/" className="hover:underline hover:text-primary">Marketplace</a>
                  <a href="/events" className="hover:underline hover:text-primary">Events</a>
                  <a href="/messages" className="hover:underline hover:text-primary">Messages</a>
                  <a href="/my" className="hover:underline hover:text-primary">My Listings</a>
                  <a href="/listings/new" className="hover:underline hover:text-primary">+ Create</a>
                  <a href="/profile" className="hover:underline hover:text-primary">Profile</a>
                </nav>
              </div>

              {/* Search Bar */}
              <div className="flex-1 max-w-md hidden lg:block">
                <SearchBar />
              </div>

              <div className="flex items-center gap-3">
                <ThemeToggle />
                <NotificationBell />
                <UserButton />
              </div>
            </div>
            
            {/* Mobile Search Bar */}
            <div className="lg:hidden px-4 pb-3">
              <SearchBar />
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 flex flex-col">
            <div className="mx-auto max-w-5xl w-full px-4 py-6 flex-1 flex flex-col min-h-0">
              {children}
            </div>
          </main>

          {/* Footer */}
          <Footer />
        </ClientProviders>
      </body>
    </html>
  )
}
