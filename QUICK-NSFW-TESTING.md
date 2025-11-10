# Quick NSFW Testing Guide

## Problem You Encountered
You tried to test NSFW detection with an external URL (Unsplash avocado image), but the form only accepts **file uploads**, not URLs.

## Two Ways to Test NSFW Detection

### Option 1: Download & Upload Test Images (EASY)
1. **Download a test image:**
   - Right-click this URL and "Save Image As": https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=800
   - Or download Venus de Milo: https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Venus_de_Milo_Louvre_Ma399.jpg/800px-Venus_de_Milo_Louvre_Ma399.jpg

2. **Go to Create Listing page:** http://localhost:3001/listings/new

3. **Upload the downloaded image** using the file picker

4. **Check terminal logs** for NSFW results

### Option 2: Test via API Directly (ADVANCED)
```bash
# Test with external URL directly
curl -X POST http://localhost:3001/api/listings \
  -H "Content-Type: application/json" \
  -H "Cookie: YOUR_SESSION_COOKIE" \
  -d '{
    "title": "Test NSFW Detection",
    "description": "Testing image moderation",
    "priceCents": 1000,
    "categoryId": 1,
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Venus_de_Milo_Louvre_Ma399.jpg/800px-Venus_de_Milo_Louvre_Ma399.jpg"
  }'
```

## What Got Fixed

### Before:
- ❌ Only `/api/upload` checked for NSFW
- ❌ Listing API ignored image NSFW completely
- ❌ Could create listings with inappropriate images if you bypassed upload

### After:
- ✅ `/api/upload` checks NSFW during file upload
- ✅ `/api/listings` checks NSFW when listing is created
- ✅ Both text spam AND image NSFW are detected
- ✅ Results saved to FlaggedContent table
- ✅ Shows in admin dashboard

## Test Results You Should See

### Terminal Output:
```
🖼️ Checking image for NSFW content...
NSFW Score: 0.75 Categories: [ 'sexual_display' ]
❌ Listing rejected - NSFW image: { 
  isNSFW: true, 
  confidence: 0.75, 
  categories: ['sexual_display'], 
  shouldReject: true 
}
```

### Or if flagged but not rejected:
```
🖼️ Checking image for NSFW content...
NSFW Score: 0.45 Categories: [ 'erotica' ]
⚠️ Image flagged: Potentially inappropriate content
⚠️ Listing flagged for review - spam score: 15 NSFW: true
✅ Created FlaggedContent entry #12 for listing 45
```

## Thresholds

Current NSFW detection thresholds (in `lib/nsfw-detection.ts`):

| Score | Action | Example |
|-------|--------|---------|
| 0.0 - 0.3 | ✅ Allow | Normal photos |
| 0.4 - 0.6 | ⚠️ Flag | Swimsuits, classical art |
| 0.7 - 1.0 | ❌ Reject | Explicit content |

## Why the Avocado Failed

The error `ECONNRESET` means:
- The form tried to **upload** the URL string as a file
- It's not an NSFW rejection
- It's a network/format error

To test properly, you need to:
1. Download the image to your computer
2. Upload it as a file through the form
3. Or use the API directly with a JSON payload (Option 2 above)

## Quick Test Commands

### Test safe image:
```bash
# This should PASS (score ~0.1)
curl -X POST http://localhost:3001/api/listings \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Safe Test",
    "description": "Regular image",
    "priceCents": 1000,
    "categoryId": 1,
    "imageUrl": "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=800"
  }'
```

### Test classical art (should flag):
```bash
# This should FLAG or REJECT (score ~0.5-0.7)
curl -X POST http://localhost:3001/api/listings \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Classical Art Test",
    "description": "Venus statue",
    "priceCents": 1000,
    "categoryId": 1,
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Venus_de_Milo_Louvre_Ma399.jpg/800px-Venus_de_Milo_Louvre_Ma399.jpg"
  }'
```

Note: You need to be **logged in** for these curl commands to work (include session cookie).

