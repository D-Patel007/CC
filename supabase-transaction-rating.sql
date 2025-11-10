-- Migration: Post-Transaction Verification & Rating System
-- Date: November 6, 2025
-- Purpose: Add transaction confirmation, ratings, and email receipts for trust & accountability

-- ============================================================
-- 1. CREATE TRANSACTION TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS "Transaction" (
  "id" SERIAL PRIMARY KEY,
  "listingId" INTEGER NOT NULL REFERENCES "Listing"("id") ON DELETE CASCADE,
  "sellerId" INTEGER NOT NULL REFERENCES "Profile"("id") ON DELETE CASCADE,
  "buyerId" INTEGER NOT NULL REFERENCES "Profile"("id") ON DELETE CASCADE,
  
  -- Transaction details
  "price" DECIMAL(10, 2) NOT NULL,
  "meetupLocation" TEXT,
  "meetupDate" TIMESTAMPTZ,
  
  -- Confirmation status
  "sellerConfirmed" BOOLEAN DEFAULT FALSE,
  "buyerConfirmed" BOOLEAN DEFAULT FALSE,
  "sellerConfirmedAt" TIMESTAMPTZ,
  "buyerConfirmedAt" TIMESTAMPTZ,
  
  -- Completion
  "isCompleted" BOOLEAN DEFAULT FALSE,
  "completedAt" TIMESTAMPTZ,
  
  -- Email receipt
  "receiptSent" BOOLEAN DEFAULT FALSE,
  "receiptSentAt" TIMESTAMPTZ,
  
  -- Timestamps
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. CREATE RATING TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS "Rating" (
  "id" SERIAL PRIMARY KEY,
  "transactionId" INTEGER NOT NULL REFERENCES "Transaction"("id") ON DELETE CASCADE,
  "reviewerId" INTEGER NOT NULL REFERENCES "Profile"("id") ON DELETE CASCADE,
  "revieweeId" INTEGER NOT NULL REFERENCES "Profile"("id") ON DELETE CASCADE,
  
  -- Rating details
  "score" INTEGER NOT NULL CHECK ("score" >= 1 AND "score" <= 5),
  "review" TEXT,
  
  -- Timestamps
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one rating per person per transaction
  UNIQUE("transactionId", "reviewerId")
);

-- ============================================================
-- 3. ADD RATING STATS TO PROFILE TABLE
-- ============================================================
ALTER TABLE "Profile"
ADD COLUMN IF NOT EXISTS "averageRating" DECIMAL(3, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS "totalRatings" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "totalTransactions" INTEGER DEFAULT 0;

-- ============================================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS "Transaction_listingId_idx" ON "Transaction"("listingId");
CREATE INDEX IF NOT EXISTS "Transaction_sellerId_idx" ON "Transaction"("sellerId");
CREATE INDEX IF NOT EXISTS "Transaction_buyerId_idx" ON "Transaction"("buyerId");
CREATE INDEX IF NOT EXISTS "Transaction_isCompleted_idx" ON "Transaction"("isCompleted");
CREATE INDEX IF NOT EXISTS "Transaction_createdAt_idx" ON "Transaction"("createdAt" DESC);

CREATE INDEX IF NOT EXISTS "Rating_transactionId_idx" ON "Rating"("transactionId");
CREATE INDEX IF NOT EXISTS "Rating_reviewerId_idx" ON "Rating"("reviewerId");
CREATE INDEX IF NOT EXISTS "Rating_revieweeId_idx" ON "Rating"("revieweeId");
CREATE INDEX IF NOT EXISTS "Rating_createdAt_idx" ON "Rating"("createdAt" DESC);

-- ============================================================
-- 5. CREATE FUNCTION TO UPDATE RATING STATS
-- ============================================================
CREATE OR REPLACE FUNCTION update_profile_rating_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Update the reviewee's rating stats
  UPDATE "Profile"
  SET 
    "averageRating" = (
      SELECT COALESCE(AVG("score"), 0)
      FROM "Rating"
      WHERE "revieweeId" = NEW."revieweeId"
    ),
    "totalRatings" = (
      SELECT COUNT(*)
      FROM "Rating"
      WHERE "revieweeId" = NEW."revieweeId"
    )
  WHERE "id" = NEW."revieweeId";
  
  RETURN NEW;
END;
$$;

-- ============================================================
-- 6. CREATE TRIGGER FOR RATING STATS
-- ============================================================
DROP TRIGGER IF EXISTS update_rating_stats_trigger ON "Rating";
CREATE TRIGGER update_rating_stats_trigger
  AFTER INSERT OR UPDATE ON "Rating"
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_rating_stats();

-- ============================================================
-- 7. CREATE FUNCTION TO AUTO-COMPLETE TRANSACTIONS
-- ============================================================
CREATE OR REPLACE FUNCTION auto_complete_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- If both parties confirmed, mark as completed
  IF NEW."sellerConfirmed" = TRUE AND NEW."buyerConfirmed" = TRUE AND NEW."isCompleted" = FALSE THEN
    NEW."isCompleted" = TRUE;
    NEW."completedAt" = NOW();
    
    -- Update seller and buyer transaction counts
    UPDATE "Profile"
    SET "totalTransactions" = "totalTransactions" + 1
    WHERE "id" IN (NEW."sellerId", NEW."buyerId");
  END IF;
  
  RETURN NEW;
END;
$$;

-- ============================================================
-- 8. CREATE TRIGGER FOR AUTO-COMPLETION
-- ============================================================
DROP TRIGGER IF EXISTS auto_complete_transaction_trigger ON "Transaction";
CREATE TRIGGER auto_complete_transaction_trigger
  BEFORE UPDATE ON "Transaction"
  FOR EACH ROW
  EXECUTE FUNCTION auto_complete_transaction();

-- ============================================================
-- 9. ADD COMMENTS FOR DOCUMENTATION
-- ============================================================
COMMENT ON TABLE "Transaction" IS 'Tracks completed sales/exchanges with confirmation from both parties';
COMMENT ON TABLE "Rating" IS 'Stores user ratings and reviews after transactions';

COMMENT ON COLUMN "Transaction"."sellerConfirmed" IS 'Whether seller confirmed the transaction';
COMMENT ON COLUMN "Transaction"."buyerConfirmed" IS 'Whether buyer confirmed the transaction';
COMMENT ON COLUMN "Transaction"."isCompleted" IS 'Auto-set to true when both parties confirm';
COMMENT ON COLUMN "Transaction"."receiptSent" IS 'Whether email receipt was sent to both parties';

COMMENT ON COLUMN "Rating"."score" IS 'Rating from 1-5 stars';
COMMENT ON COLUMN "Rating"."review" IS 'Optional text review';

COMMENT ON COLUMN "Profile"."averageRating" IS 'Average rating from all received reviews';
COMMENT ON COLUMN "Profile"."totalRatings" IS 'Total number of ratings received';
COMMENT ON COLUMN "Profile"."totalTransactions" IS 'Total number of completed transactions';

-- ============================================================
-- 10. CREATE VIEW FOR TRANSACTION DETAILS
-- ============================================================
CREATE OR REPLACE VIEW "TransactionDetails" AS
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
-- SUCCESS MESSAGE
-- ============================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Transaction & Rating system created successfully!';
  RAISE NOTICE 'Tables: Transaction, Rating';
  RAISE NOTICE 'Features: Dual confirmation, auto-completion, rating stats, email receipts';
  RAISE NOTICE 'Next: Implement API endpoints and UI components';
END $$;
