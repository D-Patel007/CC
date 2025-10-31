"use client"
import { useState } from "react"
import { sb } from "@/lib/supabase/browser"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [msg, setMsg] = useState("")

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const supabase = sb()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    setMsg(error ? error.message : "Check your email for the login link ✨")
  }

  return (
    <main className="flex items-center justify-center min-h-[60vh]">
      <div className="bg-[var(--card-bg)] rounded-xl border border-border shadow-subtle p-8 w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2 text-foreground">Welcome to Campus Connect</h1>
          <p className="text-foreground-secondary">
            Enter your official UMass Boston email to log in or create an account. We'll send you a secure magic link.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <input
            className="w-full rounded-lg border border-border bg-[var(--input-bg)] px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary"
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your.name001@umb.edu"
          />
          <button className="w-full rounded-lg bg-primary py-3 text-white font-medium shadow-subtle hover:bg-primary-hover transition">
            Send Magic Link
          </button>
        </form>

        {msg && (
          <p className="text-sm text-center text-foreground bg-[rgba(129,140,248,0.12)] rounded-lg p-3">
            {msg}
          </p>
        )}

        <p className="text-center text-sm text-foreground-secondary">
          New users will be prompted to complete their profile after verification.
        </p>
      </div>
    </main>
  )
}
