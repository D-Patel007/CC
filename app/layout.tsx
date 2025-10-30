import "./globals.css"
import UserButton from "@/components/UserButton"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50">
        {/* Header (always visible) */}
        <header className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-4">
              <a href="/" className="flex items-center gap-3">
                <img src="/logo.png" alt="Campus Connect" className="w-12 h-12 rounded-lg" />
                <div className="font-semibold text-lg">
                  <div>Campus Connect</div>
                  <div className="text-xs text-gray-500">For Beacons, by Beacons</div>
                </div>
              </a>
              <nav className="hidden md:flex items-center gap-4 ml-6 text-sm text-gray-700">
                <a href="/" className="hover:underline">Marketplace</a>
                <a href="/events" className="hover:underline">Events</a>
                <a href="/messages" className="hover:underline">Messages</a>
                <div className="relative group">
                  <button className="hover:underline">Post</button>
                  {/* Potential dropdown - left as placeholder */}
                </div>
                <a href="/profile" className="hover:underline">Profile</a>
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:block">
                <UserButton />
              </div>
              <div className="sm:hidden">
                <a href="/login" className="rounded-full bg-blue-600 px-3 py-1 text-white text-sm">Log in</a>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      </body>
    </html>
  )
}
