-- ============================================================
-- BACKUP: Current RLS Policies and Functions
-- Date: November 10, 2025
-- Purpose: Export current state BEFORE applying optimizations
-- ============================================================

-- HOW TO USE:
-- 1. Run this script in Supabase SQL Editor
-- 2. Copy the output to a text file
-- 3. Keep as backup in case you need to restore

-- ============================================================
-- PART 1: Export All Current RLS Policies
-- ============================================================

SELECT 
  '-- ============================================================' ||
  E'\n-- POLICIES FOR TABLE: ' || tablename ||
  E'\n-- ============================================================\n' ||
  string_agg(
    E'\nDROP POLICY IF EXISTS "' || policyname || '" ON "' || tablename || E'";\n' ||
    'CREATE POLICY "' || policyname || '"' ||
    E'\nON "' || tablename || '"' ||
    E'\nFOR ' || cmd ||
    E'\nTO ' || roles::text ||
    CASE 
      WHEN qual IS NOT NULL 
      THEN E'\nUSING (' || qual || ')'
      ELSE ''
    END ||
    CASE 
      WHEN with_check IS NOT NULL 
      THEN E'\nWITH CHECK (' || with_check || ')'
      ELSE ''
    END || ';',
    E'\n'
  ) || E'\n'
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- ============================================================
-- PART 2: Export Custom Functions
-- ============================================================

SELECT 
  E'\n-- ============================================================' ||
  E'\n-- FUNCTION: ' || proname ||
  E'\n-- ============================================================\n' ||
  pg_get_functiondef(oid) || E';\n'
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN (
    'update_profile_rating_stats',
    'auto_complete_transaction',
    'check_strike_threshold',
    'refresh_moderation_stats',
    'get_user_active_strikes',
    'is_user_suspended',
    'user_can_access_transaction'
  )
ORDER BY proname;

-- ============================================================
-- PART 3: Export Helper Instructions
-- ============================================================

SELECT E'
-- ============================================================
-- RESTORE INSTRUCTIONS
-- ============================================================
-- 
-- To restore from this backup:
-- 1. Copy everything below the "BACKUP CREATED" line
-- 2. Paste into Supabase SQL Editor
-- 3. Run the script
-- 4. Your policies and functions will be restored
--
-- Note: This backup was created on ' || CURRENT_TIMESTAMP::text || E'
-- ============================================================

-- BACKUP CREATED ON: ' || CURRENT_TIMESTAMP::text || E'

-- To restore, run all the CREATE POLICY and CREATE FUNCTION
-- statements that were output above.
';
