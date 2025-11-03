import "./globals.css"
import UserButton from "@/components/UserButton"
import Footer from "@/components/Footer"
import ThemeToggle from "@/components/ThemeToggle"
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
          {/* Header (always visible) - Clean and Simple */}
          <header className="sticky top-0 z-50 border-b border-border bg-[var(--background-elevated)]/95 backdrop-blur-lg shadow-sm">
            <div className="mx-auto max-w-7xl px-6 py-3 text-foreground">
              <div className="flex items-center justify-between gap-6">
                {/* Left: Logo + Nav */}
                <div className="flex items-center gap-8">
                  <a href="/" className="flex items-center gap-3 group flex-shrink-0">
                    <div className="relative">
                      <img src="/logo.png" alt="Campus Connect" className="w-10 h-10 rounded-lg transition-all group-hover:scale-105" />
                    </div>
                    <div className="font-semibold hidden sm:block">
                      <div className="text-foreground font-bold text-base leading-tight">Campus Connect</div>
                      <div className="text-[10px] text-primary font-medium">For Beacons, by Beacons 🎓</div>
                    </div>
                  </a>
                  
                  {/* Navigation */}
                  <nav className="hidden lg:flex items-center gap-1">
                    <a href="/" className="px-3 py-1.5 rounded-lg text-sm font-medium text-foreground-secondary hover:text-primary hover:bg-primary/10 transition-all">
                      Marketplace
                    </a>
                    <a href="/events" className="px-3 py-1.5 rounded-lg text-sm font-medium text-foreground-secondary hover:text-primary hover:bg-primary/10 transition-all">
                      Events
                    </a>
                    <a href="/messages" className="px-3 py-1.5 rounded-lg text-sm font-medium text-foreground-secondary hover:text-primary hover:bg-primary/10 transition-all">
                      Messages
                    </a>
                    <a href="/my" className="px-3 py-1.5 rounded-lg text-sm font-medium text-foreground-secondary hover:text-primary hover:bg-primary/10 transition-all">
                      My Listings
                    </a>
                  </nav>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2">
                  <a href="/listings/new" className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-white bg-primary hover:bg-primary-hover transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Post</span>
                  </a>
                  <ThemeToggle />
                  <NotificationBell />
                  <div className="hidden sm:block">
                    <UserButton />
                  </div>
                  <div className="sm:hidden">
                    <a href="/login" className="rounded-lg bg-primary px-3 py-1.5 text-white text-sm font-semibold hover:bg-primary-hover transition">
                      Login
                    </a>
                  </div>
                </div>
              </div>
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
