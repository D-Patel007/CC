-- ================================================
-- FIX NOTIFICATION RLS POLICY
-- ================================================
-- The notifyNewMessage function is failing because of RLS policies
-- This allows the service role to insert notifications

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own notifications" ON "Notification";
DROP POLICY IF EXISTS "Service role can insert notifications" ON "Notification";

-- Allow users to insert notifications (needed for the API)
CREATE POLICY "Users can insert notifications"
ON "Notification"
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Also ensure users can read their own notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON "Notification";

CREATE POLICY "Users can view their own notifications"
ON "Notification"
FOR SELECT
TO authenticated
USING ("userId" IN (SELECT "id" FROM "Profile" WHERE "supabaseId" = auth.uid()::text));

-- Allow users to update their own notifications (mark as read)
DROP POLICY IF EXISTS "Users can update their own notifications" ON "Notification";

CREATE POLICY "Users can update their own notifications"
ON "Notification"
FOR UPDATE
TO authenticated
USING ("userId" IN (SELECT "id" FROM "Profile" WHERE "supabaseId" = auth.uid()::text))
WITH CHECK ("userId" IN (SELECT "id" FROM "Profile" WHERE "supabaseId" = auth.uid()::text));

-- Verify RLS is enabled
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;

-- Test query (should return your notifications)
-- SELECT * FROM "Notification" WHERE "userId" IN (SELECT "id" FROM "Profile" WHERE "supabaseId" = auth.uid()::text);
