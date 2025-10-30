import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

// GET /api/messages/[id] - Get all messages in a conversation
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { profile } = await getCurrentUser()
    if (!profile) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const conversationId = parseInt(params.id)
    if (isNaN(conversationId)) {
      return NextResponse.json({ error: "Invalid conversation ID" }, { status: 400 })
    }

    // Verify user is part of this conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { user1Id: profile.id },
          { user2Id: profile.id }
        ]
      },
      include: {
        user1: { select: { id: true, name: true, avatarUrl: true } },
        user2: { select: { id: true, name: true, avatarUrl: true } }
      }
    })

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    // Get all messages
    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true } }
      },
      orderBy: { createdAt: "asc" }
    })

    // Mark messages as read if they were sent to current user
    await prisma.message.updateMany({
      where: {
        conversationId,
        receiverId: profile.id,
        isRead: false
      },
      data: { isRead: true }
    })

    const otherUser = conversation.user1Id === profile.id ? conversation.user2 : conversation.user1

    return NextResponse.json({ 
      data: {
        conversation: {
          id: conversation.id,
          otherUser
        },
        messages
      }
    })
  } catch (err: any) {
    console.error("GET /api/messages/[id] error:", err)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}

// POST /api/messages/[id] - Send a message in a conversation
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { profile } = await getCurrentUser()
    if (!profile) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const conversationId = parseInt(params.id)
    if (isNaN(conversationId)) {
      return NextResponse.json({ error: "Invalid conversation ID" }, { status: 400 })
    }

    const { content } = await req.json()
    
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 })
    }

    // Verify user is part of this conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { user1Id: profile.id },
          { user2Id: profile.id }
        ]
      }
    })

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    // Determine receiver (the other user in the conversation)
    const receiverId = conversation.user1Id === profile.id 
      ? conversation.user2Id 
      : conversation.user1Id

    // Create message
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: profile.id,
        receiverId,
        content: content.trim()
      },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true } }
      }
    })

    // Update conversation updatedAt
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    })

    // Broadcast the new message to all clients listening to this conversation
    // Note: In production, you'd use Supabase Realtime or a message queue
    // For now, clients will poll for updates

    return NextResponse.json({ data: message }, { status: 201 })
  } catch (err: any) {
    console.error("POST /api/messages/[id] error:", err)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}
