import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

// GET /api/messages - Fetch all conversations for current user
export async function GET() {
  try {
    const { profile } = await getCurrentUser()
    if (!profile) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Get all conversations where user is either user1 or user2
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { user1Id: profile.id },
          { user2Id: profile.id }
        ]
      },
      include: {
        user1: { select: { id: true, name: true, avatarUrl: true } },
        user2: { select: { id: true, name: true, avatarUrl: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            content: true,
            createdAt: true,
            isRead: true,
            senderId: true
          }
        }
      },
      orderBy: { updatedAt: "desc" }
    })

    // Transform conversations to show the "other" user and unread count
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conv) => {
        const otherUser = conv.user1Id === profile.id ? conv.user2 : conv.user1
        const lastMessage = conv.messages[0]
        
        // Count unread messages for current user
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            receiverId: profile.id,
            isRead: false
          }
        })

        return {
          id: conv.id,
          otherUser,
          lastMessage,
          unreadCount,
          updatedAt: conv.updatedAt
        }
      })
    )

    return NextResponse.json({ data: conversationsWithDetails })
  } catch (err: any) {
    console.error("GET /api/messages error:", err)
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 })
  }
}

// POST /api/messages - Create a new conversation or get existing one
export async function POST(req: Request) {
  try {
    const { profile } = await getCurrentUser()
    if (!profile) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { otherUserId } = await req.json()
    
    if (!otherUserId || otherUserId === profile.id) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }

    // Check if conversation already exists (either direction)
    let conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { user1Id: profile.id, user2Id: otherUserId },
          { user1Id: otherUserId, user2Id: profile.id }
        ]
      }
    })

    // If not, create new conversation
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          user1Id: Math.min(profile.id, otherUserId),
          user2Id: Math.max(profile.id, otherUserId)
        }
      })
    }

    return NextResponse.json({ data: conversation })
  } catch (err: any) {
    console.error("POST /api/messages error:", err)
    return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 })
  }
}
