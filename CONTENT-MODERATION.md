# Content Moderation System

## Overview
UMB Connect has built-in content moderation to prevent spam, scams, inappropriate content, and NSFW images.

## Features Implemented

### ✅ Text Moderation (Listings, Messages, Descriptions)
**Detects:**
- Spam keywords (money transfer scams, gift cards, crypto)
- Phishing attempts
- Profanity and inappropriate language
- Contact information (phone numbers, emails) - encourages on-platform communication
- Suspicious links and URLs
- "Too good to be true" offers

**Actions:**
- **Auto-reject**: High-confidence spam/inappropriate content (prevents posting)
- **Flag for review**: Medium-confidence issues (logs for admin review)
- **Spam score**: 0-100 score calculated for each listing

### ✅ Image Moderation (NSFW Detection)
**Uses:** Sightengine API (optional, requires API keys)

**Detects:**
- Nudity and sexual content
- Weapons
- Drugs
- Offensive symbols

**Actions:**
- **Auto-reject**: High-confidence NSFW content (>70%)
- **Flag for review**: Medium-confidence issues
- **Delete uploaded file**: Automatically removes inappropriate images

---

## How It Works

### Listing Creation
When a user creates a listing:
1. **Title moderation** - checks for spam/profanity
2. **Description moderation** - checks content quality
3. **Spam score calculation** - overall trust score
4. **Auto-reject** if spam score >= 70
5. **Flag for review** if spam score >= 40

### Image Upload
When an image is uploaded:
1. Upload to Supabase Storage
2. **NSFW detection** via Sightengine API (if configured)
3. **Auto-delete and reject** if NSFW confidence > 70%
4. **Flag for review** if NSFW detected but low confidence

### Message Sending
When sending a message:
1. **Text moderation** on content
2. **Auto-reject** spam/scam attempts
3. **Log warnings** for flagged content

---

## Configuration

### Text Moderation (No setup required)
Text moderation works out of the box with no API keys needed.

### NSFW Image Detection (Optional)

#### Option 1: Sightengine (Recommended)
**Free tier:** 500 images/month  
**Accuracy:** High (95%+)

1. Sign up at https://sightengine.com/
2. Get your API credentials
3. Add to `.env.local`:
```bash
SIGHTENGINE_API_USER=your_user_id
SIGHTENGINE_API_SECRET=your_api_secret
```

4. Restart your dev server

**If not configured:** NSFW detection will be skipped (fails safe - allows images)

#### Option 2: TensorFlow.js (Future)
Client-side NSFW detection using NSFWJS model (no API keys needed, runs in browser).

---

## Files Modified

### New Files Created:
- `lib/moderation.ts` - Text moderation utilities
- `lib/nsfw-detection.ts` - Image NSFW detection

### Modified Files:
- `app/api/listings/route.ts` - Added listing moderation
- `app/api/upload/route.ts` - Added image NSFW detection
- `app/api/messages/[id]/route.ts` - Added message moderation

---

## Testing

### Test Spam Detection
Try creating a listing with:
- Title: "SEND MONEY FIRST - GUARANTEED INCOME"
- Description: "Text me at 555-1234 for easy money"

Result: Should be auto-rejected with reasons.

### Test Profanity Filter
Try creating a listing or message with inappropriate language.

Result: Should be rejected.

### Test Contact Info Detection
Try including phone numbers or emails in messages.

Result: Will be flagged (warning logged).

---

## Admin Dashboard (TODO)

Future improvements:
- [ ] Build `/admin/moderation` page to review flagged content
- [ ] User strike system (3 strikes = temporary ban)
- [ ] Whitelist trusted users (bypass moderation)
- [ ] User reporting system
- [ ] Moderation statistics and analytics

---

## Customization

### Add More Spam Keywords
Edit `lib/moderation.ts` and add to `SPAM_KEYWORDS` array:
```typescript
const SPAM_KEYWORDS = [
  'your keyword here',
  'another scam phrase',
];
```

### Adjust Confidence Thresholds
In `lib/moderation.ts`:
```typescript
// Auto-reject if spam score >= 70 (lower = stricter)
if (spamScore >= 70) { ... }

// Flag for review if >= 40 (lower = more flagged)
const needsReview = spamScore >= 40;
```

In `lib/nsfw-detection.ts`:
```typescript
// Auto-reject if NSFW confidence > 70% (lower = stricter)
const shouldReject = maxConfidence > 0.7;
```

### Disable Moderation (Testing)
To temporarily disable moderation for testing:

**Text moderation:**
```typescript
// In lib/moderation.ts
export function moderateText(text: string): ModerationResult {
  return { isClean: true, flags: [], confidence: 'low', reasons: [] };
}
```

**NSFW detection:**
Don't add Sightengine API keys - it will auto-skip.

---

## Best Practices

### 1. Don't Be Too Strict
- False positives frustrate legitimate users
- Start lenient, tighten based on actual spam

### 2. Provide Clear Feedback
- Tell users WHY their content was rejected
- Show which keywords triggered the filter

### 3. Allow Appeals
- Add a "Report False Positive" button
- Have admins manually review appeals

### 4. Monitor Logs
- Check console logs for flagged content
- Adjust filters based on patterns

### 5. Privacy
- Don't store flagged content indefinitely
- Anonymize moderation logs

---

## Future Enhancements

### Short-term (1-2 weeks)
- [ ] User reporting system
- [ ] Admin moderation dashboard
- [ ] Email notifications for flagged content

### Medium-term (1-2 months)
- [ ] Strike system with auto-suspensions
- [ ] ML-based spam detection (learning from reports)
- [ ] Whitelist for trusted sellers

### Long-term (3+ months)
- [ ] TensorFlow.js client-side NSFW detection
- [ ] Advanced NLP for scam detection
- [ ] Multi-language support
- [ ] Community moderation (trusted users help moderate)

---

## Support

**Issue:** Images not being scanned for NSFW  
**Solution:** Check that `SIGHTENGINE_API_USER` and `SIGHTENGINE_API_SECRET` are set in `.env.local`

**Issue:** Too many false positives  
**Solution:** Increase thresholds in `lib/moderation.ts` (e.g., change 70 to 80)

**Issue:** Spam still getting through  
**Solution:** Add more keywords to `SPAM_KEYWORDS` array

---

**Last Updated:** November 7, 2025  
**Status:** Implemented and active
