-- Fix security issue: Set search_path for cleanup_expired_phone_codes function
-- This prevents potential SQL injection through search_path manipulation

DROP FUNCTION IF EXISTS cleanup_expired_phone_codes();

CREATE OR REPLACE FUNCTION cleanup_expired_phone_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE "Profile"
  SET 
    "phoneVerificationCode" = NULL,
    "phoneVerificationExpiry" = NULL
  WHERE 
    "phoneVerificationExpiry" < NOW()
    AND "phoneVerificationCode" IS NOT NULL;
END;
$$;

-- Add comment
COMMENT ON FUNCTION cleanup_expired_phone_codes() IS 'Cleans up expired phone verification codes. Security: Fixed search_path to prevent SQL injection.';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Function security fixed!';
  RAISE NOTICE 'Added: SECURITY DEFINER and SET search_path = public, pg_temp';
END $$;
