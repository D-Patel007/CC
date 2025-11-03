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
          {/* Header (always visible) */}
          <header className="sticky top-0 z-50 border-b-2 border-border bg-[var(--background-elevated)]/95 backdrop-blur-lg shadow-subtle">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4 text-foreground">
              <div className="flex items-center gap-6">
                <a href="/" className="flex items-center gap-3 group">
                  <div className="relative">
                    <img src="/logo.png" alt="Campus Connect" className="w-12 h-12 rounded-modern shadow-lg transition-all group-hover:scale-110 group-hover:shadow-xl" />
                    <div className="absolute -inset-1 bg-primary/20 rounded-modern blur-sm opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
                  </div>
                  <div className="font-semibold hidden sm:block">
                    <div className="text-foreground font-bold text-xl">Campus Connect</div>
                    <div className="text-xs text-primary font-medium">For Beacons, by Beacons 🎓</div>
                  </div>
                </a>
                <nav className="hidden lg:flex items-center gap-1 ml-4">
                  <a href="/" className="px-4 py-2 rounded-modern text-sm font-medium text-foreground-secondary hover:text-primary hover:bg-primary/10 transition-all">
                    Marketplace
                  </a>
                  <a href="/events" className="px-4 py-2 rounded-modern text-sm font-medium text-foreground-secondary hover:text-primary hover:bg-primary/10 transition-all">
                    Events
                  </a>
                  <a href="/messages" className="px-4 py-2 rounded-modern text-sm font-medium text-foreground-secondary hover:text-primary hover:bg-primary/10 transition-all">
                    Messages
                  </a>
                  <a href="/my" className="px-4 py-2 rounded-modern text-sm font-medium text-foreground-secondary hover:text-primary hover:bg-primary/10 transition-all">
                    My Listings
                  </a>
                  <a href="/listings/new" className="px-4 py-2 rounded-modern text-sm font-bold text-white bg-primary hover:bg-primary-hover transition-all shadow-subtle">
                    + Create
                  </a>
                </nav>
              </div>

              <div className="flex items-center gap-3">
                <ThemeToggle />
                <NotificationBell />
                <div className="hidden sm:block">
                  <UserButton />
                </div>
                <div className="sm:hidden">
                  <a href="/login" className="rounded-modern bg-primary px-4 py-2 text-white text-sm font-semibold shadow-subtle hover:bg-primary-hover transition">
                    Log in
                  </a>
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
