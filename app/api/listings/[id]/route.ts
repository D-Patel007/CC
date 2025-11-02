import { NextRequest, NextResponse } from "next/server"
import { sbServer } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await sbServer()

    const { data: listing, error } = await supabase
      .from('Listing')
      .select(`
        *,
        category:Category(*),
        seller:Profile!Listing_sellerId_fkey(*)
      `)
      .eq('id', parseInt(id))
      .single()

    if (error || !listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: listing })
  } catch (error) {
    console.error('Error fetching listing:', error)
    return NextResponse.json(
      { error: 'Failed to fetch listing' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const currentUser = await getCurrentUser()

    if (!currentUser.profile) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const supabase = await sbServer()

    // Verify ownership
    const { data: listing } = await supabase
      .from('Listing')
      .select('sellerId')
      .eq('id', parseInt(id))
      .single()

    if (!listing || listing.sellerId !== currentUser.profile.id) {
      return NextResponse.json(
        { error: 'Not authorized to update this listing' },
        { status: 403 }
      )
    }

    // Update listing
    const { data: updatedListing, error } = await supabase
      .from('Listing')
      .update({
        isSold: body.isSold,
        updatedAt: new Date().toISOString()
      })
      .eq('id', parseInt(id))
      .select(`
        *,
        category:Category(*),
        seller:Profile!Listing_sellerId_fkey(*)
      `)
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update listing' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: updatedListing })
  } catch (error) {
    console.error('Error updating listing:', error)
    return NextResponse.json(
      { error: 'Failed to update listing' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const currentUser = await getCurrentUser()

    if (!currentUser.profile) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = await sbServer()

    // Verify ownership
    const { data: listing } = await supabase
      .from('Listing')
      .select('sellerId')
      .eq('id', parseInt(id))
      .single()

    if (!listing || listing.sellerId !== currentUser.profile.id) {
      return NextResponse.json(
        { error: 'Not authorized to delete this listing' },
        { status: 403 }
      )
    }

    // Delete listing
    const { error } = await supabase
      .from('Listing')
      .delete()
      .eq('id', parseInt(id))

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete listing' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting listing:', error)
    return NextResponse.json(
      { error: 'Failed to delete listing' },
      { status: 500 }
    )
  }
}
