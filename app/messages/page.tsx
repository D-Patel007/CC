"use client"
import { Suspense, useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { useRealtimeMessages } from "@/lib/hooks/useRealtimeMessages"
import { validateAudioFile, validateFileSize, validateImageFile } from "@/lib/validation"

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

function MessagesPageInner() {
  const searchParams = useSearchParams()
  const conversationParam = searchParams.get('conversation')
  
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [hoveredMessageId, setHoveredMessageId] = useState<number | null>(null)
  
  const { messages, loading: messagesLoading } = useRealtimeMessages(selectedConversationId)

  const MAX_IMAGE_MB = 8
  const MAX_AUDIO_MB = 12

  // Fetch conversations
  useEffect(() => {
    fetch("/api/messages")
      .then(res => res.json())
      .then(data => {
        if (data.data) {
          setConversations(data.data)
          
          // Auto-select conversation from URL parameter
          if (conversationParam) {
            const convId = parseInt(conversationParam)
            if (!isNaN(convId) && data.data.some((c: Conversation) => c.id === convId)) {
              setSelectedConversationId(convId)
            }
          }
        }
      })
      .catch(console.error)
  }, [conversationParam])

  // Auto-scroll to bottom only when user is near bottom or sending
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [isNearBottom, setIsNearBottom] = useState(true)
  const previousMessagesLengthRef = useRef(0)
  const lastMessageIdRef = useRef<number | null>(null)

  useEffect(() => {
    // Only auto-scroll if:
    // 1. User is near bottom
    // 2. There's a genuinely NEW message (different last message ID)
    const lastMessage = messages[messages.length - 1]
    const hasNewMessage = lastMessage && lastMessage.id !== lastMessageIdRef.current
    
    if (isNearBottom && hasNewMessage && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
    
    // Update refs
    if (lastMessage) {
      lastMessageIdRef.current = lastMessage.id
    }
    previousMessagesLengthRef.current = messages.length
  }, [messages, isNearBottom])

  // Track scroll position to determine if user is reading history
  const handleScroll = () => {
    if (!messagesContainerRef.current) return
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight
    
    // If user is within 100px of bottom, enable auto-scroll
    setIsNearBottom(distanceFromBottom < 100)
  }

  const selectedConversation = conversations.find(c => c.id === selectedConversationId)

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedConversationId || !newMessage.trim() || sending) return

    setSending(true)
    // Force scroll to bottom when sending a message
    setIsNearBottom(true)
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

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !selectedConversationId) return

    // Create preview URL
    if (!validateImageFile(file)) {
      alert('Please choose a JPG, PNG, GIF, or WEBP image.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    if (!validateFileSize(file, MAX_IMAGE_MB)) {
      alert(`Images must be ${MAX_IMAGE_MB}MB or less.`)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    if (photoPreview) {
      URL.revokeObjectURL(photoPreview)
    }

    const previewUrl = URL.createObjectURL(file)
    setSelectedPhoto(file)
    setPhotoPreview(previewUrl)
  }

  async function sendPhoto() {
    if (!selectedPhoto || !selectedConversationId) return

    setUploading(true)
    // Force scroll to bottom when sending media
    setIsNearBottom(true)
    try {
      // Upload file
      const formData = new FormData()
      formData.append('file', selectedPhoto)
      formData.append('type', 'photo')

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      if (!uploadRes.ok) {
        const errorPayload = await uploadRes.json().catch(() => ({}))
        throw new Error(errorPayload.error || 'Upload failed')
      }

      const uploadData = await uploadRes.json()

      if (!uploadData.data?.url) {
        throw new Error('Failed to upload photo')
      }

      // Send message with photo URL
      const res = await fetch(`/api/messages/${selectedConversationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: '',
          messageType: 'PHOTO',
          mediaUrl: uploadData.data.url
        })
      })

      if (res.ok) {
        // Clear preview and selection
        cancelPhoto()
      }
    } catch (error) {
      console.error('Photo upload failed:', error)
      const message = error instanceof Error ? error.message : 'Failed to send photo'
      alert(message)
    } finally {
      setUploading(false)
    }
  }

  function cancelPhoto() {
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview)
    }
    setSelectedPhoto(null)
    setPhotoPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      
      const chunks: Blob[] = []
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        setAudioBlob(blob)
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
      
      // Update recording time every second
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch (error) {
      console.error('Failed to start recording:', error)
      alert('Failed to access microphone. Please grant permission.')
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }

  async function sendVoiceMessage() {
    if (!audioBlob || !selectedConversationId) return

    setUploading(true)
    // Force scroll to bottom when sending media
    setIsNearBottom(true)
    try {
      // Create a File object from the Blob
      const audioFile = new File([audioBlob], `voice-${Date.now()}.webm`, { type: 'audio/webm' })

      if (!validateAudioFile(audioFile)) {
        throw new Error('Unsupported audio type. Please record in webm, mp3, wav, or ogg.')
      }

      if (!validateFileSize(audioFile, MAX_AUDIO_MB)) {
        throw new Error(`Voice messages must be ${MAX_AUDIO_MB}MB or less.`)
      }
      
      // Upload file
      const formData = new FormData()
      formData.append('file', audioFile)
      formData.append('type', 'voice')

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      if (!uploadRes.ok) {
        const errorPayload = await uploadRes.json().catch(() => ({}))
        throw new Error(errorPayload.error || 'Upload failed')
      }

      const uploadData = await uploadRes.json()

      if (!uploadData.data?.url) {
        throw new Error('Failed to upload voice message')
      }

      // Send message with audio URL
      const res = await fetch(`/api/messages/${selectedConversationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: '',
          messageType: 'VOICE',
          mediaUrl: uploadData.data.url
        })
      })

      if (res.ok) {
        cancelVoiceMessage()
      }
    } catch (error) {
      console.error('Voice message upload failed:', error)
      const message = error instanceof Error ? error.message : 'Failed to send voice message'
      alert(message)
    } finally {
      setUploading(false)
    }
  }

  function cancelVoiceMessage() {
    setAudioBlob(null)
    setRecordingTime(0)
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current)
    }
  }

  async function unsendMessage(messageId: number) {
    if (!confirm('Are you sure you want to unsend this message?')) return

    try {
      const res = await fetch(`/api/messages/${messageId}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        throw new Error('Failed to unsend message')
      }

      // Message will be removed via realtime update
    } catch (error) {
      console.error('Failed to unsend message:', error)
      alert('Failed to unsend message')
    }
  }

  // Format recording time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="grid grid-cols-3 gap-4 flex-1 min-h-0">
        {/* Conversations List */}
        <div className="col-span-1 bg-[var(--card-bg)] rounded-xl border border-border flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border flex-shrink-0">
            <h2 className="text-xl font-bold text-foreground">Messages</h2>
          </div>
          
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-foreground-secondary overflow-y-auto">
              <p>No conversations yet</p>
              <p className="text-sm mt-2">Start chatting by viewing a listing</p>
            </div>
          ) : (
            <div className="divide-y divide-border overflow-y-auto flex-1">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversationId(conv.id)}
                  className={`w-full p-4 text-left hover:bg-[var(--background-elevated)] transition ${
                    selectedConversationId === conv.id ? 'bg-primary/10' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {conv.otherUser.avatarUrl ? (
                      <img 
                        src={conv.otherUser.avatarUrl} 
                        alt={conv.otherUser.name || 'User'}
                        className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold flex-shrink-0">
                        {(conv.otherUser.name || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold truncate text-foreground">{conv.otherUser.name || 'User'}</p>
                        {conv.unreadCount > 0 && (
                          <span className="bg-primary text-white text-xs rounded-full px-2 py-1">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      {conv.lastMessage && (
                        <p className="text-sm text-foreground-secondary truncate">
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
        <div className="col-span-2 bg-[var(--card-bg)] rounded-xl border border-border flex flex-col">
          {!selectedConversation ? (
            <div className="flex-1 flex items-center justify-center text-foreground-secondary">
              <div className="text-center">
                <p className="text-lg">Select a conversation to start messaging</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="p-4 border-b border-border flex items-center gap-3">
                {selectedConversation.otherUser.avatarUrl ? (
                  <img 
                    src={selectedConversation.otherUser.avatarUrl} 
                    alt={selectedConversation.otherUser.name || 'User'}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                    {(selectedConversation.otherUser.name || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-foreground">{selectedConversation.otherUser.name || 'User'}</h3>
                </div>
              </div>

              {/* Messages */}
              <div 
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 space-y-4"
              >
                {messagesLoading ? (
                  <div className="text-center text-foreground-secondary">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-foreground-secondary">No messages yet. Start the conversation!</div>
                ) : (
                  <>
                    {messages.map((msg) => {
                      const isOwn = msg.sender.id !== selectedConversation.otherUser.id
                      return (
                        <div 
                          key={msg.id} 
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}
                          onMouseEnter={() => setHoveredMessageId(msg.id)}
                          onMouseLeave={() => setHoveredMessageId(null)}
                        >
                          <div className="relative">
                            <div className={`rounded-lg p-3 ${
                              isOwn ? 'bg-primary text-white' : 'bg-[var(--background-elevated)] text-foreground'
                            }`}>
                              {/* Display based on message type */}
                              {msg.messageType === 'PHOTO' && msg.mediaUrl && (
                                <img 
                                  src={msg.mediaUrl} 
                                  alt="Photo message" 
                                  className="rounded max-w-full h-auto mb-2"
                                  style={{ maxWidth: '300px' }}
                                />
                              )}
                              {msg.messageType === 'VOICE' && msg.mediaUrl && (
                                <audio controls className="mb-2" style={{ maxWidth: '300px' }}>
                                  <source src={msg.mediaUrl} />
                                </audio>
                              )}
                              {msg.content && <p className="text-sm">{msg.content}</p>}
                              <p className={`text-xs mt-1 ${isOwn ? 'text-white/80' : 'text-foreground-secondary'}`}>
                                {(() => {
                                  // Ensure proper UTC parsing - if timestamp doesn't end in Z, add it
                                  let timestampStr = msg.createdAt
                                  if (!timestampStr.endsWith('Z') && !timestampStr.includes('+') && !timestampStr.includes('T')) {
                                    timestampStr = timestampStr.replace(' ', 'T') + 'Z'
                                  } else if (timestampStr.includes('T') && !timestampStr.endsWith('Z') && !timestampStr.includes('+')) {
                                    timestampStr += 'Z'
                                  }
                                  
                                  const messageDate = new Date(timestampStr)
                                  const now = new Date()
                                  const isToday = messageDate.toDateString() === now.toDateString()
                                  
                                  if (isToday) {
                                    return messageDate.toLocaleString('en-US', { 
                                      hour: 'numeric', 
                                      minute: '2-digit',
                                      hour12: true
                                    })
                                  } else {
                                    return messageDate.toLocaleString('en-US', { 
                                      month: 'short',
                                      day: 'numeric',
                                      hour: 'numeric', 
                                      minute: '2-digit',
                                      hour12: true
                                    })
                                  }
                                })()}
                              </p>
                            </div>
                            {/* Unsend button - only show for own messages on hover */}
                            {isOwn && hoveredMessageId === msg.id && (
                              <button
                                onClick={() => unsendMessage(msg.id)}
                                className="absolute -left-20 top-1/2 -translate-y-1/2 text-xs text-foreground-secondary hover:text-error px-2 py-1 rounded hover:bg-[var(--background-elevated)] transition"
                                title="Unsend message"
                              >
                                Unsend
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Photo Preview */}
              {photoPreview && (
                <div className="p-4 border-t bg-gray-50">
                  <div className="flex items-end gap-3">
                    <div className="relative">
                      <img 
                        src={photoPreview} 
                        alt="Preview" 
                        className="max-h-32 rounded-lg border-2 border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={cancelPhoto}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                      >
                        ✕
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={sendPhoto}
                      disabled={uploading}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {uploading ? 'Sending...' : 'Send Photo'}
                    </button>
                  </div>
                </div>
              )}

              {/* Voice Recording Preview */}
              {audioBlob && !isRecording && (
                <div className="p-4 border-t bg-gray-50">
                  <div className="flex items-center gap-3">
                    <audio controls src={URL.createObjectURL(audioBlob)} className="flex-1" />
                    <button
                      type="button"
                      onClick={cancelVoiceMessage}
                      className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={sendVoiceMessage}
                      disabled={uploading}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {uploading ? 'Sending...' : 'Send Voice'}
                    </button>
                  </div>
                </div>
              )}

              {/* Recording Indicator */}
              {isRecording && (
                <div className="p-4 border-t bg-red-50">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 flex-1">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-red-600 font-medium">Recording... {formatTime(recordingTime)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                    >
                      Stop
                    </button>
                  </div>
                </div>
              )}

              {/* Input */}
              <form onSubmit={sendMessage} className="p-4 border-t dark:border-gray-700">
                <div className="flex gap-2">
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  
                  {/* Photo upload button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading || sending || isRecording}
                    className="px-4 py-2 rounded-lg border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    title="Send photo"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>

                  {/* Voice recording button */}
                  <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={uploading || sending}
                    className={`px-4 py-2 rounded-lg border transition ${
                      isRecording 
                        ? 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-800 hover:bg-red-200 dark:hover:bg-red-900/50' 
                        : 'border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    title={isRecording ? "Stop recording" : "Record voice message"}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </button>
                  
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={uploading ? "Uploading..." : isRecording ? "Recording..." : "Type a message..."}
                    className="flex-1 rounded-lg border dark:border-gray-700 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-400"
                    disabled={sending || uploading || isRecording}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending || uploading || isRecording}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {sending ? 'Sending...' : uploading ? 'Uploading...' : 'Send'}
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

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-[60vh] place-items-center p-8 text-foreground-secondary">
          <p>Loading messages…</p>
        </main>
      }
    >
      <MessagesPageInner />
    </Suspense>
  )
}
