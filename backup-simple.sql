-- ============================================================
-- SIMPLE BACKUP: Export to Download
-- Date: November 10, 2025  
-- Run this, then click "Export" → "CSV" to save
-- ============================================================

-- This creates one big text blob you can easily copy

WITH policy_backup AS (
  SELECT 
    tablename,
    string_agg(
      'DROP POLICY IF EXISTS "' || policyname || '" ON "' || tablename || '";' || E'\n' ||
      'CREATE POLICY "' || policyname || '"' || E'\n' ||
      'ON "' || tablename || '"' || E'\n' ||
      'FOR ' || cmd || E'\n' ||
      'TO ' || roles::text ||
      CASE WHEN qual IS NOT NULL THEN E'\nUSING (' || qual || ')' ELSE '' END ||
      CASE WHEN with_check IS NOT NULL THEN E'\nWITH CHECK (' || with_check || ')' ELSE '' END || ';',
      E'\n\n'
    ) as policy_sql
  FROM pg_policies 
  WHERE schemaname = 'public'
  GROUP BY tablename
)
SELECT 
  '-- BACKUP OF ALL POLICIES - ' || CURRENT_TIMESTAMP::text || E'\n\n' ||
  string_agg(
    '-- TABLE: ' || tablename || E'\n' || policy_sql,
    E'\n\n'
  ) as complete_backup
FROM policy_backup;
