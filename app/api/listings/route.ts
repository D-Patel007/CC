import { NextRequest, NextResponse } from "next/server"
import { sbServer } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth-middleware"
import { validateRequest, createListingSchema } from "@/lib/validation-schemas"
import { rateLimit, RateLimits, getRateLimitIdentifier } from "@/lib/rate-limit"
import { moderateText, calculateSpamScore, shouldAutoReject, shouldFlagForReview } from "@/lib/moderation"
import { detectNSFW } from "@/lib/nsfw-detection"

// CREATE a listing
export async function POST(req: NextRequest) {
  try {
    // Authentication
    const authResult = await requireAuth(req)
    if (authResult instanceof NextResponse) return authResult
    const { user } = authResult

    // Rate limiting - strict for write operations
    const rateLimitIdentifier = getRateLimitIdentifier(req, "listings:create", user.id)
    const rateLimitResponse = rateLimit(rateLimitIdentifier, RateLimits.STRICT)
    if (rateLimitResponse) return rateLimitResponse

    // Validation
    const validation = await validateRequest(req, createListingSchema)
    if ('error' in validation) {
      return NextResponse.json(
        { error: validation.error, details: validation.details },
        { status: 400 }
      )
    }
    const { title, description, priceCents, condition, categoryId, imageUrl, campus } = validation.data

    // 🛡️ CONTENT MODERATION
    console.log('🛡️ Running content moderation...');
    
    // Check title for spam/inappropriate content
    const titleModeration = moderateText(title);
    if (shouldAutoReject(titleModeration)) {
      console.log('❌ Listing rejected - inappropriate title:', titleModeration);
      return NextResponse.json({
        error: 'Your listing title contains inappropriate or spam content',
        reasons: titleModeration.reasons,
      }, { status: 400 });
    }

    // Check description
    const descriptionModeration = moderateText(description);
    if (shouldAutoReject(descriptionModeration)) {
      console.log('❌ Listing rejected - inappropriate description:', descriptionModeration);
      return NextResponse.json({
        error: 'Your listing description contains inappropriate or spam content',
        reasons: descriptionModeration.reasons,
      }, { status: 400 });
    }

    // Calculate spam score
    const spamScore = calculateSpamScore({ title, description, priceCents });
    console.log('📊 Spam score:', spamScore);

    // Auto-reject high spam scores (lowered from 70 to 50 for stricter filtering)
    if (spamScore >= 50) {
      console.log('❌ Listing rejected - high spam score:', spamScore);
      return NextResponse.json({
        error: 'Your listing appears to be spam or violates our community guidelines',
        reasons: [
          ...titleModeration.reasons,
          ...descriptionModeration.reasons,
        ],
      }, { status: 400 });
    }

    // 🛡️ NSFW Image Detection (if image URL provided)
    let nsfwReasons: string[] = [];
    let shouldRejectNSFW = false;
    if (imageUrl) {
      console.log('🖼️ Checking image for NSFW content...');
      const nsfwResult = await detectNSFW(imageUrl);
      console.log('NSFW Score:', nsfwResult.confidence, 'Categories:', nsfwResult.categories);
      
      // Auto-reject if confidence >= 0.5 (lowered from 0.7 for stricter filtering)
      if (nsfwResult.shouldReject || nsfwResult.confidence >= 0.5) {
        console.log('❌ Listing rejected - NSFW image:', nsfwResult);
        shouldRejectNSFW = true;
        
        // Create FlaggedContent entry for rejected attempt (without listing ID)
        const supabase = await sbServer();
        await supabase
          .from('FlaggedContent')
          .insert({
            contentType: 'listing',
            contentId: 0, // No listing ID since it was rejected
            userId: user.id,
            reason: `NSFW image rejected: ${nsfwResult.categories.join(', ')}`,
            severity: nsfwResult.confidence >= 0.7 ? 'high' : 'medium',
            status: 'rejected',
            source: 'auto',
            details: {
              nsfwScore: nsfwResult.confidence,
              categories: nsfwResult.categories,
              imageUrl: imageUrl.substring(0, 200),
              title: title.substring(0, 100),
              description: description.substring(0, 200),
              rejectedAt: new Date().toISOString(),
            },
          });
        
        return NextResponse.json({
          error: 'Image contains inappropriate content (NSFW detected)',
          categories: nsfwResult.categories,
          confidence: nsfwResult.confidence,
        }, { status: 400 });
      }
      
      if (nsfwResult.isNSFW) {
        console.log('⚠️ Image flagged: Potentially inappropriate content');
        nsfwReasons.push(`Image flagged: ${nsfwResult.categories.join(', ')}`);
      }
    }

    // Flag for review if moderate spam score OR NSFW image
    const needsReview = spamScore >= 30 || 
                        shouldFlagForReview(titleModeration) || 
                        shouldFlagForReview(descriptionModeration) ||
                        nsfwReasons.length > 0;
    
    if (needsReview) {
      console.log('⚠️ Listing flagged for review - spam score:', spamScore, 'NSFW:', nsfwReasons.length > 0);
    }

    const supabase = await sbServer()

    // Verify category exists if provided
    if (categoryId) {
      const { data: category } = await supabase
        .from('Category')
        .select('id')
        .eq('id', categoryId)
        .single()
      
      if (!category) {
        return NextResponse.json({ error: "Category not found" }, { status: 400 })
      }
    }

    const now = new Date().toISOString()
    const { data: listing, error } = await supabase
      .from('Listing')
      .insert({
        title,
        description,
        priceCents,
        categoryId: categoryId ?? null,
        condition,
        imageUrl: imageUrl ?? null,
        campus: campus ?? null,
        sellerId: user.id,
        createdAt: now,
        updatedAt: now
      })
      .select(`
        *,
        category:Category(*),
        seller:Profile!Listing_sellerId_fkey(id, name, avatarUrl)
      `)
      .single()

    if (error || !listing) {
      console.error("Failed to create listing:", error)
      return NextResponse.json({ error: "Failed to create listing" }, { status: 500 })
    }

    // 🚩 Create FlaggedContent entry if needed
    if (needsReview) {
      const severity = spamScore >= 60 ? 'high' : spamScore >= 45 ? 'medium' : 'low';
      const reasons = [
        ...titleModeration.reasons,
        ...descriptionModeration.reasons,
        ...nsfwReasons,
        spamScore >= 30 ? `Spam score: ${spamScore}` : null,
      ].filter(Boolean);

      const { data: flagged, error: flagError } = await supabase
        .from('FlaggedContent')
        .insert({
          contentType: 'listing',
          contentId: listing.id,
          userId: user.id,
          reason: reasons.join(', '),
          severity,
          status: 'pending',
          source: 'auto',
          details: {
            spamScore,
            titleModeration,
            descriptionModeration,
            nsfwCheck: nsfwReasons.length > 0,
            title: title.substring(0, 100),
            description: description.substring(0, 200),
            imageUrl: imageUrl ? imageUrl.substring(0, 200) : null,
          },
          createdAt: now,
        })
        .select()
        .single();

      if (flagError) {
        console.error('❌ Failed to create FlaggedContent entry:', flagError);
      } else {
        console.log(`✅ Created FlaggedContent entry #${flagged.id} for listing ${listing.id}`);
        console.log(`   Severity: ${severity}, Spam Score: ${spamScore}`);
        console.log(`   Reasons: ${reasons.join(', ')}`);
      }
    }

    return NextResponse.json({ data: listing }, { status: 201 })
  } catch (err: any) {
    console.error("POST /api/listings failed:", err)
    return NextResponse.json({ error: "Failed to create listing" }, { status: 500 })
  }
}

// READ listings (kept for completeness)
export async function GET(req: NextRequest) {
  try {
    // Rate limiting - lenient for public read operations
    const rateLimitIdentifier = getRateLimitIdentifier(req, "listings:read")
    const rateLimitResponse = rateLimit(rateLimitIdentifier, RateLimits.LENIENT)
    if (rateLimitResponse) return rateLimitResponse

    const { searchParams } = new URL(req.url)
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1)
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20", 10), 1), 50)
    const skip = (page - 1) * limit

    const supabase = await sbServer()
    const q = searchParams.get("q")
    const category = searchParams.get("category")
    const status = searchParams.get("status")?.toLowerCase()
    
    let query = supabase
      .from('Listing')
      .select(`
        *,
        category:Category(*),
        seller:Profile!Listing_sellerId_fkey(id, name, avatarUrl)
      `, { count: 'exact' })

    // Search filter
    if (q) {
      query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`)
    }

    // Category filter
    if (category) {
      const { data: categoryData } = await supabase
        .from('Category')
        .select('id')
        .or(`name.ilike.${category},slug.eq.${category.toLowerCase()}`)
        .single()
      
      if (categoryData) {
        query = query.eq('categoryId', categoryData.id)
      }
    }

    // Status filter
    if (status === "active") {
      query = query.eq('isSold', false)
    } else if (status === "sold") {
      query = query.eq('isSold', true)
    }

    const { data: items, error, count } = await query
      .order('createdAt', { ascending: false })
      .range(skip, skip + limit - 1)

    if (error) {
      console.error("GET /api/listings failed:", error)
      return NextResponse.json({ error: "Failed to load listings" }, { status: 500 })
    }

    const total = count ?? 0

    return NextResponse.json({
      data: items || [],
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    })
  } catch (e) {
    console.error("GET /api/listings failed:", e)
    return NextResponse.json({ error: "Failed to load listings" }, { status: 500 })
  }
}
