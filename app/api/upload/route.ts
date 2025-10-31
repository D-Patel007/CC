import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { sbServer } from "@/lib/supabase/server"
import { validateFileSize, validateImageFile, validateAudioFile, sanitizeFilename, checkRateLimit } from "@/lib/validation"

const MAX_IMAGE_SIZE_MB = 5
const MAX_AUDIO_SIZE_MB = 10

export async function POST(req: NextRequest) {
  try {
    const { profile } = await getCurrentUser()
    if (!profile) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Rate limiting: 10 uploads per minute per user
    if (!checkRateLimit(`upload:${profile.id}`, 10, 60000)) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // 'photo', 'voice', or 'listing'

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
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
    } else {
      return NextResponse.json({ error: "Invalid file type parameter" }, { status: 400 })
    }

    // Create secure filename
    const fileExt = file.name.split('.').pop()
    const sanitizedExt = sanitizeFilename(fileExt || 'bin')
    const fileName = `${profile.id}-${Date.now()}-${Math.random().toString(36).substring(7)}.${sanitizedExt}`
    
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
