"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { sb } from "@/lib/supabase/browser"

function AuthCallbackInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState("Finishing sign-in...")

  useEffect(() => {
    const supabase = sb()
    const code = searchParams.get("code")
    const error = searchParams.get("error")
    const errorDescription = searchParams.get("error_description")
    const next = searchParams.get("next") || "/"

    async function finish() {
      try {
        // Log the callback URL parameters for debugging
        console.log("Auth callback:", { code: !!code, error, errorDescription })

        // If there's an explicit error from Supabase AND no code, then fail
        if (error && !code) {
          console.error("Supabase auth error:", error, errorDescription)
          setStatus("Authentication failed, redirecting...")
          await new Promise(resolve => setTimeout(resolve, 1500))
          router.replace("/login")
          return
        }

        // Exchange the code in the URL for a session (sets cookies)
        if (code) {
          setStatus("Verifying your session...")
          
          // Try to exchange the code - even if it errors, the session might be set
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          
          // Check if we actually got a session, regardless of error
          const { data: { session } } = await supabase.auth.getSession()
          
          if (!session) {
            console.error("No session after exchange:", exchangeError)
            setStatus("Sign-in failed, redirecting...")
            await new Promise(resolve => setTimeout(resolve, 1500))
            router.replace("/login")
            return
          }
          
          console.log("Session established successfully")
          setStatus("Checking your profile...")
          
          // Check if this is a new user by checking their profile
          try {
            const profileRes = await fetch('/api/profile')
            if (profileRes.ok) {
              const profileData = await profileRes.json()
              // If they don't have a name set, redirect to onboarding
              if (!profileData.data?.name) {
                setStatus("Setting up your account...")
                await new Promise(resolve => setTimeout(resolve, 500))
                router.replace('/onboarding')
                return
              }
            }
          } catch (err) {
            console.error('Error checking profile:', err)
            // Continue anyway - non-critical error
          }

          setStatus("Success! Redirecting...")
          await new Promise(resolve => setTimeout(resolve, 500))
          router.replace(next)
        } else {
          // No code at all
          console.error("No auth code in callback URL")
          setStatus("Invalid sign-in link, redirecting...")
          await new Promise(resolve => setTimeout(resolve, 1500))
          router.replace("/login")
        }
      } catch (err) {
        console.error("Unexpected error:", err)
        setStatus("An error occurred, redirecting...")
        await new Promise(resolve => setTimeout(resolve, 1500))
        router.replace("/login")
      }
    }

    finish()
  }, [router, searchParams])

  return (
    <main className="grid min-h-[50vh] place-items-center p-8 text-center">
      <div>
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4"></div>
        <p className="text-foreground">{status}</p>
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
            <p className="text-foreground">Loading...</p>
          </div>
        </main>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  )
}
