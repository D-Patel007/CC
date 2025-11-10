"use client"
import { useEffect, useState } from "react"
import { redirect } from "next/navigation"
import { sb } from "@/lib/supabase/browser"
import ListingCard from "@/components/ListingCard"
import VerifiedBadge from "@/components/VerifiedBadge"
import type { Database } from "@/lib/supabase/databaseTypes"

type Profile = {
  id: number
  name: string | null
  avatarUrl: string | null
  phone: string | null
  phoneVerified: boolean
  campusArea: string | null
  bio: string | null
  createdAt: string
  averageRating: number
  totalRatings: number
  totalTransactions: number
}
type ListingRow = Database['public']['Tables']['Listing']['Row']
type CategoryRow = Database['public']['Tables']['Category']['Row']
type ListingWithRelations = ListingRow & {
  category?: CategoryRow | null
  seller?: {
    id: number
    name: string | null
  }
}

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [listings, setListings] = useState<ListingWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    campusArea: "",
    bio: ""
  })
  const [saving, setSaving] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

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
          phone: data.data.phone || "",
          campusArea: data.data.campusArea || "",
          bio: data.data.bio || ""
        })
        setAvatarPreview(data.data.avatarUrl)
        
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
      let avatarUrl = profile?.avatarUrl

      // Upload avatar if a new file was selected
      if (avatarFile) {
        setUploadingAvatar(true)
        const uploadFormData = new FormData()
        uploadFormData.append('file', avatarFile)
        uploadFormData.append('type', 'photo') // Changed from 'avatar' to 'photo'

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData
        })

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json()
          if (uploadData.data?.url) {
            avatarUrl = uploadData.data.url
          }
        } else {
          alert('Failed to upload avatar')
          setUploadingAvatar(false)
          setSaving(false)
          return
        }
        setUploadingAvatar(false)
      }

      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          avatarUrl
        })
      })
      
      const data = await res.json()
      if (data.data) {
        setProfile(data.data)
        setAvatarPreview(data.data.avatarUrl)
        setAvatarFile(null)
        setShowEditModal(false)
      }
    } catch (error) {
      console.error('Failed to update profile:', error)
      alert('Failed to update profile')
    } finally {
      setSaving(false)
      setUploadingAvatar(false)
    }
  }

  function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB')
      return
    }

    setAvatarFile(file)
    const previewUrl = URL.createObjectURL(file)
    setAvatarPreview(previewUrl)
  }

  function removeAvatar() {
    setAvatarFile(null)
    setAvatarPreview(profile?.avatarUrl || null)
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[var(--card-bg)] rounded-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Edit Profile</h3>
            <div className="space-y-4">
              {/* Avatar Upload */}
              <div>
                <label className="block text-sm font-medium mb-2">Profile Picture</label>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {avatarPreview ? (
                      <img 
                        src={avatarPreview} 
                        alt="Avatar preview"
                        className="w-20 h-20 rounded-full object-cover border-2 border-primary"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
                        {name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarSelect}
                        className="hidden"
                      />
                      <span className="inline-block px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-hover transition">
                        {avatarPreview ? 'Change Photo' : 'Upload Photo'}
                      </span>
                    </label>
                    {avatarFile && (
                      <button
                        type="button"
                        onClick={removeAvatar}
                        className="text-sm text-error hover:text-error-dark hover:underline transition"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-foreground-secondary mt-2">
                  Recommended: Square image, max 5MB
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2 bg-[var(--input-bg)] text-foreground"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone Number (Optional)</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2 bg-[var(--input-bg)] text-foreground"
                  placeholder="(123) 456-7890"
                />
                <p className="text-xs text-foreground-secondary mt-1">
                  For easier meetup coordination
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Campus Area</label>
                <select
                  value={editForm.campusArea}
                  onChange={(e) => setEditForm({ ...editForm, campusArea: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2 bg-[var(--input-bg)] text-foreground"
                >
                  <option value="">Select area</option>
                  <option value="North Campus">North Campus</option>
                  <option value="South Campus">South Campus</option>
                  <option value="Harbor Campus">Harbor Campus</option>
                  <option value="Off-Campus">Off-Campus</option>
                  <option value="Dorchester">Dorchester</option>
                  <option value="Other">Other</option>
                </select>
                <p className="text-xs text-foreground-secondary mt-1">
                  Where you usually meet for pickup/dropoff
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Bio</label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2 bg-[var(--input-bg)] text-foreground"
                  placeholder="Tell us about yourself"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 py-2 border border-border rounded-lg hover:bg-[var(--background-elevated)] hover:border-primary transition-all"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="flex-1 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50"
                disabled={saving || uploadingAvatar}
              >
                {uploadingAvatar ? 'Uploading...' : saving ? 'Saving...' : 'Save'}
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
              {profile.avatarUrl ? (
                <img 
                  src={profile.avatarUrl} 
                  alt={name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-primary"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-3xl font-bold text-primary">
                  {name.charAt(0).toUpperCase()}
                </div>
              )}
              <h2 className="mt-3 text-xl font-semibold">{name}</h2>
              <p className="text-sm text-foreground-secondary">@{email.split("@")[0]}</p>
              
              {/* Verification Badges */}
              <div className="flex gap-2 mt-2">
                <VerifiedBadge type="email" size="sm" />
                {profile.phoneVerified && <VerifiedBadge type="phone" size="sm" />}
              </div>
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
              <div className="text-center">
                <div className="text-2xl font-bold">{profile.totalTransactions || 0}</div>
                <div className="text-sm text-foreground-secondary">Deals</div>
              </div>
            </div>

            {/* Rating Display */}
            {profile.totalRatings > 0 && (
              <div className="py-3 border-t border-b border-border">
                <div className="flex items-center justify-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} className={star <= Math.round(profile.averageRating) ? 'text-yellow-400' : 'text-gray-400'}>
                        ⭐
                      </span>
                    ))}
                  </div>
                  <span className="font-bold">{profile.averageRating.toFixed(1)}</span>
                  <span className="text-sm text-foreground-secondary">({profile.totalRatings} {profile.totalRatings === 1 ? 'rating' : 'ratings'})</span>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="space-y-2">
              <button
                onClick={() => setShowEditModal(true)}
                className="w-full py-2 border border-border rounded-lg hover:bg-[var(--background-elevated)] hover:border-primary transition-all"
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
              {profile.phone && (
                <div className="flex justify-between items-center">
                  <span className="text-foreground-secondary">Phone</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{profile.phone}</span>
                    {profile.phoneVerified && (
                      <span className="text-xs text-success">✓</span>
                    )}
                  </div>
                </div>
              )}
              {!profile.phoneVerified && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                  <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">
                    📱 Verify your phone number to build trust with other users
                  </p>
                  <a 
                    href="/verify-phone"
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Verify Phone Number →
                  </a>
                </div>
              )}
              {profile.campusArea && (
                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Campus Area</span>
                  <span className="font-medium">{profile.campusArea}</span>
                </div>
              )}
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
