# 🛡️ Admin Moderation System - Complete Guide

## Overview

Your marketplace now has a comprehensive moderation system with:
- ✅ **Prohibited Items Database** - Manage banned keywords, patterns, and categories
- ✅ **AI + Manual Moderation Pipeline** - Auto-detect and flag inappropriate content
- ✅ **Admin Dashboard** - Review queue, takedown tools, and analytics
- ✅ **User Strike System** - Track violations and auto-suspend repeat offenders
- ✅ **User Reporting** - Let users report problematic content
- ✅ **Audit Logging** - Track all admin actions

---

## 🚀 Quick Start

### 1. Run Database Migration

Open Supabase SQL Editor and run:
```sql
-- File: supabase-moderation-system.sql
```

This creates:
- `ProhibitedItem` - Banned keywords/patterns
- `FlaggedContent` - Moderation queue
- `UserStrike` - Violation tracking
- `ModerationLog` - Admin action audit log
- `UserReport` - User-submitted reports

### 2. Set Your First Admin

In Supabase SQL Editor:
```sql
UPDATE "Profile" 
SET "role" = 'admin', "isAdmin" = TRUE 
WHERE "supabaseId" = 'YOUR_SUPABASE_USER_ID';
```

Or by email (if you've logged in):
```sql
UPDATE "Profile" 
SET "role" = 'admin', "isAdmin" = TRUE 
WHERE "supabaseId" = (
  SELECT id FROM auth.users WHERE email = 'your@email.com'
);
```

### 3. Access Admin Dashboard

Navigate to:
```
http://localhost:3000/admin/moderation
```

You should see the moderation queue!

---

## 📋 Admin Routes

| Route | Description |
|-------|-------------|
| `/admin/moderation` | Moderation queue and flag review |
| `/admin/prohibited-items` | Manage prohibited items list |
| `/admin/stats` | Metrics and analytics (API) |

---

## 🔧 API Endpoints

### Admin-Only Endpoints

#### 1. Prohibited Items (`/api/admin/prohibited-items`)

**GET** - List all prohibited items
```javascript
// Query params: isActive, type, severity, category
fetch('/api/admin/prohibited-items?isActive=true&severity=high')
```

**POST** - Create new prohibited item
```javascript
fetch('/api/admin/prohibited-items', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'keyword',        // 'keyword' | 'regex' | 'category' | 'url_pattern'
    pattern: 'viagra',
    severity: 'high',       // 'low' | 'medium' | 'high' | 'critical'
    action: 'auto_reject',  // 'flag' | 'auto_reject' | 'warn'
    category: 'drugs',
    description: 'Prescription medication'
  })
})
```

**PATCH** - Update prohibited item
```javascript
fetch('/api/admin/prohibited-items', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: 123,
    isActive: false  // Disable this rule
  })
})
```

**DELETE** - Remove prohibited item
```javascript
fetch('/api/admin/prohibited-items?id=123', {
  method: 'DELETE'
})
```

#### 2. Flagged Content (`/api/admin/flagged-content`)

**GET** - List flagged content
```javascript
// Query params: status, contentType, severity, source
fetch('/api/admin/flagged-content?status=pending&severity=high')
```

**PATCH** - Review flagged content
```javascript
fetch('/api/admin/flagged-content', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: 456,
    status: 'rejected',     // 'approved' | 'rejected' | 'deleted'
    reviewNotes: 'Scam listing',
    deleteContent: true,    // Delete the actual listing/message
    issueStrike: true       // Give user a strike
  })
})
```

#### 3. Stats (`/api/admin/stats`)

**GET** - Get moderation statistics
```javascript
fetch('/api/admin/stats')
// Returns: overview, severity breakdown, content types, top violators, recent actions
```

### Public Endpoints

#### User Reports (`/api/reports`)

**POST** - Submit a report
```javascript
fetch('/api/reports', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contentType: 'listing',  // 'listing' | 'message' | 'profile' | 'event'
    contentId: 789,
    category: 'scam',        // 'scam', 'spam', 'inappropriate', etc.
    description: 'This listing is clearly a scam'
  })
})
```

**GET** - View your own reports
```javascript
fetch('/api/reports')
```

---

## 🎯 Moderation Pipeline

### How Auto-Moderation Works

1. **User creates listing/message**
2. **Text moderation runs**
   - Checks built-in spam/scam keywords
   - Checks database `ProhibitedItem` table
   - Calculates spam score
3. **AI Image moderation** (if image uploaded)
   - NSFW detection via Sightengine API
4. **Action taken:**
   - ✅ **Auto-approve** - Clean content
   - ⚠️ **Flag for review** - Suspicious but not certain
   - 🚫 **Auto-reject** - High confidence spam/prohibited

### Prohibited Item Types

| Type | Description | Example |
|------|-------------|---------|
| `keyword` | Exact text match | `gun`, `stolen`, `fake` |
| `regex` | Pattern matching | `\b\d{3}-\d{3}-\d{4}\b` (phone numbers) |
| `category` | Item category ban | `weapons`, `drugs` |
| `url_pattern` | URL matching | `bit\.ly`, `tinyurl` |

### Severity Levels

| Severity | Usage | Action |
|----------|-------|--------|
| `critical` | Illegal content, weapons, drugs | Auto-reject |
| `high` | Scams, hate speech | Flag or auto-reject |
| `medium` | Spam, contact info | Flag for review |
| `low` | Minor violations | Warn user |

### Actions

| Action | Description |
|--------|-------------|
| `auto_reject` | Immediately reject content creation |
| `flag` | Create flagged content record for admin review |
| `warn` | Allow content but log warning |

---

## 👥 User Strike System

### How It Works

1. **Admin reviews flagged content** → Issues strike
2. **User accumulates strikes**
3. **3+ active strikes** → Automatic 7-day suspension
4. **Strikes can be revoked** → Set `isActive = FALSE`

### Strike Severities

- **Minor** - First offense, accidental violations
- **Major** - Repeated violations, scams
- **Severe** - Illegal content, harassment

### Viewing User Strikes

```sql
-- Get user's strike count
SELECT COUNT(*) 
FROM "UserStrike" 
WHERE "userId" = 123 AND "isActive" = TRUE;

-- Get user's strike history
SELECT * 
FROM "UserStrike" 
WHERE "userId" = 123 
ORDER BY "createdAt" DESC;
```

---

## 📊 Database Schema

### Profile (Updated)
```typescript
{
  // ... existing fields ...
  role: 'user' | 'admin' | 'moderator'
  isAdmin: boolean
  isSuspended: boolean
  suspendedUntil: timestamp | null
  suspensionReason: string | null
}
```

### ProhibitedItem
```typescript
{
  id: number
  type: 'keyword' | 'regex' | 'category' | 'url_pattern'
  pattern: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  action: 'flag' | 'auto_reject' | 'warn'
  category: string | null
  description: string | null
  isActive: boolean
  createdBy: number | null
  createdAt: timestamp
  updatedAt: timestamp
}
```

### FlaggedContent
```typescript
{
  id: number
  contentType: 'listing' | 'message' | 'profile' | 'event'
  contentId: number
  userId: number
  reason: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending' | 'approved' | 'rejected' | 'deleted'
  source: 'auto' | 'user_report' | 'admin'
  details: json
  reviewedBy: number | null
  reviewedAt: timestamp | null
  reviewNotes: string | null
  createdAt: timestamp
  updatedAt: timestamp
}
```

### UserStrike
```typescript
{
  id: number
  userId: number
  reason: string
  severity: 'minor' | 'major' | 'severe'
  flaggedContentId: number | null
  issuedBy: number | null
  notes: string | null
  isActive: boolean
  createdAt: timestamp
}
```

---

## 🔐 Security & Permissions

### Role-Based Access Control (RBAC)

- **`user`** - Normal users (default)
- **`moderator`** - Can review flags, cannot manage prohibited items
- **`admin`** - Full access to all moderation tools

### RLS Policies

All moderation tables have Row Level Security enabled:
- ✅ Admins/moderators can view and manage
- ✅ Users can view their own strikes and reports
- ❌ Normal users cannot access moderation data

---

## 🎨 Adding Report Button to Your App

### On Listing Detail Page

```tsx
import ReportButton from '@/components/ReportButton'

<ReportButton 
  contentType="listing" 
  contentId={listing.id} 
  size="md"
/>
```

### On Messages

```tsx
<ReportButton 
  contentType="message" 
  contentId={message.id} 
  size="sm"
/>
```

### On Profiles

```tsx
<ReportButton 
  contentType="profile" 
  contentId={profile.id} 
/>
```

---

## 📈 Monitoring & Metrics

### View Stats

```javascript
const stats = await fetch('/api/admin/stats').then(r => r.json())

console.log(stats.data.overview)
// {
//   totalFlags: 42,
//   pendingFlags: 12,
//   deletedContent: 8,
//   activeStrikes: 15,
//   suspendedUsers: 3,
//   flagsToday: 5
// }
```

### Top Metrics to Monitor

1. **Pending flags** - Keep this under 20
2. **Auto-reject rate** - Should be < 5% of total content
3. **User strike distribution** - Identify problematic users
4. **Response time** - How long flags sit pending
5. **False positive rate** - Approved flags / total flags

---

## 🧪 Testing

### Test Auto-Moderation

Create a listing with prohibited content:
```
Title: "SEND MONEY FIRST - Guaranteed Income!"
Description: "Wire transfer only. Text me at 555-1234"
```

Expected: Auto-rejected or flagged

### Test User Reporting

1. Create a normal listing
2. Click "🚩 Report" button
3. Select category and submit
4. Check admin dashboard for new report

### Test Admin Review

1. Go to `/admin/moderation`
2. View pending flags
3. Click "Review" on an item
4. Choose action (approve/reject/delete)
5. Optionally issue strike

---

## 🔧 Configuration

### Default Prohibited Items

The system comes with 50+ pre-configured prohibited items:
- ✅ Weapons (guns, knives, etc.)
- ✅ Drugs (marijuana, pills, etc.)
- ✅ Alcohol (beer, vodka, etc.)
- ✅ Scam keywords (wire transfer, gift cards)
- ✅ Contact info patterns (phone numbers, emails)

### Adding Custom Prohibited Items

Via admin dashboard or SQL:
```sql
INSERT INTO "ProhibitedItem" (
  type, pattern, severity, action, category, description
) VALUES (
  'keyword', 
  'your_banned_word', 
  'high', 
  'auto_reject', 
  'custom', 
  'Description of why it is banned'
);
```

### Adjusting Auto-Suspension Threshold

Edit in SQL:
```sql
-- Current: 3 strikes = suspension
-- Change to 5 strikes:
CREATE OR REPLACE FUNCTION check_strike_threshold()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  strike_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO strike_count
  FROM "UserStrike"
  WHERE "userId" = NEW."userId"
  AND "isActive" = TRUE;

  IF strike_count >= 5 THEN  -- Changed from 3 to 5
    UPDATE "Profile"
    SET "isSuspended" = TRUE,
        "suspendedUntil" = NOW() + INTERVAL '7 days'
    WHERE "id" = NEW."userId";
  END IF;

  RETURN NEW;
END;
$$;
```

---

## 🚨 Common Issues

### "Forbidden - Admin access required"

**Solution:** Make sure you've set your user role to admin:
```sql
UPDATE "Profile" 
SET "role" = 'admin', "isAdmin" = TRUE 
WHERE "supabaseId" = 'YOUR_SUPABASE_USER_ID';
```

### Prohibited items not being enforced

**Solution:** Check that `isActive = TRUE` on the prohibited item:
```sql
SELECT * FROM "ProhibitedItem" WHERE "isActive" = FALSE;
```

### User not getting auto-suspended

**Solution:** Check trigger exists:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'auto_suspend_on_strikes';
```

### Stats not updating

**Solution:** Refresh materialized view:
```sql
SELECT refresh_moderation_stats();
```

---

## 📚 Best Practices

### 1. Review Pending Flags Daily
- Set aside 10-15 minutes each day
- Prioritize by severity (critical → high → medium → low)

### 2. Document Your Decisions
- Always add review notes
- Helps with consistency and appeals

### 3. Be Consistent
- Create internal guidelines
- Same violation = same punishment

### 4. Monitor False Positives
- Track approved flags
- Adjust prohibited items if needed

### 5. Communicate with Users
- Send email when issuing strikes
- Explain what they did wrong
- Give path to improvement

### 6. Regular Audits
- Review moderation logs monthly
- Check for admin abuse
- Update prohibited items list

---

## 🎯 Next Steps

### Recommended Enhancements

1. **Email Notifications**
   - Notify admins of new flags
   - Email users when they get strikes
   - Send suspension notices

2. **Appeal System**
   - Let users appeal strikes
   - Admin reviews appeals
   - Revoke invalid strikes

3. **Automated Reports**
   - Daily/weekly email with stats
   - Trends and patterns
   - Top violators

4. **Improved UI**
   - Bulk actions (approve/reject multiple)
   - Content preview in modal
   - Better filtering/search

5. **Machine Learning**
   - Train on flagged content
   - Improve auto-detection
   - Reduce false positives

---

## 📞 Support

Need help?
- Check this guide first
- Review Supabase logs for errors
- Test with console.log debugging
- Check browser Network tab for API errors

---

**Status:** ✅ Complete and Ready to Use  
**Last Updated:** November 7, 2025  
**Version:** 1.0.0
