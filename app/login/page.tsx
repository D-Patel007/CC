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
      <div className="bg-white rounded-xl border shadow-sm p-8 w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Log in</h1>
          <p className="text-gray-600">
            Enter your official UMass Boston email to receive a secure login link.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <input
            className="w-full rounded-lg border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your.name001@umb.edu"
          />
          <button className="w-full rounded-lg bg-blue-600 py-3 text-white font-medium hover:bg-blue-700 transition">
            Send Login Link
          </button>
        </form>

        {msg && (
          <p className="text-sm text-center text-gray-600 bg-blue-50 rounded-lg p-3">
            {msg}
          </p>
        )}

        <p className="text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <a href="/signup" className="text-blue-600 hover:underline">
            Sign Up
          </a>
        </p>
      </div>
    </main>
  )
}
