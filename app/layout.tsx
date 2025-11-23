import "./globals.css"
import UserButton from "@/components/UserButton"
import Footer from "@/components/Footer"
import ThemeToggle from "@/components/ThemeToggle"
import NotificationBell from "@/components/NotificationBell"
import AdminNavLink from "@/components/AdminNavLink"
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
          <header className="sticky top-0 z-50 bg-[var(--background-elevated)] shadow-sm">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                {/* Logo and Brand */}
                <div className="flex items-center gap-3">
                  <a href="/" className="flex items-center gap-2">
                    <img src="/logo.png" alt="Campus Connect" className="w-10 h-10" />
                    <span className="font-bold text-xl text-primary hidden sm:block">Campus Connect</span>
                  </a>
                </div>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-8">
                  <a href="/" className="text-foreground hover:text-primary transition-colors font-medium">Home</a>
                  <a href="/marketplace" className="text-foreground hover:text-primary transition-colors font-medium">Marketplace</a>
                  <a href="/events" className="text-foreground hover:text-primary transition-colors font-medium">Events</a>
                  <a href="/messages" className="text-foreground hover:text-primary transition-colors font-medium">Messages</a>
                  <a href="/profile" className="text-foreground hover:text-primary transition-colors font-medium">Profile</a>
                  <AdminNavLink />
                </nav>

                {/* Right Side Actions */}
                <div className="flex items-center gap-3">
                  <a
                    href="/listings/new"
                    className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-hover transition-colors shadow-sm hidden sm:block"
                  >
                    Post Listing
                  </a>
                  <ThemeToggle />
                  <NotificationBell />
                  <UserButton />
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
