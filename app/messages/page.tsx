"use client"
import { useState, useEffect, useRef } from "react"
import { useRealtimeMessages } from "@/lib/hooks/useRealtimeMessages"
import { useSearchParams } from "next/navigation"

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
  
  const { messages, loading: messagesLoading } = useRealtimeMessages(selectedConversationId)

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

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !selectedConversationId) return

    // Create preview URL
    const previewUrl = URL.createObjectURL(file)
    setSelectedPhoto(file)
    setPhotoPreview(previewUrl)
  }

  async function sendPhoto() {
    if (!selectedPhoto || !selectedConversationId) return

    setUploading(true)
    try {
      // Upload file
      const formData = new FormData()
      formData.append('file', selectedPhoto)
      formData.append('type', 'photo')

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
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
      alert('Failed to send photo')
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
    try {
      // Create a File object from the Blob
      const audioFile = new File([audioBlob], `voice-${Date.now()}.webm`, { type: 'audio/webm' })
      
      // Upload file
      const formData = new FormData()
      formData.append('file', audioFile)
      formData.append('type', 'voice')

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
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
      alert('Failed to send voice message')
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

  // Format recording time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
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
                            {/* Display based on message type */}
                            {msg.messageType === 'PHOTO' && msg.mediaUrl && (
                              <img 
                                src={msg.mediaUrl} 
                                alt="Photo message" 
                                className="rounded max-w-full h-auto mb-2"
                              />
                            )}
                            {msg.messageType === 'VOICE' && msg.mediaUrl && (
                              <audio controls className="mb-2 max-w-full">
                                <source src={msg.mediaUrl} />
                              </audio>
                            )}
                            {msg.content && <p className="text-sm">{msg.content}</p>}
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
              <form onSubmit={sendMessage} className="p-4 border-t">
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
                    className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    title="Send photo"
                  >
                    📷
                  </button>

                  {/* Voice recording button */}
                  <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={uploading || sending}
                    className={`px-4 py-2 rounded-lg border transition ${
                      isRecording 
                        ? 'bg-red-100 border-red-300 hover:bg-red-200' 
                        : 'border-gray-300 hover:bg-gray-50'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    title={isRecording ? "Stop recording" : "Record voice message"}
                  >
                    🎤
                  </button>
                  
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={uploading ? "Uploading..." : isRecording ? "Recording..." : "Type a message..."}
                    className="flex-1 rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
