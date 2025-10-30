import { NextRequest, NextResponse } from "next/server"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const { profile } = await getCurrentUser()
    if (!profile) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    const formData = await req.formData()
    const sellerId = parseInt(formData.get('sellerId') as string)
    
    if (isNaN(sellerId)) {
      return NextResponse.json({ error: "Invalid seller ID" }, { status: 400 })
    }

    // Don't allow messaging yourself
    if (sellerId === profile.id) {
      return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 })
    }

    // Check if conversation already exists between these two users
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { user1Id: profile.id, user2Id: sellerId },
          { user1Id: sellerId, user2Id: profile.id }
        ]
      }
    })

    if (existingConversation) {
      // Redirect to messages page with existing conversation
      return NextResponse.redirect(new URL(`/messages?conversation=${existingConversation.id}`, req.url))
    }

    // Create new conversation
    const conversation = await prisma.conversation.create({
      data: {
        user1Id: profile.id,
        user2Id: sellerId
      }
    })

    // Redirect to messages page with new conversation
    return NextResponse.redirect(new URL(`/messages?conversation=${conversation.id}`, req.url))

  } catch (err: any) {
    console.error("POST /api/conversations/create error:", err)
    return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 })
  }
}
