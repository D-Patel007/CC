-- Fix incorrect seller IDs in Transaction table
-- The transactions were created with sellerId = 1 instead of 1401
-- This happened because the listing had the wrong seller ID

-- First, check what we have
SELECT "id", "sellerId", "buyerId", "listingId" FROM "Transaction";

-- Update all transactions with sellerId = 1 to sellerId = 1401
UPDATE "Transaction"
SET "sellerId" = 1401
WHERE "sellerId" = 1;

-- Verify the fix
SELECT "id", "sellerId", "buyerId", "listingId" FROM "Transaction";

-- Also check and fix the Listing table if needed
SELECT "id", "sellerId", "title" FROM "Listing" WHERE "sellerId" = 1;

-- Update listings too
UPDATE "Listing"
SET "sellerId" = 1401
WHERE "sellerId" = 1;

-- Verify
SELECT "id", "sellerId", "title" FROM "Listing" WHERE "sellerId" = 1401;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Fixed seller IDs: Changed 1 → 1401';
END $$;
