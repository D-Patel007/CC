-- Fix listings that have sellerId 1401 to use the correct profile ID (1)
-- This updates all listings owned by the user with profile ID 1

-- First, check which listings will be affected
SELECT id, title, "sellerId" 
FROM "Listing" 
WHERE "sellerId" = 1401;

-- Update the listings
UPDATE "Listing"
SET "sellerId" = 1
WHERE "sellerId" = 1401;

-- Verify the change
SELECT id, title, "sellerId" 
FROM "Listing" 
WHERE "sellerId" = 1;
