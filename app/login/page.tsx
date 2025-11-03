"use client"
import { useState } from "react"
import { sb } from "@/lib/supabase/browser"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [token, setToken] = useState("")
  const [msg, setMsg] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<"email" | "token">("email")

  async function sendCode(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setMsg("")
    
    const supabase = sb()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { 
        shouldCreateUser: true,
      },
    })
    
    setIsLoading(false)
    
    if (error) {
      setMsg(`Error: ${error.message}`)
    } else {
      setMsg("Check your email for the 6-digit code ✨")
      setStep("token")
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setMsg("")
    
    const supabase = sb()
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    })
    
    setIsLoading(false)
    
    if (error) {
      setMsg(`Error: ${error.message}`)
    } else if (data.session) {
      // Check if user needs onboarding
      try {
        const profileRes = await fetch('/api/profile')
        if (profileRes.ok) {
          const profileData = await profileRes.json()
          if (!profileData.data?.name) {
            router.push('/onboarding')
            return
          }
        }
      } catch (err) {
        console.error('Error checking profile:', err)
      }
      
      router.push('/')
    }
  }

  return (
    <main className="flex items-center justify-center min-h-[60vh]">
      <div className="bg-[var(--card-bg)] rounded-xl border border-border shadow-subtle p-8 w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2 text-foreground">Welcome to Campus Connect</h1>
          <p className="text-foreground-secondary">
            {step === "email" 
              ? "Enter your official UMass Boston email to receive a verification code."
              : "Enter the 6-digit code sent to your email."
            }
          </p>
        </div>

        {step === "email" ? (
          <form onSubmit={sendCode} className="space-y-4">
            <input
              className="w-full rounded-lg border border-border bg-[var(--input-bg)] px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary disabled:opacity-50"
              type="email"
              required
              disabled={isLoading}
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your.name001@umb.edu"
            />
            <button 
              disabled={isLoading}
              className="w-full rounded-lg bg-primary py-3 text-white font-medium shadow-subtle hover:bg-primary-hover transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Sending..." : "Send Code"}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyCode} className="space-y-4">
            <div>
              <input
                className="w-full rounded-lg border border-border bg-[var(--input-bg)] px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary disabled:opacity-50 text-center text-2xl tracking-widest font-mono"
                type="text"
                required
                disabled={isLoading}
                value={token}
                onChange={e => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                pattern="\d{6}"
              />
              <p className="text-xs text-foreground-secondary mt-2">
                Sent to: {email}
              </p>
            </div>
            <button 
              disabled={isLoading || token.length !== 6}
              className="w-full rounded-lg bg-primary py-3 text-white font-medium shadow-subtle hover:bg-primary-hover transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Verifying..." : "Verify Code"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("email")
                setToken("")
                setMsg("")
              }}
              className="w-full text-sm text-foreground-secondary hover:text-foreground"
            >
              ← Use different email
            </button>
          </form>
        )}

        {msg && (
          <p className={`text-sm text-center rounded-lg p-3 ${
            msg.startsWith('Error') 
              ? 'text-error bg-error/10' 
              : 'text-foreground bg-primary/10'
          }`}>
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
