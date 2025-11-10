import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-middleware"
import { sbServer } from "@/lib/supabase/server"
import { validateFileSize, validateImageFile, validateAudioFile, sanitizeFilename, checkRateLimit } from "@/lib/validation"
import { detectNSFW } from "@/lib/nsfw-detection"
import { sendContentFlaggedNotification } from "@/lib/email"

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

    // 🛡️ NSFW Detection for images
    if (type === 'photo' || type === 'listing') {
      console.log('🛡️ Running NSFW detection on uploaded image...');
      console.log('   Image URL:', publicUrl);
      console.log('   Type:', type);
      
      try {
        const nsfwResult = await detectNSFW(publicUrl);
        console.log('📊 NSFW Result:', {
          isNSFW: nsfwResult.isNSFW,
          confidence: nsfwResult.confidence,
          categories: nsfwResult.categories,
          shouldReject: nsfwResult.shouldReject,
        });
        
        // Auto-reject if confidence >= 0.5 (lowered from 0.7 for stricter filtering)
        if (nsfwResult.shouldReject || nsfwResult.confidence >= 0.5) {
          console.log('❌ Image rejected - NSFW content detected');
          
          // Delete the uploaded file
          await supabase.storage
            .from('message-media')
            .remove([filePath]);
          
          // Log rejected upload attempt to FlaggedContent
          await supabase
            .from('FlaggedContent')
            .insert({
              contentType: type === 'listing' ? 'listing' : 'profile', // 'photo' maps to profile
              contentId: 0, // No content ID since upload was rejected
              userId: user.id,
              reason: `NSFW ${type} upload rejected: ${nsfwResult.categories.join(', ')}`,
              severity: nsfwResult.confidence >= 0.7 ? 'high' : 'medium',
              status: 'rejected',
              source: 'auto',
              details: {
                nsfwScore: nsfwResult.confidence,
                categories: nsfwResult.categories,
                fileType: file.type,
                fileName: file.name,
                uploadType: type,
                rejectedAt: new Date().toISOString(),
              },
            });
          
          // Send email notification to user about rejected upload
          try {
            const { data: userAuth } = await supabase.auth.admin.getUserById(user.id.toString())
            const { data: userProfile } = await supabase
              .from('Profile')
              .select('name, emailNotifications, emailContentFlags')
              .eq('id', user.id)
              .single()

            if (userAuth?.user?.email && userProfile &&
                userProfile.emailNotifications !== false &&
                userProfile.emailContentFlags !== false) {
              await sendContentFlaggedNotification({
                userEmail: userAuth.user.email,
                userName: userProfile.name || 'User',
                contentType: type === 'listing' ? 'listing' : 'profile',
                contentTitle: `${type} image upload`,
                reason: `NSFW content detected: ${nsfwResult.categories.join(', ')}`,
                severity: nsfwResult.confidence >= 0.7 ? 'high' : 'medium',
                dashboardUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/profile`
              })
            }
          } catch (emailError) {
            console.error('Failed to send NSFW rejection email:', emailError)
          }
          
          return NextResponse.json({
            error: 'Image contains inappropriate content and cannot be uploaded',
            categories: nsfwResult.categories,
            confidence: nsfwResult.confidence,
          }, { status: 400 });
        }
        
        if (nsfwResult.isNSFW) {
          console.log('⚠️ Image flagged for review - possible NSFW');
          // Could add to moderation queue here
        } else {
          console.log('✅ Image passed NSFW check');
        }
      } catch (nsfwError) {
        console.error('❌ NSFW detection error:', nsfwError);
        // Continue anyway - don't block uploads on detection errors
      }
    }

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
