import { redirect } from "next/navigation"
import { sbServer } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import ListingForm from "@/components/ListingForm"

export default async function NewListingPage() {
  const supabase = sbServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  })

  return (
    <div className="max-w-2xl">
      <h1 className="mb-4 text-2xl font-semibold">Post a listing</h1>
      <ListingForm categories={categories as { id: number; name: string }[]} />
    </div>
  )
}
