-- RLS Policies for Transaction and Rating tables
-- Allow users to view and manage their own transactions and ratings

-- ============================================================
-- TRANSACTION TABLE RLS POLICIES
-- ============================================================

-- Enable RLS on Transaction table
ALTER TABLE "Transaction" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view transactions where they are buyer or seller
CREATE POLICY "Users can view their own transactions"
ON "Transaction"
FOR SELECT
USING (
  "buyerId" IN (SELECT "id" FROM "Profile" WHERE "supabaseId" = auth.uid()::text)
  OR "sellerId" IN (SELECT "id" FROM "Profile" WHERE "supabaseId" = auth.uid()::text)
);

-- Policy: Users can insert transactions (buyers creating transactions)
CREATE POLICY "Users can create transactions"
ON "Transaction"
FOR INSERT
WITH CHECK (
  "buyerId" IN (SELECT "id" FROM "Profile" WHERE "supabaseId" = auth.uid()::text)
);

-- Policy: Users can update their own transactions (for confirmation)
CREATE POLICY "Users can update their own transactions"
ON "Transaction"
FOR UPDATE
USING (
  "buyerId" IN (SELECT "id" FROM "Profile" WHERE "supabaseId" = auth.uid()::text)
  OR "sellerId" IN (SELECT "id" FROM "Profile" WHERE "supabaseId" = auth.uid()::text)
);

-- ============================================================
-- RATING TABLE RLS POLICIES
-- ============================================================

-- Enable RLS on Rating table
ALTER TABLE "Rating" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view ratings they gave or received
CREATE POLICY "Users can view their ratings"
ON "Rating"
FOR SELECT
USING (
  "reviewerId" IN (SELECT "id" FROM "Profile" WHERE "supabaseId" = auth.uid()::text)
  OR "revieweeId" IN (SELECT "id" FROM "Profile" WHERE "supabaseId" = auth.uid()::text)
);

-- Policy: Users can insert ratings (as reviewers)
CREATE POLICY "Users can create ratings"
ON "Rating"
FOR INSERT
WITH CHECK (
  "reviewerId" IN (SELECT "id" FROM "Profile" WHERE "supabaseId" = auth.uid()::text)
);

-- ============================================================
-- GRANT ACCESS TO VIEW
-- ============================================================

-- Grant access to the TransactionDetails view for authenticated users
GRANT SELECT ON "TransactionDetails" TO authenticated;

-- ============================================================
-- SUCCESS MESSAGE
-- ============================================================
DO $$
BEGIN
  RAISE NOTICE '✅ RLS policies created for Transaction and Rating tables!';
  RAISE NOTICE 'Users can now view and manage their own transactions and ratings';
END $$;
