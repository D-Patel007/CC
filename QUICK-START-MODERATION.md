# ✅ Quick Start Checklist

## 🚀 5-Minute Setup

Follow these steps to activate your moderation system:

### Step 1: Database Migration ⏱️ 2 minutes

1. Open **Supabase Dashboard** → SQL Editor
2. Copy contents of `supabase-moderation-system.sql`
3. Paste and click **Run**
4. Wait for "Success" message

**Expected Output:**
```
Successfully created 6 tables
Successfully inserted 50+ prohibited items
Successfully created RLS policies
```

---

### Step 2: Set Admin Role ⏱️ 1 minute

**Option A: By Email** (Recommended)
```sql
UPDATE "Profile" 
SET "role" = 'admin', "isAdmin" = TRUE 
WHERE "supabaseId" = (
  SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL@example.com'
);
```

**Option B: By Supabase ID**
```sql
UPDATE "Profile" 
SET "role" = 'admin', "isAdmin" = TRUE 
WHERE "supabaseId" = 'YOUR_SUPABASE_USER_ID';
```

**How to find your Supabase ID:**
1. Log into your app
2. Open browser console
3. Run: `localStorage.getItem('sb-YOUR_PROJECT_REF-auth-token')`
4. Find the `user.id` field

**Verify it worked:**
```sql
SELECT id, name, email, role, isAdmin 
FROM "Profile" 
WHERE "role" = 'admin';
```

---

### Step 3: Test Access ⏱️ 1 minute

1. Open your app: `http://localhost:3000`
2. Navigate to: `/admin/moderation`
3. You should see the admin dashboard!

**If you see "Forbidden":**
- Double-check Step 2 was successful
- Log out and log back in
- Clear browser cache

---

### Step 4: Add Report Buttons ⏱️ 1 minute

**On Listing Detail Page:**

Find your listing detail component (probably in `app/listings/[id]/page.tsx`)

Add this import:
```tsx
import ReportButton from '@/components/ReportButton'
```

Add this button (place it near the listing title):
```tsx
<ReportButton 
  contentType="listing" 
  contentId={listing.id} 
  size="md"
/>
```

**On Messages:**

In your messages component:
```tsx
<ReportButton 
  contentType="message" 
  contentId={message.id} 
  size="sm"
/>
```

---

## ✅ Verification Tests

### Test 1: Auto-Moderation
1. Try creating a listing with this title: `SEND MONEY FIRST - GUARANTEED INCOME`
2. **Expected:** Should be auto-rejected or flagged
3. Check `/admin/moderation` for the flagged content

### Test 2: User Reporting
1. Create a normal listing
2. Click the 🚩 Report button
3. Select "Scam" category
4. Submit report
5. **Expected:** Report appears in database
6. Create 2 more reports on same listing (from different accounts if possible)
7. **Expected:** After 3 reports, auto-creates flagged content

### Test 3: Admin Review
1. Go to `/admin/moderation`
2. Click "Review" on a flagged item
3. Try each action:
   - ✅ Approve
   - ⚠️ Reject
   - 🚨 Reject + Strike
   - 🗑️ Delete + Strike
4. **Expected:** Actions work, stats update

### Test 4: Strike System
1. Give a test user 3 strikes (via admin dashboard)
2. Check their profile:
   ```sql
   SELECT isSuspended, suspendedUntil, suspensionReason 
   FROM "Profile" 
   WHERE id = TEST_USER_ID;
   ```
3. **Expected:** `isSuspended = TRUE`, `suspendedUntil` set

### Test 5: Prohibited Items
1. Add a custom prohibited item via SQL:
   ```sql
   INSERT INTO "ProhibitedItem" (type, pattern, severity, action, category)
   VALUES ('keyword', 'test_banned_word', 'high', 'auto_reject', 'test');
   ```
2. Try creating content with "test_banned_word"
3. **Expected:** Auto-rejected

---

## 📊 Check Your Stats

Visit the admin dashboard and verify you see:
- ✅ Total Flags count
- ✅ Pending Flags count
- ✅ Severity breakdown
- ✅ Content type breakdown
- ✅ Recent actions list

---

## 🎯 What to Monitor Daily

### Daily Tasks (5-10 minutes):
- [ ] Check pending flags count
- [ ] Review 2-3 flagged items
- [ ] Check for new user reports
- [ ] Look at stats for unusual patterns

### Weekly Tasks (15-20 minutes):
- [ ] Review moderation logs
- [ ] Check top violators
- [ ] Adjust prohibited items if needed
- [ ] Review false positive rate

---

## 🚨 Troubleshooting

### "403 Forbidden" on admin page
```sql
-- Verify your role is admin
SELECT role, isAdmin FROM "Profile" WHERE supabaseId = auth.uid();

-- If not admin, run:
UPDATE "Profile" SET role = 'admin', isAdmin = TRUE WHERE supabaseId = auth.uid();
```

### No items in prohibited items table
```sql
-- Check count
SELECT COUNT(*) FROM "ProhibitedItem";

-- If 0, re-run the INSERT statements from supabase-moderation-system.sql
```

### Stats not showing
```sql
-- Refresh the stats view
SELECT refresh_moderation_stats();

-- Check if function exists
SELECT * FROM pg_proc WHERE proname = 'refresh_moderation_stats';
```

### Strikes not auto-suspending
```sql
-- Check trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'auto_suspend_on_strikes';

-- Re-create if missing (from supabase-moderation-system.sql)
```

---

## 🎉 You're Done!

Your moderation system is now live. Key features:
- ✅ Auto-moderation pipeline
- ✅ Admin dashboard
- ✅ User reporting
- ✅ Strike system
- ✅ Prohibited items management

**Next Steps:**
1. Read full guide: `ADMIN-MODERATION-GUIDE.md`
2. Review architecture: `MODERATION-ARCHITECTURE.md`
3. Customize prohibited items for your needs
4. Monitor daily and adjust as needed

---

## 📞 Need Help?

1. Check `ADMIN-MODERATION-GUIDE.md` for detailed instructions
2. Review error logs in browser console
3. Check Supabase logs for database errors
4. Verify RLS policies are enabled

---

**Estimated Total Time:** 5-10 minutes
**Difficulty:** Easy
**Status:** ✅ Ready to Use
