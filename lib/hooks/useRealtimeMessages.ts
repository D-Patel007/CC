"use client"
import { useEffect, useState } from "react"
import { sb } from "@/lib/supabase/browser"

type Message = {
  id: number
  conversationId: number
  senderId: number
  receiverId: number
  content: string
  isRead: boolean
  createdAt: string
  sender: {
    id: number
    name: string | null
    avatarUrl: string | null
  }
}

export function useRealtimeMessages(conversationId: number | null) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!conversationId) {
      setLoading(false)
      return
    }

    let isSubscribed = true

    // Fetch initial messages
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/messages/${conversationId}`)
        const data = await res.json()
        if (data.data?.messages && isSubscribed) {
          setMessages(data.data.messages)
        }
        setLoading(false)
      } catch (err) {
        console.error("Failed to fetch messages:", err)
        setLoading(false)
      }
    }

    fetchMessages()

    // Set up Supabase Realtime using Broadcast
    const supabase = sb()
    const channel = supabase.channel(`conversation-${conversationId}`)

    // Listen for new messages broadcast
    channel
      .on('broadcast', { event: 'new-message' }, (payload) => {
        console.log('New message broadcast received:', payload)
        if (payload.payload.conversationId === conversationId) {
          fetchMessages() // Refetch to get the complete message with sender info
        }
      })
      .subscribe((status) => {
        console.log('Realtime subscription status:', status)
      })

    // Poll for new messages every 3 seconds as fallback
    const pollInterval = setInterval(() => {
      fetchMessages()
    }, 3000)

    return () => {
      isSubscribed = false
      clearInterval(pollInterval)
      supabase.removeChannel(channel)
    }
  }, [conversationId])

  return { messages, loading, setMessages }
}
