-- Migration: Update Profile fields for marketplace
-- Date: November 1, 2025
-- Changes: Remove year/major, add phone/campusArea

-- 1. Add new fields
ALTER TABLE "Profile" 
ADD COLUMN IF NOT EXISTS "phone" TEXT,
ADD COLUMN IF NOT EXISTS "campusArea" TEXT;

-- 2. Drop old fields (optional - can keep for data migration)
-- Uncomment these if you want to completely remove old data:
-- ALTER TABLE "Profile" DROP COLUMN IF EXISTS "year";
-- ALTER TABLE "Profile" DROP COLUMN IF EXISTS "major";

-- Note: We're keeping year and major columns for now in case you want to migrate data
-- They'll just be unused in the app

-- 3. Add comments
COMMENT ON COLUMN "Profile"."phone" IS 'Optional phone number for easier meetup coordination';
COMMENT ON COLUMN "Profile"."campusArea" IS 'Preferred campus area: North Campus, South Campus, Harbor Campus, Off-Campus';
COMMENT ON COLUMN "Profile"."bio" IS 'User bio - can include availability, payment preferences, etc.';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Profile fields updated successfully!';
  RAISE NOTICE 'Added: phone, campusArea';
  RAISE NOTICE 'Kept: year, major (unused but preserved for data safety)';
END $$;
