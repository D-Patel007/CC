# NSFW Image Detection Testing Guide

## Safe Test Images for NSFW Detection

Since we can't share actual NSFW content, here are safe ways to test the image moderation:

### 1. **Use Test Images from Sightengine's Documentation**
Sightengine provides test image URLs in their docs:
- Safe image: `https://sightengine.com/assets/stream/examples/1.jpg`
- Mildly suggestive: `https://sightengine.com/assets/stream/examples/2.jpg`
- Test various: `https://sightengine.com/assets/stream/examples/[3-10].jpg`

### 2. **Use Art/Statue Images (Legal & Safe)**
Classical art with nudity is legal and good for testing:
- Search "classical art nude" on Wikimedia Commons
- Example: Venus de Milo, David by Michelangelo
- These should trigger NSFW detection but aren't pornographic

### 3. **Use Stock Photo Sites**
- Unsplash/Pexels: Search "swimsuit" or "beach"
- These are legal and safe but may score medium on NSFW scale

### 4. **Test URLs You Can Use Right Now**
```
# Classical Art (Safe to test, should trigger NSFW)
https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Venus_de_Milo_Louvre_Ma399.jpg/800px-Venus_de_Milo_Louvre_Ma399.jpg

# Beach/Swimsuit (Safe, may score low-medium NSFW)
https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800

# Regular safe image (should pass)
https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=800
```

## How to Test

1. **Go to your listing creation page**
2. **Use one of the test URLs above as the image URL**
3. **Check the console logs for NSFW scores**
4. **Verify it gets flagged if score is high**

## Expected Behavior

### Current Implementation (from lib/nsfw-detection.ts):
```typescript
// Auto-reject thresholds
if (nsfwScore >= 0.7) {
  return {
    isNSFW: true,
    confidence: 'high',
    shouldReject: true,
    score: nsfwScore,
    reasons: ['Explicit adult content detected']
  }
}

// Flag for review thresholds
if (nsfwScore >= 0.4) {
  return {
    isNSFW: true,
    confidence: 'medium',
    shouldReject: false,
    score: nsfwScore,
    reasons: ['Potentially inappropriate content']
  }
}
```

### Scoring Guide:
- **0.0 - 0.3**: Safe, no action
- **0.4 - 0.6**: Flagged for review (medium)
- **0.7 - 1.0**: Auto-rejected (high)

## Integration Check

The NSFW check is integrated in:
- `app/api/listings/route.ts` (POST endpoint)
- `lib/nsfw-detection.ts` (detection logic)

When you upload an image:
1. Sightengine API analyzes the image
2. Returns nudity/adult content scores
3. Our code auto-rejects or flags based on thresholds
4. Creates FlaggedContent record if needed

## Testing Workflow

```bash
# 1. Create listing with classical art URL
POST /api/listings
{
  "title": "Test Artwork",
  "description": "Testing NSFW detection",
  "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Venus_de_Milo_Louvre_Ma399.jpg/800px-Venus_de_Milo_Louvre_Ma399.jpg",
  "priceCents": 1000
}

# 2. Check terminal output for:
🖼️ Checking image for NSFW content...
NSFW Score: 0.XX
⚠️ Image flagged: Potentially inappropriate content
```

## Important Notes

- ✅ Classical art URLs are **legal and safe** to test with
- ✅ These images are publicly available on Wikimedia
- ✅ No actual pornography needed for testing
- ❌ Never upload actual NSFW content to test
- ❌ Don't share explicit URLs in documentation

## Sightengine API Limits

Your current plan:
- Check `SIGHTENGINE_API_USER` and `SIGHTENGINE_API_SECRET` in `.env.local`
- Free tier: Limited requests per month
- Monitor usage at: https://sightengine.com/dashboard

## Troubleshooting

If NSFW detection isn't working:
1. Check `.env.local` has Sightengine credentials
2. Verify API credits aren't exhausted
3. Check console for API errors
4. Test with known safe image first
5. Review `lib/nsfw-detection.ts` for correct API call

