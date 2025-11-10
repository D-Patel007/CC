-- Migration: Add Phone Verification for Security & Trust
-- Date: November 6, 2025
-- Purpose: Add SMS verification to verify real users and reduce spam

-- 1. Add phone verification fields to Profile table
ALTER TABLE "Profile" 
ADD COLUMN IF NOT EXISTS "phoneVerified" BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS "phoneVerifiedAt" TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS "phoneVerificationCode" TEXT,
ADD COLUMN IF NOT EXISTS "phoneVerificationExpiry" TIMESTAMPTZ;

-- 2. Add indexes for performance
CREATE INDEX IF NOT EXISTS "Profile_phoneVerified_idx" ON "Profile"("phoneVerified");
CREATE INDEX IF NOT EXISTS "Profile_phone_idx" ON "Profile"("phone");

-- 3. Add unique constraint on verified phone numbers (one phone = one account)
-- This prevents multiple accounts with the same verified phone
CREATE UNIQUE INDEX IF NOT EXISTS "Profile_phone_verified_unique_idx" 
  ON "Profile"("phone") 
  WHERE "phoneVerified" = TRUE AND "phone" IS NOT NULL;

-- 4. Add comments for documentation
COMMENT ON COLUMN "Profile"."phoneVerified" IS 'Whether the user has verified their phone number via SMS';
COMMENT ON COLUMN "Profile"."phoneVerifiedAt" IS 'Timestamp when phone was verified';
COMMENT ON COLUMN "Profile"."phoneVerificationCode" IS 'Temporary verification code (6 digits), cleared after verification';
COMMENT ON COLUMN "Profile"."phoneVerificationExpiry" IS 'When the verification code expires (15 minutes)';

-- 5. Create a function to clean up expired verification codes (optional, for maintenance)
CREATE OR REPLACE FUNCTION cleanup_expired_phone_codes()
RETURNS void AS $$
BEGIN
  UPDATE "Profile"
  SET 
    "phoneVerificationCode" = NULL,
    "phoneVerificationExpiry" = NULL
  WHERE 
    "phoneVerificationExpiry" < NOW()
    AND "phoneVerificationCode" IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Phone verification fields added successfully!';
  RAISE NOTICE 'Added: phoneVerified, phoneVerifiedAt, phoneVerificationCode, phoneVerificationExpiry';
  RAISE NOTICE 'Security: One verified phone per account enforced';
  RAISE NOTICE 'Next: Set up Twilio credentials in your .env file';
END $$;
