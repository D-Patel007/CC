"use client"
import { useState, useEffect, useRef } from "react"
import { useRealtimeMessages } from "@/lib/hooks/useRealtimeMessages"

type Conversation = {
  id: number
  otherUser: {
    id: number
    name: string | null
    avatarUrl: string | null
  }
  lastMessage?: {
    content: string
    createdAt: string
    senderId: number
  }
  unreadCount: number
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const { messages, loading: messagesLoading } = useRealtimeMessages(selectedConversationId)

  // Fetch conversations
  useEffect(() => {
    fetch("/api/messages")
      .then(res => res.json())
      .then(data => {
        if (data.data) {
          setConversations(data.data)
        }
      })
      .catch(console.error)
  }, [])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const selectedConversation = conversations.find(c => c.id === selectedConversationId)

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedConversationId || !newMessage.trim() || sending) return

    setSending(true)
    try {
      await fetch(`/api/messages/${selectedConversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage })
      })
      setNewMessage("")
    } catch (err) {
      console.error("Failed to send message:", err)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl h-[calc(100vh-120px)]">
      <div className="grid grid-cols-3 gap-4 h-full">
        {/* Conversations List */}
        <div className="col-span-1 bg-white rounded-xl border overflow-y-auto">
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold">Messages</h2>
          </div>
          
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No conversations yet</p>
              <p className="text-sm mt-2">Start chatting by viewing a listing</p>
            </div>
          ) : (
            <div className="divide-y">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversationId(conv.id)}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition ${
                    selectedConversationId === conv.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold flex-shrink-0">
                      {(conv.otherUser.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold truncate">{conv.otherUser.name || 'User'}</p>
                        {conv.unreadCount > 0 && (
                          <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      {conv.lastMessage && (
                        <p className="text-sm text-gray-500 truncate">
                          {conv.lastMessage.content}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Messages Thread */}
        <div className="col-span-2 bg-white rounded-xl border flex flex-col">
          {!selectedConversation ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <p className="text-lg">Select a conversation to start messaging</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="p-4 border-b flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                  {(selectedConversation.otherUser.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold">{selectedConversation.otherUser.name || 'User'}</h3>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messagesLoading ? (
                  <div className="text-center text-gray-500">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-500">No messages yet. Start the conversation!</div>
                ) : (
                  <>
                    {messages.map((msg) => {
                      const isOwn = msg.sender.id !== selectedConversation.otherUser.id
                      return (
                        <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] rounded-lg p-3 ${
                            isOwn ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
                          }`}>
                            <p className="text-sm">{msg.content}</p>
                            <p className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                              {new Date(msg.createdAt).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input */}
              <form onSubmit={sendMessage} className="p-4 border-t">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {sending ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
