"use client"

import { Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { sb } from "@/lib/supabase/browser"

function AuthCallbackInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const supabase = sb()
    const code = searchParams.get("code")
    const error = searchParams.get("error")
    const next = searchParams.get("next") || "/"

    async function finish() {
      // If Supabase sent an error, bounce back to /login
      if (error) {
        console.error("Supabase auth error:", error, searchParams.get("error_description"))
        router.replace("/login")
        return
      }

      // Exchange the code in the URL for a session (sets cookies)
      if (code) {
        await supabase.auth.exchangeCodeForSession(code)
        
        // Check if this is a new user by checking their profile
        try {
          const profileRes = await fetch('/api/profile')
          if (profileRes.ok) {
            const profileData = await profileRes.json()
            // If they don't have a name set, redirect to onboarding
            if (!profileData.data?.name) {
              router.replace('/onboarding')
              return
            }
          }
        } catch (err) {
          console.error('Error checking profile:', err)
        }
      }

      router.replace(next)
    }

    finish()
  }, [router, searchParams])

  return (
    <main className="grid min-h-[50vh] place-items-center p-8">
      <p>Finishing sign-in…</p>
    </main>
  )
}

export default function AuthCallback() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-[50vh] place-items-center p-8">
          <p>Finishing sign-in…</p>
        </main>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  )
}
