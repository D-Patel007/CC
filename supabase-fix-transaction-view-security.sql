-- ============================================================
-- FIX: TransactionDetails View Security Issue
-- Date: November 10, 2025
-- Purpose: Remove SECURITY DEFINER and implement proper RLS policies
-- ============================================================

-- Drop the existing view
DROP VIEW IF EXISTS "TransactionDetails";

-- Recreate the view WITHOUT SECURITY DEFINER
-- This view will respect RLS policies on the underlying tables
CREATE OR REPLACE VIEW "TransactionDetails" 
WITH (security_invoker = true)
AS
SELECT 
  t."id",
  t."listingId",
  t."price",
  t."meetupLocation",
  t."meetupDate",
  t."sellerConfirmed",
  t."buyerConfirmed",
  t."isCompleted",
  t."completedAt",
  t."receiptSent",
  t."createdAt",
  
  -- Listing info
  l."title" as "listingTitle",
  l."imageUrl" as "listingImage",
  
  -- Seller info
  t."sellerId",
  seller."name" as "sellerName",
  seller."avatarUrl" as "sellerAvatar",
  
  -- Buyer info
  t."buyerId",
  buyer."name" as "buyerName",
  buyer."avatarUrl" as "buyerAvatar",
  
  -- Ratings (if submitted)
  seller_rating."score" as "sellerRatingScore",
  seller_rating."review" as "sellerRatingReview",
  buyer_rating."score" as "buyerRatingScore",
  buyer_rating."review" as "buyerRatingReview"
  
FROM "Transaction" t
JOIN "Listing" l ON t."listingId" = l."id"
JOIN "Profile" seller ON t."sellerId" = seller."id"
JOIN "Profile" buyer ON t."buyerId" = buyer."id"
LEFT JOIN "Rating" seller_rating ON seller_rating."transactionId" = t."id" AND seller_rating."reviewerId" = t."sellerId"
LEFT JOIN "Rating" buyer_rating ON buyer_rating."transactionId" = t."id" AND buyer_rating."reviewerId" = t."buyerId";

-- ============================================================
-- ENABLE RLS ON UNDERLYING TABLES (if not already enabled)
-- ============================================================
ALTER TABLE "Transaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Rating" ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- CREATE RLS POLICIES FOR TRANSACTION TABLE
-- ============================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own transactions" ON "Transaction";
DROP POLICY IF EXISTS "Users can create transactions as buyer or seller" ON "Transaction";
DROP POLICY IF EXISTS "Sellers can update their confirmation" ON "Transaction";
DROP POLICY IF EXISTS "Buyers can update their confirmation" ON "Transaction";
DROP POLICY IF EXISTS "Admins can view all transactions" ON "Transaction";

-- Policy: Users can view transactions where they are buyer or seller
CREATE POLICY "Users can view their own transactions" 
ON "Transaction"
FOR SELECT
TO authenticated
USING (
  "sellerId" = (
    SELECT id FROM "Profile" 
    WHERE "supabaseId" = auth.uid()::text
  )
  OR "buyerId" = (
    SELECT id FROM "Profile" 
    WHERE "supabaseId" = auth.uid()::text
  )
);

-- Policy: Users can create transactions as buyer
CREATE POLICY "Users can create transactions as buyer" 
ON "Transaction"
FOR INSERT
TO authenticated
WITH CHECK (
  "buyerId" = (
    SELECT id FROM "Profile" 
    WHERE "supabaseId" = auth.uid()::text
  )
);

-- Policy: Sellers can update their confirmation status
CREATE POLICY "Sellers can update their confirmation" 
ON "Transaction"
FOR UPDATE
TO authenticated
USING (
  "sellerId" = (
    SELECT id FROM "Profile" 
    WHERE "supabaseId" = auth.uid()::text
  )
)
WITH CHECK (
  "sellerId" = (
    SELECT id FROM "Profile" 
    WHERE "supabaseId" = auth.uid()::text
  )
);

-- Policy: Buyers can update their confirmation status  
CREATE POLICY "Buyers can update their confirmation" 
ON "Transaction"
FOR UPDATE
TO authenticated
USING (
  "buyerId" = (
    SELECT id FROM "Profile" 
    WHERE "supabaseId" = auth.uid()::text
  )
)
WITH CHECK (
  "buyerId" = (
    SELECT id FROM "Profile" 
    WHERE "supabaseId" = auth.uid()::text
  )
);

-- Policy: Admins and moderators can view all transactions
CREATE POLICY "Admins can view all transactions" 
ON "Transaction"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "Profile"
    WHERE "supabaseId" = auth.uid()::text
    AND "role" IN ('admin', 'moderator')
  )
);

-- ============================================================
-- CREATE RLS POLICIES FOR RATING TABLE
-- ============================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view ratings for their transactions" ON "Rating";
DROP POLICY IF EXISTS "Users can create ratings for completed transactions" ON "Rating";
DROP POLICY IF EXISTS "Public can view ratings" ON "Rating";
DROP POLICY IF EXISTS "Admins can view all ratings" ON "Rating";

-- Policy: Users can view ratings where they are involved in the transaction
CREATE POLICY "Users can view ratings for their transactions" 
ON "Rating"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "Transaction" t
    WHERE t."id" = "Rating"."transactionId"
    AND (
      t."sellerId" = (SELECT id FROM "Profile" WHERE "supabaseId" = auth.uid()::text)
      OR t."buyerId" = (SELECT id FROM "Profile" WHERE "supabaseId" = auth.uid()::text)
    )
  )
);

-- Policy: Public can view ratings (for profile pages)
CREATE POLICY "Public can view ratings" 
ON "Rating"
FOR SELECT
TO authenticated
USING (true);

-- Policy: Users can create ratings for completed transactions where they are involved
CREATE POLICY "Users can create ratings for completed transactions" 
ON "Rating"
FOR INSERT
TO authenticated
WITH CHECK (
  -- Must be the reviewer
  "reviewerId" = (
    SELECT id FROM "Profile" 
    WHERE "supabaseId" = auth.uid()::text
  )
  AND
  -- Transaction must be completed
  EXISTS (
    SELECT 1 FROM "Transaction" t
    WHERE t."id" = "transactionId"
    AND t."isCompleted" = true
    AND (
      -- Must be buyer or seller in the transaction
      t."sellerId" = "reviewerId" 
      OR t."buyerId" = "reviewerId"
    )
  )
);

-- Policy: Admins can view all ratings
CREATE POLICY "Admins can view all ratings" 
ON "Rating"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "Profile"
    WHERE "supabaseId" = auth.uid()::text
    AND "role" IN ('admin', 'moderator')
  )
);

-- ============================================================
-- GRANT NECESSARY PERMISSIONS
-- ============================================================

-- Grant access to authenticated users
GRANT SELECT ON "TransactionDetails" TO authenticated;
GRANT SELECT, INSERT, UPDATE ON "Transaction" TO authenticated;
GRANT SELECT, INSERT ON "Rating" TO authenticated;

-- Grant sequence usage for ID generation
GRANT USAGE, SELECT ON SEQUENCE "Transaction_id_seq" TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE "Rating_id_seq" TO authenticated;

-- ============================================================
-- CREATE HELPER FUNCTION FOR CHECKING TRANSACTION ACCESS
-- ============================================================

-- Function to check if user has access to a transaction (used in API)
CREATE OR REPLACE FUNCTION user_can_access_transaction(transaction_id INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  user_profile_id INTEGER;
  has_access BOOLEAN;
BEGIN
  -- Get current user's profile ID
  SELECT id INTO user_profile_id
  FROM "Profile"
  WHERE "supabaseId" = auth.uid()::text;
  
  IF user_profile_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user is buyer or seller, or is admin/moderator
  SELECT EXISTS (
    SELECT 1 FROM "Transaction" t
    LEFT JOIN "Profile" p ON p.id = user_profile_id
    WHERE t.id = transaction_id
    AND (
      t."sellerId" = user_profile_id
      OR t."buyerId" = user_profile_id
      OR p."role" IN ('admin', 'moderator')
    )
  ) INTO has_access;
  
  RETURN has_access;
END;
$$;

-- ============================================================
-- ADD COMMENTS FOR DOCUMENTATION
-- ============================================================

COMMENT ON VIEW "TransactionDetails" IS 'Secure view of transaction details with proper RLS enforcement. Uses security_invoker to respect row-level policies.';
COMMENT ON FUNCTION user_can_access_transaction IS 'Helper function to check if current user can access a specific transaction';

-- ============================================================
-- SUCCESS MESSAGE
-- ============================================================
DO $$
BEGIN
  RAISE NOTICE '✅ TransactionDetails view security fixed!';
  RAISE NOTICE 'Changes:';
  RAISE NOTICE '  - Removed SECURITY DEFINER';
  RAISE NOTICE '  - Added security_invoker = true';
  RAISE NOTICE '  - Enabled RLS on Transaction and Rating tables';
  RAISE NOTICE '  - Created comprehensive RLS policies';
  RAISE NOTICE '  - Added helper function for access checks';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANT: Test all transaction-related features to ensure proper access control';
END $$;
