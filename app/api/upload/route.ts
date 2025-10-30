import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { sbServer } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const { profile } = await getCurrentUser()
    if (!profile) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // 'photo', 'voice', or 'listing'

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    if ((type === 'photo' || type === 'listing') && !file.type.startsWith('image/')) {
      return NextResponse.json({ error: "Invalid image file type" }, { status: 400 })
    }

    if (type === 'voice' && !file.type.startsWith('audio/')) {
      return NextResponse.json({ error: "Invalid audio file type" }, { status: 400 })
    }

    // Create unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${profile.id}-${Date.now()}.${fileExt}`
    
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
