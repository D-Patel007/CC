# RLS Performance Optimization Guide

## 📊 Overview

Your database has **117 performance warnings** from Supabase's linter, primarily related to Row Level Security (RLS) policy optimization.

### Issues Identified

1. **Auth RLS Init Plan** (47 warnings): Policies that re-evaluate `auth.uid()` for every row
2. **Multiple Permissive Policies** (70 warnings): Duplicate policies for same role/action combinations

### Impact

- **Current**: Queries scan every row and call `auth.uid()` repeatedly
- **After Fix**: Auth function called once, result cached and reused
- **Performance Gain**: 10-100x faster queries on tables with many rows

---

## 🔧 The Fix

### Problem
```sql
-- ❌ BAD: Calls auth.uid() for EVERY row
WHERE "userId" = (SELECT id FROM "Profile" WHERE "supabaseId" = auth.uid()::text)
```

### Solution
```sql
-- ✅ GOOD: Calls auth.uid() ONCE, Postgres caches result
WHERE "userId" = (SELECT id FROM "Profile" WHERE "supabaseId" = (select auth.uid()::text))
```

The nested `(select ...)` tells Postgres to evaluate once and cache.

---

## 📋 Implementation Plan

Due to the large number of warnings (117), I'll create:

1. **Automated migration script** - Drops and recreates all policies with optimized syntax
2. **Policy consolidation** - Merges duplicate policies into single efficient ones
3. **Verification queries** - Check all policies are optimized

### Tables Affected

- Profile (6 policies)
- Listing (9 policies)
- Event (3 policies)
- EventAttendee (2 policies)
- Conversation (3 policies)
- Message (4 policies)
- Notification (3 policies)
- Transaction (5 policies)
- Rating (3 policies)
- ProhibitedItem (2 policies)
- FlaggedContent (2 policies)
- UserStrike (3 policies)
- ModerationLog (2 policies)
- UserReport (4 policies)
- Category (duplicate policies)

---

## ⚠️ Important Notes

### This is a MAJOR refactoring

- **70+ policies will be dropped and recreated**
- **Test thoroughly in development first**
- **Backup your database before applying**
- **Expect 5-10 minutes to run**

### Breaking Changes

Some duplicate policies will be removed - if your app explicitly relies on specific policy names, you'll need to update references.

---

## 🚀 Quick Apply

I'll create a comprehensive migration script that:
1. Optimizes all `auth.uid()` calls
2. Consolidates duplicate policies
3. Adds performance comments

The migration will be idempotent (safe to run multiple times).

---

## 📈 Expected Results

**Before:**
- 117 performance warnings
- Slow queries on large tables
- Multiple policy evaluations per query

**After:**
- 0 performance warnings  
- 10-100x faster RLS checks
- Single policy per role/action
- Cached auth function calls

---

## Next Steps

Given the scope (117 warnings), would you like me to:

**Option A**: Create a comprehensive auto-migration script (recommended)
- Automatically fix all 117 warnings
- Takes 10-15 minutes to prepare
- Single script to run

**Option B**: Create manual fix guide
- Step-by-step instructions
- You manually update each policy
- Time-intensive but more control

**Option C**: Fix high-priority tables first
- Start with most-used tables (Listing, Profile, Message)
- Incremental approach
- Lower risk

Let me know which approach you prefer, and I'll create the appropriate migration!
