// lib/supabase/server.ts
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

export const sbServer = async () => {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // called by supabase-js to read a cookie
        get(name: string) {
          return cookieStore.get(name)?.value
        },

        // called by supabase-js to set/update a cookie
        // (works in Route Handlers; in Server Components it's a no-op)
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // ignore in places where Next.js forbids mutating cookies
          }
        },

        // called by supabase-js to delete a cookie
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: "", ...options, maxAge: 0 })
          } catch {
            // ignore in Server Components
          }
        },
      },
    }
  )
}
