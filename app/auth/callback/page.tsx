"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { sb } from "@/lib/supabase/browser"

function AuthCallbackInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string>("Finishing sign-in...")

  useEffect(() => {
    const supabase = sb()
    const code = searchParams.get("code")
    const authError = searchParams.get("error")
    const next = searchParams.get("next") || "/"

    async function finish() {
      try {
        // If Supabase sent an error, bounce back to /login
        if (authError) {
          console.error("Supabase auth error:", authError, searchParams.get("error_description"))
          setError(`Authentication error: ${authError}`)
          setTimeout(() => router.replace("/login"), 2000)
          return
        }

        // Exchange the code in the URL for a session (sets cookies)
        if (code) {
          setStatus("Exchanging code for session...")
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          
          if (exchangeError) {
            console.error("Error exchanging code:", exchangeError)
            setError(`Failed to complete sign-in: ${exchangeError.message}`)
            setTimeout(() => router.replace("/login"), 2000)
            return
          }

          if (!data.session) {
            console.error("No session returned after code exchange")
            setError("Failed to establish session. Please try again.")
            setTimeout(() => router.replace("/login"), 2000)
            return
          }

          setStatus("Checking profile...")
          
          // Check if this is a new user by checking their profile
          try {
            const profileRes = await fetch('/api/profile')
            if (profileRes.ok) {
              const profileData = await profileRes.json()
              // If they don't have a name set, redirect to onboarding
              if (!profileData.data?.name) {
                setStatus("Redirecting to onboarding...")
                router.replace('/onboarding')
                return
              }
            }
          } catch (err) {
            console.error('Error checking profile:', err)
            // Continue anyway - they might just need to set up their profile later
          }

          setStatus("Success! Redirecting...")
          router.replace(next)
        } else {
          // No code and no error? Something is wrong
          setError("No authentication code received")
          setTimeout(() => router.replace("/login"), 2000)
        }
      } catch (err) {
        console.error("Unexpected error in auth callback:", err)
        setError("An unexpected error occurred. Please try signing in again.")
        setTimeout(() => router.replace("/login"), 2000)
      }
    }

    finish()
  }, [router, searchParams])

  if (error) {
    return (
      <main className="grid min-h-[50vh] place-items-center p-8 text-center">
        <div>
          <div className="text-6xl mb-4">❌</div>
          <p className="text-error font-semibold mb-2">{error}</p>
          <p className="text-sm text-foreground-secondary">Redirecting to login page...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="grid min-h-[50vh] place-items-center p-8 text-center">
      <div>
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4"></div>
        <p className="text-foreground font-medium">{status}</p>
      </div>
    </main>
  )
}

export default function AuthCallback() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-[50vh] place-items-center p-8 text-center">
          <div>
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4"></div>
            <p className="text-foreground font-medium">Loading...</p>
          </div>
        </main>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  )
}
