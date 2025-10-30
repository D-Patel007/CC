import { redirect } from "next/navigation"
import { sbServer } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/db"

export default async function ProfilePage() {
  const { supabaseUser, profile } = await getCurrentUser()
  
  if (!supabaseUser || !profile) redirect("/login")

  const email = supabaseUser.email ?? "unknown@umb.edu"
  const name = profile.name || email.split("@")[0]
  const avatar = profile.avatarUrl || null

  // Get listings count
  const listingsCount = await prisma.listing.count({
    where: { sellerId: profile.id }
  })

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border p-6 space-y-4">
            {/* Avatar */}
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-3xl font-bold text-blue-600">
                {name.charAt(0).toUpperCase()}
              </div>
              <h2 className="mt-3 text-xl font-semibold">{name}</h2>
              <p className="text-sm text-gray-500">@{email.split("@")[0]}</p>
            </div>

            {/* Stats */}
            <div className="flex justify-center gap-8 py-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{listingsCount}</div>
                <div className="text-sm text-gray-500">Listings</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">5</div>
                <div className="text-sm text-gray-500">Saved</div>
              </div>
            </div>

            {/* Buttons */}
            <div className="space-y-2">
              <button className="w-full py-2 border rounded-lg hover:bg-gray-50">
                Edit Profile
              </button>
              <form action="/auth/signout" method="post">
                <button className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Logout
                </button>
              </form>
            </div>

            {/* Additional Info */}
            <div className="pt-4 border-t space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Year</span>
                <span className="font-medium">Junior</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Major</span>
                <span className="font-medium">Computer Science</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Member Since</span>
                <span className="font-medium">2022</span>
              </div>
            </div>
          </div>
        </div>

        {/* My Listings */}
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold mb-4">My Listings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Listings will be rendered here - placeholder for now */}
            <p className="text-gray-500 col-span-2">Your listings will appear here.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
