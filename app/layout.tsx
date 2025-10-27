// app/layout.tsx
import "./globals.css";
import Link from "next/link";
import UserMenu from "../components/UserMenu";

export const metadata = { title: "Campus Connect" };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="min-h-screen bg-[#f9fafb] text-gray-900"
        suppressHydrationWarning
      >
        {/* Header */}
        <header className="w-full border-b bg-white shadow-sm">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            {/* Logo + title */}
            <Link href="/" className="flex items-center gap-3 group">
              <img
                src="/Campus_Connect_Logo.jpg"
                alt="Campus Connect"
                className="h-[55px] w-[55px] rounded-full border border-gray-300 
                           group-hover:scale-105 transition-transform duration-150 object-cover"
              />
              <span className="text-xl font-semibold tracking-wide group-hover:text-blue-600 transition-colors duration-150">
                Campus Connect
              </span>
            </Link>

            {/* Nav + User section split: links left, user block far right */}
            <nav className="flex-1 ml-8">
              <div className="flex items-center text-sm font-medium">
                {/* Left: main links */}
                <div className="flex items-center gap-6">
                  <Link href="/" className="hover:text-blue-600">
                    Marketplace
                  </Link>
                  <Link href="/listings/new" className="hover:text-blue-600">
                    Post
                  </Link>
                </div>

                {/* Right: greeting + profile/signin/signout */}
                <div className="ml-auto">
                  <UserMenu />
                </div>
              </div>
            </nav>
          </div>
        </header>

        {/* Page content */}
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>

        <div className="h-2" />
      </body>
    </html>
  );
}
