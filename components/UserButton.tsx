"use client"
import { useEffect, useState } from "react"
import { sb } from "@/lib/supabase/browser"
import type { User } from "@supabase/supabase-js"

export default function UserButton() {
  const [user, setUser] = useState<{ email: string; name?: string } | null>(null)
  
  useEffect(() => {
    const supabase = sb()
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          email: session.user.email || "",
          name: session.user.user_metadata?.name || session.user.email?.split("@")[0]
        })
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          email: session.user.email || "",
          name: session.user.user_metadata?.name || session.user.email?.split("@")[0]
        })
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <a
          href="/login"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-subtle hover:bg-primary-hover transition"
        >
          Log in / Sign up
        </a>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-foreground-secondary">Hi, {user.name}</span>
      <button
        onClick={() => sb().auth.signOut().then(() => location.reload())}
  className="rounded-lg border border-border px-3 py-1 text-sm text-foreground-secondary hover:text-foreground hover:bg-[var(--background-secondary)] transition"
      >
        Sign out
      </button>
    </div>
  )
}
