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
    const next = searchParams.get("next") || "/"

    async function finish() {
      try {
        // If Supabase sent an error, bounce back to /login
        if (error) {
          console.error("Supabase auth error:", error, searchParams.get("error_description"))
          setStatus("Authentication failed, redirecting...")
          await new Promise(resolve => setTimeout(resolve, 1500))
          router.replace("/login")
          return
        }

        // Exchange the code in the URL for a session (sets cookies)
        if (code) {
          setStatus("Verifying your session...")
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          
          if (exchangeError) {
            console.error("Error exchanging code:", exchangeError)
            setStatus("Sign-in failed, redirecting...")
            await new Promise(resolve => setTimeout(resolve, 1500))
            router.replace("/login")
            return
          }
          
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
        }

        setStatus("Success! Redirecting...")
        await new Promise(resolve => setTimeout(resolve, 500))
        router.replace(next)
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
