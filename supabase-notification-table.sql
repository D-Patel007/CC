-- Create Notification table for user notifications
CREATE TABLE IF NOT EXISTS "Notification" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "type" TEXT NOT NULL, -- 'message', 'rsvp', 'listing_sold', etc.
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "read" BOOLEAN NOT NULL DEFAULT false,
  "relatedId" TEXT, -- ID of related entity (message, event, listing, etc.)
  "relatedType" TEXT, -- 'message', 'event', 'listing'
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Foreign key
  CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") 
    REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX IF NOT EXISTS "Notification_read_idx" ON "Notification"("read");
CREATE INDEX IF NOT EXISTS "Notification_createdAt_idx" ON "Notification"("createdAt" DESC);

-- RLS Policies for Notification table
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;

-- Users can only view their own notifications
CREATE POLICY "Users can view own notifications"
  ON "Notification"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Profile"
      WHERE "Profile".id = "Notification"."userId"
      AND "Profile"."supabaseId" = auth.uid()::text
    )
  );

-- System can create notifications (handled via service role or functions)
CREATE POLICY "Service role can create notifications"
  ON "Notification"
  FOR INSERT
  WITH CHECK (true);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON "Notification"
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM "Profile"
      WHERE "Profile".id = "Notification"."userId"
      AND "Profile"."supabaseId" = auth.uid()::text
    )
  );

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON "Notification"
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM "Profile"
      WHERE "Profile".id = "Notification"."userId"
      AND "Profile"."supabaseId" = auth.uid()::text
    )
  );
