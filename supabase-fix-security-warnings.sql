-- ============================================================
-- FIX: Security Warnings from Supabase Linter
-- Date: November 10, 2025
-- Purpose: Fix function search_path issues and materialized view access
-- ============================================================

-- ============================================================
-- 1. FIX: get_user_active_strikes - Add search_path
-- ============================================================
CREATE OR REPLACE FUNCTION get_user_active_strikes(user_id INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  active_strikes INTEGER;
BEGIN
  -- Count active strikes for user
  SELECT COUNT(*)
  INTO active_strikes
  FROM "UserStrike"
  WHERE "userId" = user_id
    AND "isActive" = TRUE;
  
  RETURN COALESCE(active_strikes, 0);
END;
$$;

-- ============================================================
-- 2. FIX: is_user_suspended - Add search_path
-- ============================================================
CREATE OR REPLACE FUNCTION is_user_suspended(user_id INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  suspended BOOLEAN;
BEGIN
  -- Check if user is suspended
  SELECT "isSuspended"
  INTO suspended
  FROM "Profile"
  WHERE "id" = user_id;
  
  RETURN COALESCE(suspended, FALSE);
END;
$$;

-- ============================================================
-- 3. FIX: check_strike_threshold - Add search_path
-- ============================================================
CREATE OR REPLACE FUNCTION check_strike_threshold()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  strike_count INTEGER;
  strike_threshold INTEGER := 3; -- Suspend after 3 strikes
BEGIN
  -- Count active strikes for the user
  SELECT COUNT(*)
  INTO strike_count
  FROM "UserStrike"
  WHERE "userId" = NEW."userId"
    AND "isActive" = TRUE;
  
  -- If threshold reached, suspend user
  IF strike_count >= strike_threshold THEN
    UPDATE "Profile"
    SET 
      "isSuspended" = TRUE,
      "suspendedAt" = NOW(),
      "suspensionReason" = 'Automatic suspension: ' || strike_count || ' active strikes'
    WHERE "id" = NEW."userId";
    
    RAISE NOTICE 'User % suspended due to % active strikes', NEW."userId", strike_count;
  END IF;
  
  RETURN NEW;
END;
$$;

-- ============================================================
-- 4. FIX: refresh_moderation_stats - Add search_path
-- ============================================================
CREATE OR REPLACE FUNCTION refresh_moderation_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Refresh the materialized view
  REFRESH MATERIALIZED VIEW CONCURRENTLY "moderation_stats";
  
  RAISE NOTICE 'Moderation stats refreshed at %', NOW();
END;
$$;

-- ============================================================
-- 5. FIX: Materialized View Access Control
-- ============================================================

-- Revoke public access from moderation_stats materialized view
REVOKE ALL ON "moderation_stats" FROM anon;
REVOKE ALL ON "moderation_stats" FROM authenticated;
REVOKE ALL ON "moderation_stats" FROM PUBLIC;

-- Grant access only to postgres role (for internal use)
GRANT SELECT ON "moderation_stats" TO postgres;

-- Create a function to safely access moderation stats (for admins only)
CREATE OR REPLACE FUNCTION get_moderation_stats()
RETURNS TABLE (
  total_reports BIGINT,
  pending_reports BIGINT,
  resolved_reports BIGINT,
  total_strikes BIGINT,
  active_strikes BIGINT,
  suspended_users BIGINT,
  flagged_listings BIGINT,
  flagged_profiles BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Check if user is admin or moderator
  IF NOT EXISTS (
    SELECT 1 FROM "Profile"
    WHERE "supabaseId" = auth.uid()::text
    AND "role" IN ('admin', 'moderator')
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin or moderator role required';
  END IF;
  
  -- Return stats from materialized view
  RETURN QUERY
  SELECT * FROM "moderation_stats";
END;
$$;

-- Grant execute permission to authenticated users (function checks role internally)
GRANT EXECUTE ON FUNCTION get_moderation_stats() TO authenticated;

-- ============================================================
-- 6. CREATE HELPER FUNCTION COMMENTS
-- ============================================================
COMMENT ON FUNCTION get_user_active_strikes IS 'Returns count of active strikes for a user (isActive = TRUE). Secured with search_path.';
COMMENT ON FUNCTION is_user_suspended IS 'Checks if a user is suspended. Secured with search_path.';
COMMENT ON FUNCTION check_strike_threshold IS 'Trigger function to auto-suspend users after strike threshold. Secured with search_path.';
COMMENT ON FUNCTION refresh_moderation_stats IS 'Refreshes the moderation_stats materialized view. Secured with search_path.';
COMMENT ON FUNCTION get_moderation_stats IS 'Safely returns moderation stats for admin/moderator users only. Secured with search_path.';
COMMENT ON MATERIALIZED VIEW "moderation_stats" IS 'Internal materialized view for moderation statistics. Access via get_moderation_stats() function.';

-- ============================================================
-- 7. VERIFY TRIGGER EXISTS (recreate if needed)
-- ============================================================
-- Ensure the trigger is properly set up
DROP TRIGGER IF EXISTS check_strike_threshold_trigger ON "UserStrike";
CREATE TRIGGER check_strike_threshold_trigger
  AFTER INSERT ON "UserStrike"
  FOR EACH ROW
  EXECUTE FUNCTION check_strike_threshold();

-- ============================================================
-- SUCCESS MESSAGE
-- ============================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Security warnings fixed!';
  RAISE NOTICE '';
  RAISE NOTICE 'Fixed functions:';
  RAISE NOTICE '  ✓ get_user_active_strikes - Added search_path';
  RAISE NOTICE '  ✓ is_user_suspended - Added search_path';
  RAISE NOTICE '  ✓ check_strike_threshold - Added search_path';
  RAISE NOTICE '  ✓ refresh_moderation_stats - Added search_path';
  RAISE NOTICE '';
  RAISE NOTICE 'Fixed materialized view:';
  RAISE NOTICE '  ✓ moderation_stats - Restricted access';
  RAISE NOTICE '  ✓ Created get_moderation_stats() function for admin access';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  NOTE: Auth leaked password protection must be enabled in Supabase Dashboard';
  RAISE NOTICE '     Go to: Authentication → Policies → Enable "Password Strength"';
END $$;
