# Transaction View Security Fix

## 🚨 Security Issue
The `TransactionDetails` view was defined with the `SECURITY DEFINER` property, which enforces Postgres permissions and RLS policies of the view creator rather than the querying user. This is a **critical security vulnerability** that could allow unauthorized access to transaction data.

## ✅ Solution Implemented

### 1. **Fixed View Definition**
- Removed `SECURITY DEFINER` behavior
- Added `security_invoker = true` to enforce querying user's permissions
- View now properly respects Row Level Security (RLS) policies

### 2. **Enabled RLS on Tables**
- Enabled RLS on `Transaction` table
- Enabled RLS on `Rating` table

### 3. **Comprehensive RLS Policies**

#### Transaction Policies:
- ✅ **View own transactions**: Users can only see transactions where they are buyer or seller
- ✅ **Create as buyer**: Users can create transactions as the buyer
- ✅ **Seller confirmation**: Sellers can update their confirmation status only
- ✅ **Buyer confirmation**: Buyers can update their confirmation status only
- ✅ **Admin access**: Admins and moderators can view all transactions

#### Rating Policies:
- ✅ **View transaction ratings**: Users can view ratings for their transactions
- ✅ **Public ratings view**: Authenticated users can view all ratings (for profile pages)
- ✅ **Create ratings**: Users can only rate completed transactions they participated in
- ✅ **Admin access**: Admins can view all ratings
- ✅ **No updates**: Ratings cannot be updated (only created)

### 4. **Helper Function**
Created `user_can_access_transaction()` function for API-level access checks.

## 📋 Implementation Steps

### Step 1: Apply the SQL Migration
```powershell
# Run the fix script in your Supabase SQL editor or via CLI
psql -h <your-db-host> -U postgres -d postgres -f supabase-fix-transaction-view-security.sql
```

Or via Supabase Dashboard:
1. Go to SQL Editor in Supabase Dashboard
2. Paste contents of `supabase-fix-transaction-view-security.sql`
3. Run the migration

### Step 2: Verify the Fix

#### Check View Security:
```sql
-- Verify the view uses security_invoker
SELECT 
  schemaname, 
  viewname, 
  viewowner,
  definition
FROM pg_views 
WHERE viewname = 'TransactionDetails';
```

#### Check RLS is Enabled:
```sql
-- Verify RLS is enabled on tables
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE tablename IN ('Transaction', 'Rating');
```

#### List All Policies:
```sql
-- View all policies on Transaction table
SELECT * FROM pg_policies WHERE tablename = 'Transaction';

-- View all policies on Rating table  
SELECT * FROM pg_policies WHERE tablename = 'Rating';
```

### Step 3: Test Access Control

#### Test 1: User Can View Own Transactions
```typescript
// User should only see their own transactions
const { data, error } = await supabase
  .from('TransactionDetails')
  .select('*');

// Should only return transactions where user is buyer or seller
```

#### Test 2: User Cannot View Other's Transactions
```typescript
// Try to access a specific transaction ID that doesn't belong to user
const { data, error } = await supabase
  .from('TransactionDetails')
  .select('*')
  .eq('id', OTHER_USER_TRANSACTION_ID);

// Should return empty result or error
```

#### Test 3: Seller Can Update Confirmation
```typescript
// As seller, update seller confirmation
const { data, error } = await supabase
  .from('Transaction')
  .update({ sellerConfirmed: true, sellerConfirmedAt: new Date() })
  .eq('id', TRANSACTION_ID)
  .eq('sellerId', USER_PROFILE_ID);

// Should succeed if user is seller
```

#### Test 4: User Cannot Update Other's Confirmation
```typescript
// As buyer, try to update seller confirmation
const { data, error } = await supabase
  .from('Transaction')
  .update({ sellerConfirmed: true })
  .eq('id', TRANSACTION_ID);

// Should fail - user can only update their own confirmation
```

#### Test 5: Admin Can View All Transactions
```typescript
// As admin user
const { data, error } = await supabase
  .from('TransactionDetails')
  .select('*');

// Should return all transactions
```

### Step 4: Update API Endpoints (If Needed)

Check your transaction-related API routes and ensure they don't bypass RLS:

```typescript
// ✅ GOOD - Respects RLS
const { data } = await supabase
  .from('TransactionDetails')
  .select('*')
  .eq('id', transactionId)
  .single();

// ❌ BAD - Would need additional checks
// Using service role key bypasses RLS
const { data } = await supabaseAdmin
  .from('Transaction')
  .select('*')
  .eq('id', transactionId)
  .single();
```

## 🔍 Files That May Need Review

Check these files for transaction queries:

1. **API Routes**:
   - `app/api/transactions/*` (if exists)
   - Any API routes that query `Transaction` or `TransactionDetails`

2. **Components**:
   - Transaction list/detail components
   - Rating submission components
   - Profile transaction history

3. **Server Actions**:
   - Any server-side transaction operations

## 🛡️ Security Best Practices

### DO ✅
- Use authenticated Supabase client (respects RLS)
- Verify user identity before operations
- Use the `user_can_access_transaction()` helper in server-side code
- Test with different user roles (buyer, seller, admin, unrelated user)
- Log access attempts in admin logs

### DON'T ❌
- Use service role/admin client for user-facing queries
- Trust client-side user IDs without verification
- Bypass RLS for convenience
- Create views with SECURITY DEFINER unless absolutely necessary
- Assume frontend validation is sufficient

## 📊 Testing Checklist

- [ ] Run the SQL migration successfully
- [ ] Verify RLS is enabled on Transaction table
- [ ] Verify RLS is enabled on Rating table
- [ ] Verify view uses `security_invoker = true`
- [ ] Test: User can view their own transactions
- [ ] Test: User cannot view other users' transactions
- [ ] Test: Seller can update seller confirmation only
- [ ] Test: Buyer can update buyer confirmation only
- [ ] Test: User can rate completed transactions
- [ ] Test: User cannot rate pending transactions
- [ ] Test: User cannot rate transactions they're not part of
- [ ] Test: Admin can view all transactions
- [ ] Test: Admin can view all ratings
- [ ] Review all API endpoints that use transactions
- [ ] Update any server-side code that bypasses RLS
- [ ] Test with multiple user accounts
- [ ] Test with suspended/banned accounts

## 🚀 Rollback Plan

If issues occur, you can temporarily disable RLS (NOT RECOMMENDED for production):

```sql
-- EMERGENCY ONLY - Disable RLS temporarily
ALTER TABLE "Transaction" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Rating" DISABLE ROW LEVEL SECURITY;

-- Then investigate and fix the issue
-- Re-enable when fixed
ALTER TABLE "Transaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Rating" ENABLE ROW LEVEL SECURITY;
```

## 📝 Notes

- The view will now respect all RLS policies on underlying tables
- Users with `admin` or `moderator` role have special policies for broader access
- The `user_can_access_transaction()` function can be used in server-side code for additional checks
- All existing triggers and functions remain functional
- Rating stats and auto-completion features are unaffected

## 🔗 Related Files

- `supabase-fix-transaction-view-security.sql` - The fix migration
- `supabase-transaction-rating.sql` - Original transaction system
- `supabase-transaction-rls.sql` - Additional RLS policies (if exists)
- `lib/admin-middleware.ts` - Admin authentication helpers

## ⚠️ Important Reminders

1. **Always test in development first** before applying to production
2. **Backup your database** before running migrations
3. **Monitor logs** after deployment for access denied errors
4. **Update API documentation** if access patterns change
5. **Inform your team** about the security changes

## 📞 Need Help?

If you encounter issues:
1. Check Supabase logs for RLS policy violations
2. Verify user's profile ID matches their supabaseId
3. Ensure auth.uid() returns expected values
4. Test with SQL queries directly in Supabase SQL editor
5. Review policy definitions for logic errors
