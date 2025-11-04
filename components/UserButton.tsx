"use client"
import { useEffect, useState } from "react"
import { sb } from "@/lib/supabase/browser"

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
          className="rounded-lg bg-primary px-3 py-1 text-sm font-medium text-white shadow-subtle hover:bg-primary-hover transition sm:px-4 sm:py-2"
        >
          Log in / Sign up
        </a>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <span className="hidden text-sm text-foreground-secondary sm:inline">Hi, {user.name}</span>
      <button
        onClick={() => sb().auth.signOut().then(() => location.reload())}
        className="rounded-lg border border-border px-3 py-1 text-sm text-foreground-secondary hover:text-foreground hover:bg-[var(--background-secondary)] transition sm:px-4 sm:py-2"
      >
        Sign out
      </button>
    </div>
  )
}
