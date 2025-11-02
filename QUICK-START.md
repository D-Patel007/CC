# Quick Start Guide - New Features

## 🎯 What's New

### 1. Verified Student Badges ✓
- Blue checkmark badge appears next to verified sellers
- Shows on listing cards and detail pages
- Database field: `Profile.isVerified`

**How to verify a user manually (via Supabase Dashboard):**
```sql
UPDATE "Profile" 
SET "isVerified" = true, "verifiedEmail" = 'student@umb.edu'
WHERE id = YOUR_USER_ID;
```

### 2. Skeleton Loaders 💀
- Modern loading states throughout the app
- No more boring spinners!
- Automatic on page navigation (via `app/loading.tsx`)

### 3. Multi-Image Upload 📸
**For Users:**
- Upload up to 5 images per listing
- Drag-and-drop or click to browse
- First image is the cover photo
- Remove images individually

**For Developers:**
- Images stored in `Listing.images` array
- Backward compatible with `imageUrl`
- Carousel component auto-handles 0, 1, or many images

---

## 🚀 Setup Instructions

### Step 1: Run Database Migration

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Copy the contents of `supabase-migrations.sql`
4. Execute the query
5. Confirm success message

### Step 2: Test the Features

**Test Multi-Image Upload:**
1. Go to `/listings/new`
2. Try dragging images onto the upload zone
3. Upload 2-3 images
4. Create the listing
5. View the listing detail page - carousel should work!

**Test Verified Badges:**
1. Mark your profile as verified (see SQL above)
2. Create a listing
3. View homepage - your listing should show the blue checkmark

**Test Skeleton Loaders:**
1. Navigate to homepage
2. Refresh with DevTools Network throttled to "Slow 3G"
3. See the skeleton animation instead of blank page

---

## 🛠️ Developer Tips

### Using VerifiedBadge Component
```tsx
import VerifiedBadge from '@/components/VerifiedBadge'

<VerifiedBadge 
  isVerified={user.isVerified} 
  size="md"           // sm, md, lg
  showText={true}     // Show "Verified" text
  className="ml-2"    // Add custom classes
/>
```

### Using Skeleton Component
```tsx
import Skeleton, { ListingCardSkeleton } from '@/components/Skeleton'

// Basic skeleton
<Skeleton className="w-full h-48" />

// Multiple text lines
<Skeleton variant="text" count={3} />

// Avatar
<Skeleton variant="circular" width={48} height={48} />

// Pre-built card skeleton
<ListingCardSkeleton />
```

### Using ImageCarousel Component
```tsx
import ImageCarousel from '@/components/ImageCarousel'

<ImageCarousel 
  images={listing.images} 
  alt={listing.title} 
/>
```

---

## 📱 API Updates Needed

The following API endpoints should be updated to handle new fields:

### POST /api/listings
**Current:** Accepts `imageUrl`  
**Should Accept:**
```typescript
{
  imageUrl: string | null,  // Keep for compatibility
  images: string[],          // NEW: Array of URLs
  imageCount: number         // NEW: Count for filtering
}
```

### GET /api/listings (and /api/listings/[id])
**Should Return:**
- Full `seller` object including `isVerified` field
- `images` array and `imageCount`

---

## 🎨 Customization

### Change Verified Badge Color
Edit `components/VerifiedBadge.tsx`:
```tsx
// Change from blue to green
className="text-green-500 dark:text-green-400"
```

### Change Skeleton Animation Speed
Edit `components/Skeleton.tsx`:
```tsx
// Add to baseClasses
animation: pulse 2s ease-in-out infinite;  // Change 2s
```

### Change Max Images
Edit `components/ListingForm.tsx`:
```tsx
const MAX_IMAGES = 10  // Change from 5 to 10
```

---

## 🐛 Troubleshooting

**Problem:** Verified badge not showing  
**Solution:** Make sure you ran the migration and set `isVerified = true`

**Problem:** Images not uploading  
**Solution:** Check `/api/upload` endpoint is working and accepts multiple files

**Problem:** Carousel not showing  
**Solution:** Check that `listing.images` is an array, not null

**Problem:** Skeleton loaders not appearing  
**Solution:** Make sure you created `app/loading.tsx` and imported skeleton components

---

## 📊 Performance Notes

- Skeleton loaders improve perceived performance
- Image carousel uses lazy loading
- Only first image loads on listing cards
- Thumbnail images are optimized by browser

---

## 🔒 Security Considerations

1. **Email Verification:** Currently `isVerified` can be manually set. In production, implement proper email verification flow.

2. **Image Upload:** The upload API should validate:
   - File size limits
   - Image dimensions
   - File type (images only)
   - Maximum number of images per listing

3. **Rate Limiting:** Consider adding rate limits to prevent abuse of multi-image uploads.

---

Need help? Check `FEATURE-IMPLEMENTATION.md` for detailed technical documentation!
