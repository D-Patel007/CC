-- Check all listings with invalid seller IDs
SELECT id, title, sellerId, authorId, createdAt 
FROM "Listing" 
WHERE sellerId NOT IN (1401, 1402)
ORDER BY id DESC;

-- Update Pencils listing (ID 27) to have correct sellerId
-- Assuming it was created by the college account (profile 1401)
UPDATE "Listing"
SET sellerId = 1401
WHERE id = 27;

-- Update all other listings with sellerId = 1 to 1401
UPDATE "Listing"
SET sellerId = 1401
WHERE sellerId = 1;

-- Update all transactions with sellerId = 1 to 1401
UPDATE "Transaction"
SET sellerId = 1401
WHERE sellerId = 1;

-- Verify the updates
SELECT id, title, sellerId FROM "Listing" WHERE id = 27;
SELECT id, sellerId, buyerId FROM "Transaction" WHERE sellerId = 1401 ORDER BY id DESC;
