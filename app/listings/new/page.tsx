import { redirect } from "next/navigation"
import { sbServer } from "@/lib/supabase/server"
import ListingForm from "@/components/ListingForm"

export default async function NewListingPage() {
  const supabase = await sbServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: categories } = await supabase
    .from('Category')
    .select('id, name')
    .order('name', { ascending: true })

  return (
    <div className="max-w-2xl">
      <h1 className="mb-4 text-2xl font-semibold">Post a listing</h1>
      <ListingForm categories={categories || []} />
    </div>
  )
}
