import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-middleware"
import { sbServer } from "@/lib/supabase/server"
import { validateFileSize, validateImageFile, validateAudioFile, sanitizeFilename, checkRateLimit } from "@/lib/validation"

const MAX_IMAGE_SIZE_MB = 5
const MAX_AUDIO_SIZE_MB = 10
const ALLOWED_TYPES = ["photo", "voice", "listing"] as const

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const authResult = await requireAuth(req)
    if (authResult instanceof NextResponse) {
      return authResult
    }
    const { user } = authResult

    // Rate limiting: 10 uploads per minute per user
    if (!checkRateLimit(`upload:${user.id}`, 10, 60000)) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // 'photo', 'voice', or 'listing'

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(type as any)) {
      return NextResponse.json({ error: "Invalid file type parameter. Must be 'photo', 'voice', or 'listing'" }, { status: 400 })
    }

    // Validate file type and size
    if (type === 'photo' || type === 'listing') {
      if (!validateImageFile(file)) {
        return NextResponse.json({ error: "Invalid image file type. Only JPEG, PNG, GIF, and WebP are allowed." }, { status: 400 })
      }
      if (!validateFileSize(file, MAX_IMAGE_SIZE_MB)) {
        return NextResponse.json({ error: `Image file size must be less than ${MAX_IMAGE_SIZE_MB}MB` }, { status: 400 })
      }
    } else if (type === 'voice') {
      if (!validateAudioFile(file)) {
        return NextResponse.json({ error: "Invalid audio file type. Only WebM, MP3, WAV, and OGG are allowed." }, { status: 400 })
      }
      if (!validateFileSize(file, MAX_AUDIO_SIZE_MB)) {
        return NextResponse.json({ error: `Audio file size must be less than ${MAX_AUDIO_SIZE_MB}MB` }, { status: 400 })
      }
    }

    // Create secure filename
    const fileExt = file.name.split('.').pop()
    const sanitizedExt = sanitizeFilename(fileExt || 'bin')
    const fileName = `${user.id}-${Date.now()}-${Math.random().toString(36).substring(7)}.${sanitizedExt}`
    
    // Determine folder path
    let folderPath = 'photos'
    if (type === 'voice') folderPath = 'voices'
    if (type === 'listing') folderPath = 'listings'
    
    const filePath = `${folderPath}/${fileName}`

    // Convert File to ArrayBuffer then to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Supabase Storage
    const supabase = await sbServer()
    const { data, error } = await supabase.storage
      .from('message-media')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (error) {
      console.error('Upload error:', error)
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('message-media')
      .getPublicUrl(filePath)

    return NextResponse.json({ 
      data: { 
        url: publicUrl,
        path: filePath 
      } 
    }, { status: 200 })

  } catch (err: any) {
    console.error("POST /api/upload error:", err)
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
  }
}
