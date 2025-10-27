// app/layout.tsx
import "./globals.css";
import Link from "next/link";

export const metadata = { title: "Campus Connect" };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-white text-gray-900" suppressHydrationWarning>
        {/* Top header with logo + links */}
        <header className="border-b">
          <div className="mx-auto flex max-w-5xl items-center justify-between p-4">
            <Link href="/" className="flex items-center gap-2">
              {/* If you don't have this file yet, add /public/logo.svg or swap for text */}
              <img src="/logo.svg" alt="" className="h-6 w-6" />
              <span className="font-semibold">Campus Connect</span>
            </Link>

            <nav className="flex items-center gap-5 text-sm">
              <Link href="/" className="hover:underline">Marketplace</Link>
              <Link href="/listings/new" className="hover:underline">Post</Link>
              <Link href="/profile" className="hover:underline">Profile</Link>
            </nav>
          </div>
        </header>

        {/* Page content */}
        {children}

        {/* Optional: space for a bottom nav if you add one */}
        <div className="h-2"></div>
      </body>
    </html>
  );
}
