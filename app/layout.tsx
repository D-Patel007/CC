import "./globals.css"
import UserButton from "@/components/UserButton"
import Footer from "@/components/Footer"
import ThemeToggle from "@/components/ThemeToggle"
import NotificationBell from "@/components/NotificationBell"
import AdminNavLink from "@/components/AdminNavLink"
import ClientProviders from "@/components/ClientProviders"
import PillNavigation from "@/components/PillNavigation"

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
          {/* Pill Navigation */}
          <PillNavigation />

          {/* Utility Bar - Theme Toggle, Notifications, User */}
          <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
            <ThemeToggle />
            <NotificationBell />
            <UserButton />
          </div>

          {/* Page content - Full width, no padding */}
          <main className="flex-1 flex flex-col pt-20">
            {children}
          </main>

          {/* Footer */}
          <Footer />
        </ClientProviders>
      </body>
    </html>
  )
}
