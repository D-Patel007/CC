-- Migration: Add verified student badges and multi-image support
-- Date: November 1, 2025

-- 1. Add verified student fields to Profile table
ALTER TABLE "Profile" 
ADD COLUMN IF NOT EXISTS "isVerified" BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS "verifiedEmail" TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS "Profile_isVerified_idx" ON "Profile"("isVerified");

-- 2. Add multi-image support to Listing table
-- First, add the new images array column
ALTER TABLE "Listing"
ADD COLUMN IF NOT EXISTS "images" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Migrate existing imageUrl data to images array (keep both for backward compatibility initially)
UPDATE "Listing" 
SET "images" = ARRAY["imageUrl"]::TEXT[]
WHERE "imageUrl" IS NOT NULL AND "images" = ARRAY[]::TEXT[];

-- Create index for image queries
CREATE INDEX IF NOT EXISTS "Listing_images_idx" ON "Listing" USING GIN("images");

-- 3. Add metadata tracking for images
ALTER TABLE "Listing"
ADD COLUMN IF NOT EXISTS "imageCount" INTEGER DEFAULT 0;

-- Update imageCount based on images array
UPDATE "Listing"
SET "imageCount" = array_length("images", 1)
WHERE "images" IS NOT NULL;

-- Comments for documentation
COMMENT ON COLUMN "Profile"."isVerified" IS 'Whether the user has verified their student email';
COMMENT ON COLUMN "Profile"."verifiedEmail" IS 'The verified .edu email address';
COMMENT ON COLUMN "Listing"."images" IS 'Array of image URLs for the listing (supports up to 5 images)';
COMMENT ON COLUMN "Listing"."imageCount" IS 'Number of images in the listing (for quick filtering)';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE '1. Profile table: Added isVerified and verifiedEmail fields';
  RAISE NOTICE '2. Listing table: Added images array and imageCount fields';
  RAISE NOTICE '3. Migrated existing imageUrl data to images array';
END $$;
