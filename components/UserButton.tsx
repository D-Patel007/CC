"use client"
import { useEffect, useState } from "react"
import { sb } from "@/lib/supabase/browser"

export default function UserButton() {
  const [user, setUser] = useState<{ email: string; name?: string } | null>(null)
  
  useEffect(() => {
    sb().auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser({
          email: data.user.email || "",
          name: data.user.user_metadata?.name || data.user.email?.split("@")[0]
        })
      }
    })
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
