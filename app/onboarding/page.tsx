"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function OnboardingPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    affiliation: "Undergraduate",
    graduationYear: "",
    contactMethod: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // Check if user already has a profile
    async function checkProfile() {
      try {
        const res = await fetch('/api/profile')
        if (res.ok) {
          const data = await res.json()
          // If they already have a name set, redirect to home
          if (data.data?.name) {
            console.log('Profile found, redirecting...')
            router.push('/')
            return
          }
        }
      } catch (err) {
        console.error('Error checking profile:', err)
      } finally {
        setChecking(false)
      }
    }
    
    // Temporarily disabled to allow profile creation
    // checkProfile()
    setChecking(false)
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    // Validation
    if (!formData.name.trim()) {
      setError("Please enter your name")
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          affiliation: formData.affiliation,
          graduationYear: formData.graduationYear.trim() || null,
          contactMethod: formData.contactMethod.trim() || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update profile')
      }

      // Success! Redirect to home
      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-border border-t-primary mb-4"></div>
          <p className="text-foreground-secondary">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="flex items-center justify-center min-h-[60vh] py-12">
      <div className="bg-[var(--card-bg)] rounded-xl border border-border shadow-subtle p-8 w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="text-5xl mb-4">🎓</div>
          <h1 className="text-3xl font-bold mb-2 text-foreground">Complete Your Profile</h1>
          <p className="text-foreground-secondary">
            Help the Campus Connect community get to know you better.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
              className="w-full rounded-lg border border-border bg-[var(--input-bg)] px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary"
            />
          </div>

          {/* Affiliation */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Affiliation <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.affiliation}
              onChange={(e) => setFormData({ ...formData, affiliation: e.target.value })}
              className="w-full rounded-lg border border-border bg-[var(--input-bg)] px-4 py-3 text-foreground focus:border-primary"
            >
              <option value="Undergraduate">Undergraduate</option>
              <option value="Graduate">Graduate</option>
              <option value="Staff">Staff</option>
              <option value="Faculty">Faculty</option>
            </select>
          </div>

          {/* Graduation Year / Department */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Graduation Year or Department
            </label>
            <input
              type="text"
              value={formData.graduationYear}
              onChange={(e) => setFormData({ ...formData, graduationYear: e.target.value })}
              placeholder="e.g., 2025 or Computer Science"
              className="w-full rounded-lg border border-border bg-[var(--input-bg)] px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary"
            />
            <p className="text-xs text-foreground-secondary mt-1">
              Optional - helps others connect with you
            </p>
          </div>

          {/* Contact Method */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Preferred Contact Method
            </label>
            <input
              type="text"
              value={formData.contactMethod}
              onChange={(e) => setFormData({ ...formData, contactMethod: e.target.value })}
              placeholder="e.g., Discord, Instagram, Phone"
              className="w-full rounded-lg border border-border bg-[var(--input-bg)] px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary"
            />
            <p className="text-xs text-foreground-secondary mt-1">
              Optional - shown on your listings
            </p>
          </div>

          {error && (
            <div className="bg-[rgba(248,113,113,0.12)] text-error text-sm rounded-lg p-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary py-3 text-white font-medium shadow-subtle hover:bg-primary-hover transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Saving..." : "Complete Profile"}
          </button>
        </form>

        <p className="text-center text-xs text-foreground-secondary">
          You can update these details later in your profile settings.
        </p>
      </div>
    </main>
  )
}
