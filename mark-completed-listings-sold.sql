-- Mark listings as sold for completed transactions
-- Updates Listing.isSold = true for all transactions where both parties confirmed

UPDATE "Listing"
SET "isSold" = true
FROM "Transaction" t
WHERE "Listing"."id" = t."listingId"
  AND t."isCompleted" = true
  AND "Listing"."isSold" = false;

-- Show updated listings
SELECT 
  l."id", 
  l."title", 
  l."isSold",
  t."id" as "transactionId"
FROM "Listing" l
INNER JOIN "Transaction" t ON l."id" = t."listingId"
WHERE t."isCompleted" = true;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Marked completed listings as sold';
END $$;
