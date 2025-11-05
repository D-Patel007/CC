import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-middleware"
import { sbServer } from "@/lib/supabase/server"
import { rateLimit, RateLimits, getRateLimitIdentifier } from "@/lib/rate-limit"

export async function POST(req: NextRequest) {
  try {
    // Authentication
    const authResult = await requireAuth(req)
    if (authResult instanceof NextResponse) return authResult
    const { user } = authResult

    // Rate limiting
    const rateLimitIdentifier = getRateLimitIdentifier(req, "conversations:create", user.id)
    const rateLimitResponse = rateLimit(rateLimitIdentifier, RateLimits.MODERATE)
    if (rateLimitResponse) return rateLimitResponse

    const formData = await req.formData()
    const sellerIdStr = formData.get('sellerId') as string
    const sellerId = parseInt(sellerIdStr)
    
    if (isNaN(sellerId)) {
      return NextResponse.json({ error: "Invalid seller ID" }, { status: 400 })
    }

    // Don't allow messaging yourself
    if (sellerId === user.id) {
      return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 })
    }

    const supabase = await sbServer()
    
    // Verify seller exists
    const { data: sellerProfile, error: sellerError } = await supabase
      .from('Profile')
      .select('id')
      .eq('id', sellerId)
      .single()
    
    if (sellerError || !sellerProfile) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 })
    }

    // Check if conversation already exists between these two users
    const { data: existingConversations, error: findError } = await supabase
      .from('Conversation')
      .select('*')
      .or(`and(user1Id.eq.${user.id},user2Id.eq.${sellerId}),and(user1Id.eq.${sellerId},user2Id.eq.${user.id})`)
      .limit(1)

    if (findError) {
      console.error("Find conversation error:", findError)
      return NextResponse.json({ error: "Failed to find conversation" }, { status: 500 })
    }

    const existingConversation = existingConversations?.[0]

    if (existingConversation) {
      // Return JSON with redirect URL for client-side redirect
      return NextResponse.json(
        { redirect: `/messages?conversation=${existingConversation.id}` },
        { status: 200 }
      )
    }

    // Create new conversation with required timestamps
    const now = new Date().toISOString()
    const { data: conversation, error: createError } = await supabase
      .from('Conversation')
      .insert({
        user1Id: user.id,
        user2Id: sellerId,
        createdAt: now,
        updatedAt: now
      })
      .select()
      .single()

    if (createError || !conversation) {
      console.error("Create conversation error:", createError)
      return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 })
    }

    // Return JSON with redirect URL for client-side redirect
    return NextResponse.json(
      { redirect: `/messages?conversation=${conversation.id}` },
      { status: 200 }
    )

  } catch (err: any) {
    console.error("POST /api/conversations/create error:", err)
    return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 })
  }
}
