"use client"
import { useEffect, useState } from "react"
import { redirect } from "next/navigation"
import { sb } from "@/lib/supabase/browser"
import ListingCard from "@/components/ListingCard"

type Profile = {
  id: number
  name: string | null
  avatarUrl: string | null
  year: string | null
  major: string | null
  bio: string | null
  createdAt: string
}

type Listing = {
  id: number
  title: string
  description: string
  priceCents: number
  condition: string
  imageUrl: string | null
  isSold: boolean
  createdAt: string
  category: {
    id: number
    name: string
  } | null
  seller: {
    id: number
    name: string | null
  }
}

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({
    name: "",
    year: "",
    major: "",
    bio: ""
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const supabase = sb()
    
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user
      if (!user) {
        window.location.href = "/login"
      } else {
        setUser(user)
        fetchProfile()
      }
    })
  }, [])

  async function fetchProfile() {
    try {
      const res = await fetch('/api/profile')
      const data = await res.json()
      
      if (data.data) {
        setProfile(data.data)
        setEditForm({
          name: data.data.name || "",
          year: data.data.year || "",
          major: data.data.major || "",
          bio: data.data.bio || ""
        })
        
        // Fetch all user listings (including sold ones)
        const listingsRes = await fetch('/api/listings')
        const listingsData = await listingsRes.json()
        if (listingsData.data) {
          // Filter to get only the user's listings (both active and sold)
          const userListings = listingsData.data.filter((l: any) => l.seller.id === data.data.id)
          setListings(userListings)
        }
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveProfile() {
    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })
      
      const data = await res.json()
      if (data.data) {
        setProfile(data.data)
        setShowEditModal(false)
      }
    } catch (error) {
      console.error('Failed to update profile:', error)
      alert('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    )
  }

  if (!profile || !user) return null

  const email = user.email ?? "unknown@umb.edu"
  const name = profile.name || email.split("@")[0]

  return (
    <div className="mx-auto max-w-6xl p-6">
      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Edit Profile</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Year</label>
                <select
                  value={editForm.year}
                  onChange={(e) => setEditForm({ ...editForm, year: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">Select year</option>
                  <option value="Freshman">Freshman</option>
                  <option value="Sophomore">Sophomore</option>
                  <option value="Junior">Junior</option>
                  <option value="Senior">Senior</option>
                  <option value="Graduate">Graduate</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Major</label>
                <input
                  type="text"
                  value={editForm.major}
                  onChange={(e) => setEditForm({ ...editForm, major: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Your major"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Bio</label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Tell us about yourself"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 py-2 border border-border rounded-lg hover:bg-[var(--background-elevated)]"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="flex-1 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-[var(--card-bg)] rounded-xl border border-border p-6 space-y-4">
            {/* Avatar */}
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-3xl font-bold text-primary">
                {name.charAt(0).toUpperCase()}
              </div>
              <h2 className="mt-3 text-xl font-semibold">{name}</h2>
              <p className="text-sm text-foreground-secondary">@{email.split("@")[0]}</p>
            </div>

            {/* Stats */}
            <div className="flex justify-center gap-8 py-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{listings.length}</div>
                <div className="text-sm text-foreground-secondary">Listings</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{listings.filter(l => l.isSold).length}</div>
                <div className="text-sm text-foreground-secondary">Sold</div>
              </div>
            </div>

            {/* Buttons */}
            <div className="space-y-2">
              <button
                onClick={() => setShowEditModal(true)}
                className="w-full py-2 border border-border rounded-lg hover:bg-[var(--background-elevated)]"
              >
                Edit Profile
              </button>
              <form action="/auth/signout" method="post">
                <button className="w-full py-2 bg-primary text-white rounded-lg hover:bg-primary-hover">
                  Logout
                </button>
              </form>
            </div>

            {/* Additional Info */}
            <div className="pt-4 border-t border-border space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-foreground-secondary">Year</span>
                <span className="font-medium">{profile.year || "Not set"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-secondary">Major</span>
                <span className="font-medium">{profile.major || "Not set"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-secondary">Member Since</span>
                <span className="font-medium">
                  {new Date(profile.createdAt).getFullYear()}
                </span>
              </div>
              {profile.bio && (
                <div className="pt-2">
                  <span className="text-foreground-secondary block mb-1">Bio</span>
                  <p className="text-sm">{profile.bio}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* My Listings */}
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold mb-4">My Listings</h2>
          {listings.length === 0 ? (
            <div className="text-center py-12 text-foreground-secondary bg-[var(--card-bg)] rounded-xl border border-border">
              <p>You haven't created any listings yet.</p>
              <a href="/listings/new" className="inline-block mt-4 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition">
                Create Your First Listing
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
