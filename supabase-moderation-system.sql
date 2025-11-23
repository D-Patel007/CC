-- ============================================
-- MODERATION SYSTEM - DATABASE SCHEMA
-- ============================================
-- Implements: Prohibited items list, flagged content queue, 
-- user strikes, and admin roles
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Add admin role to Profile table
-- ============================================
ALTER TABLE "Profile" 
ADD COLUMN IF NOT EXISTS "role" TEXT DEFAULT 'user' CHECK ("role" IN ('user', 'admin', 'moderator'));

ALTER TABLE "Profile" 
ADD COLUMN IF NOT EXISTS "isAdmin" BOOLEAN DEFAULT FALSE;

ALTER TABLE "Profile" 
ADD COLUMN IF NOT EXISTS "isSuspended" BOOLEAN DEFAULT FALSE;

ALTER TABLE "Profile" 
ADD COLUMN IF NOT EXISTS "suspendedUntil" TIMESTAMPTZ;

ALTER TABLE "Profile" 
ADD COLUMN IF NOT EXISTS "suspensionReason" TEXT;

-- Create index for admin lookups
CREATE INDEX IF NOT EXISTS idx_profile_role ON "Profile"("role");
CREATE INDEX IF NOT EXISTS idx_profile_suspended ON "Profile"("isSuspended");

COMMENT ON COLUMN "Profile"."role" IS 'User role: user, admin, or moderator';
COMMENT ON COLUMN "Profile"."isAdmin" IS 'Quick check for admin privileges';
COMMENT ON COLUMN "Profile"."isSuspended" IS 'Whether user is currently suspended';
COMMENT ON COLUMN "Profile"."suspendedUntil" IS 'Temporary suspension end date';


-- 2. Create ProhibitedItem table (banned keywords/patterns)
-- ============================================
CREATE TABLE IF NOT EXISTS "ProhibitedItem" (
  "id" SERIAL PRIMARY KEY,
  "type" TEXT NOT NULL CHECK ("type" IN ('keyword', 'regex', 'category', 'url_pattern')),
  "pattern" TEXT NOT NULL,
  "severity" TEXT NOT NULL DEFAULT 'medium' CHECK ("severity" IN ('low', 'medium', 'high', 'critical')),
  "action" TEXT NOT NULL DEFAULT 'flag' CHECK ("action" IN ('flag', 'auto_reject', 'warn')),
  "category" TEXT, -- e.g., 'scam', 'profanity', 'drugs', 'weapons', 'adult'
  "description" TEXT,
  "isActive" BOOLEAN DEFAULT TRUE,
  "createdBy" INTEGER REFERENCES "Profile"("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_prohibited_type ON "ProhibitedItem"("type");
CREATE INDEX idx_prohibited_severity ON "ProhibitedItem"("severity");
CREATE INDEX idx_prohibited_active ON "ProhibitedItem"("isActive");

COMMENT ON TABLE "ProhibitedItem" IS 'List of prohibited keywords, patterns, and categories for content moderation';
COMMENT ON COLUMN "ProhibitedItem"."type" IS 'Type of prohibition: keyword (exact match), regex (pattern), category (item type), url_pattern';
COMMENT ON COLUMN "ProhibitedItem"."severity" IS 'How serious the violation is';
COMMENT ON COLUMN "ProhibitedItem"."action" IS 'What to do when matched: flag for review, auto-reject, or warn user';


-- 3. Create FlaggedContent table (moderation queue)
-- ============================================
CREATE TABLE IF NOT EXISTS "FlaggedContent" (
  "id" SERIAL PRIMARY KEY,
  "contentType" TEXT NOT NULL CHECK ("contentType" IN ('listing', 'message', 'profile', 'event')),
  "contentId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL REFERENCES "Profile"("id") ON DELETE CASCADE,
  "reason" TEXT NOT NULL, -- e.g., 'spam', 'scam', 'profanity', 'inappropriate'
  "severity" TEXT NOT NULL DEFAULT 'medium' CHECK ("severity" IN ('low', 'medium', 'high', 'critical')),
  "status" TEXT NOT NULL DEFAULT 'pending' CHECK ("status" IN ('pending', 'approved', 'rejected', 'deleted')),
  "source" TEXT NOT NULL DEFAULT 'auto' CHECK ("source" IN ('auto', 'user_report', 'admin')),
  "details" JSONB, -- Contains: matched_patterns, confidence_score, reporter_id, etc.
  "reviewedBy" INTEGER REFERENCES "Profile"("id") ON DELETE SET NULL,
  "reviewedAt" TIMESTAMPTZ,
  "reviewNotes" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_flagged_content_type ON "FlaggedContent"("contentType");
CREATE INDEX idx_flagged_user ON "FlaggedContent"("userId");
CREATE INDEX idx_flagged_status ON "FlaggedContent"("status");
CREATE INDEX idx_flagged_severity ON "FlaggedContent"("severity");
CREATE INDEX idx_flagged_source ON "FlaggedContent"("source");
CREATE INDEX idx_flagged_created ON "FlaggedContent"("createdAt" DESC);

COMMENT ON TABLE "FlaggedContent" IS 'Queue of content flagged for moderation review';
COMMENT ON COLUMN "FlaggedContent"."contentType" IS 'What type of content is flagged';
COMMENT ON COLUMN "FlaggedContent"."contentId" IS 'ID of the flagged content (Listing.id, Message.id, etc.)';
COMMENT ON COLUMN "FlaggedContent"."source" IS 'How it was flagged: auto-detection, user report, or admin flag';
COMMENT ON COLUMN "FlaggedContent"."details" IS 'JSON data with context: matched patterns, AI confidence, reporter info';


-- 4. Create UserStrike table (violation tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS "UserStrike" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES "Profile"("id") ON DELETE CASCADE,
  "reason" TEXT NOT NULL,
  "severity" TEXT NOT NULL DEFAULT 'minor' CHECK ("severity" IN ('minor', 'major', 'severe')),
  "flaggedContentId" INTEGER REFERENCES "FlaggedContent"("id") ON DELETE SET NULL,
  "issuedBy" INTEGER REFERENCES "Profile"("id") ON DELETE SET NULL,
  "notes" TEXT,
  "isActive" BOOLEAN DEFAULT TRUE, -- Can be revoked/appealed
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_strike_user ON "UserStrike"("userId");
CREATE INDEX idx_strike_active ON "UserStrike"("isActive");
CREATE INDEX idx_strike_created ON "UserStrike"("createdAt" DESC);

COMMENT ON TABLE "UserStrike" IS 'Tracks user violations and strikes';
COMMENT ON COLUMN "UserStrike"."isActive" IS 'False if strike was appealed or revoked';


-- 5. Create ModerationLog table (admin action tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS "ModerationLog" (
  "id" SERIAL PRIMARY KEY,
  "adminId" INTEGER NOT NULL REFERENCES "Profile"("id") ON DELETE CASCADE,
  "action" TEXT NOT NULL, -- e.g., 'deleted_listing', 'suspended_user', 'approved_content'
  "targetType" TEXT NOT NULL, -- 'user', 'listing', 'message', etc.
  "targetId" INTEGER NOT NULL,
  "details" JSONB,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_modlog_admin ON "ModerationLog"("adminId");
CREATE INDEX idx_modlog_action ON "ModerationLog"("action");
CREATE INDEX idx_modlog_created ON "ModerationLog"("createdAt" DESC);

COMMENT ON TABLE "ModerationLog" IS 'Audit log of all admin/moderator actions';


-- 6. Create UserReport table (user-submitted reports)
-- ============================================
CREATE TABLE IF NOT EXISTS "UserReport" (
  "id" SERIAL PRIMARY KEY,
  "reporterId" INTEGER NOT NULL REFERENCES "Profile"("id") ON DELETE CASCADE,
  "contentType" TEXT NOT NULL CHECK ("contentType" IN ('listing', 'message', 'profile', 'event')),
  "contentId" INTEGER NOT NULL,
  "category" TEXT NOT NULL, -- 'scam', 'spam', 'inappropriate', 'harassment', 'fake', 'other'
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending' CHECK ("status" IN ('pending', 'investigating', 'resolved', 'dismissed')),
  "flaggedContentId" INTEGER REFERENCES "FlaggedContent"("id") ON DELETE SET NULL,
  "resolvedBy" INTEGER REFERENCES "Profile"("id") ON DELETE SET NULL,
  "resolvedAt" TIMESTAMPTZ,
  "resolution" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_report_reporter ON "UserReport"("reporterId");
CREATE INDEX idx_report_content ON "UserReport"("contentType", "contentId");
CREATE INDEX idx_report_status ON "UserReport"("status");
CREATE INDEX idx_report_created ON "UserReport"("createdAt" DESC);

COMMENT ON TABLE "UserReport" IS 'User-submitted reports of problematic content';


-- ============================================
-- 7. Insert default prohibited items
-- ============================================

INSERT INTO "ProhibitedItem" ("type", "pattern", "severity", "action", "category", "description") VALUES
-- Weapons
('keyword', 'gun', 'critical', 'auto_reject', 'weapons', 'Firearms'),
('keyword', 'firearm', 'critical', 'auto_reject', 'weapons', 'Firearms'),
('keyword', 'handgun', 'critical', 'auto_reject', 'weapons', 'Firearms'),
('keyword', 'rifle', 'critical', 'auto_reject', 'weapons', 'Firearms'),
('keyword', 'pistol', 'critical', 'auto_reject', 'weapons', 'Firearms'),
('keyword', 'ammunition', 'critical', 'auto_reject', 'weapons', 'Ammunition'),
('keyword', 'ammo', 'critical', 'auto_reject', 'weapons', 'Ammunition'),
('keyword', 'knife', 'high', 'flag', 'weapons', 'Bladed weapons'),
('keyword', 'sword', 'high', 'flag', 'weapons', 'Bladed weapons'),
('keyword', 'weapon', 'high', 'flag', 'weapons', 'General weapons'),

-- Drugs
('keyword', 'marijuana', 'critical', 'auto_reject', 'drugs', 'Illegal substances'),
('keyword', 'cannabis', 'critical', 'auto_reject', 'drugs', 'Illegal substances'),
('keyword', 'weed', 'critical', 'auto_reject', 'drugs', 'Illegal substances'),
('keyword', 'cocaine', 'critical', 'auto_reject', 'drugs', 'Illegal substances'),
('keyword', 'heroin', 'critical', 'auto_reject', 'drugs', 'Illegal substances'),
('keyword', 'meth', 'critical', 'auto_reject', 'drugs', 'Illegal substances'),
('keyword', 'lsd', 'critical', 'auto_reject', 'drugs', 'Illegal substances'),
('keyword', 'mdma', 'critical', 'auto_reject', 'drugs', 'Illegal substances'),
('keyword', 'ecstasy', 'critical', 'auto_reject', 'drugs', 'Illegal substances'),
('keyword', 'pills', 'high', 'flag', 'drugs', 'Prescription drugs'),
('keyword', 'adderall', 'critical', 'auto_reject', 'drugs', 'Prescription drugs'),
('keyword', 'xanax', 'critical', 'auto_reject', 'drugs', 'Prescription drugs'),
('keyword', 'vape', 'high', 'flag', 'drugs', 'Tobacco products'),
('keyword', 'juul', 'high', 'flag', 'drugs', 'Tobacco products'),

-- Alcohol
('keyword', 'alcohol', 'high', 'flag', 'alcohol', 'Alcoholic beverages'),
('keyword', 'beer', 'high', 'flag', 'alcohol', 'Alcoholic beverages'),
('keyword', 'liquor', 'high', 'flag', 'alcohol', 'Alcoholic beverages'),
('keyword', 'vodka', 'high', 'flag', 'alcohol', 'Alcoholic beverages'),
('keyword', 'whiskey', 'high', 'flag', 'alcohol', 'Alcoholic beverages'),

-- Adult content
('keyword', 'escort', 'critical', 'auto_reject', 'adult', 'Adult services'),
('keyword', 'massage', 'high', 'flag', 'adult', 'Potential adult services'),
('keyword', 'hookup', 'high', 'flag', 'adult', 'Inappropriate services'),

-- Scams
('keyword', 'send money first', 'critical', 'auto_reject', 'scam', 'Payment scam'),
('keyword', 'wire transfer', 'critical', 'auto_reject', 'scam', 'Payment scam'),
('keyword', 'western union', 'critical', 'auto_reject', 'scam', 'Payment scam'),
('keyword', 'moneygram', 'critical', 'auto_reject', 'scam', 'Payment scam'),
('keyword', 'bitcoin', 'high', 'flag', 'scam', 'Cryptocurrency scam'),
('keyword', 'gift card', 'critical', 'auto_reject', 'scam', 'Gift card scam'),
('keyword', 'itunes card', 'critical', 'auto_reject', 'scam', 'Gift card scam'),
('keyword', 'google play card', 'critical', 'auto_reject', 'scam', 'Gift card scam'),
('keyword', 'cashapp me first', 'critical', 'auto_reject', 'scam', 'Payment scam'),
('keyword', 'venmo first', 'critical', 'auto_reject', 'scam', 'Payment scam'),

-- Stolen goods
('keyword', 'stolen', 'critical', 'auto_reject', 'illegal', 'Stolen property'),
('keyword', 'hot', 'medium', 'flag', 'illegal', 'Potentially stolen (slang)'),

-- Animals (often requires permits)
('keyword', 'puppy', 'high', 'flag', 'animals', 'Animal sales'),
('keyword', 'kitten', 'high', 'flag', 'animals', 'Animal sales'),

-- Counterfeit
('keyword', 'replica', 'high', 'flag', 'counterfeit', 'Counterfeit goods'),
('keyword', 'fake', 'high', 'flag', 'counterfeit', 'Counterfeit goods'),
('keyword', 'knockoff', 'high', 'flag', 'counterfeit', 'Counterfeit goods'),

-- Regex patterns
('regex', '\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', 'medium', 'flag', 'contact_info', 'Phone number in listing'),
('regex', '\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', 'medium', 'flag', 'contact_info', 'Email address in listing')

ON CONFLICT DO NOTHING;


-- ============================================
-- 8. Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS
ALTER TABLE "ProhibitedItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FlaggedContent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserStrike" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ModerationLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserReport" ENABLE ROW LEVEL SECURITY;

-- ProhibitedItem policies (admin only)
CREATE POLICY "Admins can view prohibited items"
  ON "ProhibitedItem" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Profile"
      WHERE "Profile"."supabaseId" = auth.uid()::text
      AND ("Profile"."role" = 'admin' OR "Profile"."role" = 'moderator')
    )
  );

CREATE POLICY "Admins can manage prohibited items"
  ON "ProhibitedItem" FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "Profile"
      WHERE "Profile"."supabaseId" = auth.uid()::text
      AND "Profile"."role" = 'admin'
    )
  );

-- FlaggedContent policies
CREATE POLICY "Admins can view all flagged content"
  ON "FlaggedContent" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Profile"
      WHERE "Profile"."supabaseId" = auth.uid()::text
      AND ("Profile"."role" = 'admin' OR "Profile"."role" = 'moderator')
    )
  );

CREATE POLICY "Admins can manage flagged content"
  ON "FlaggedContent" FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "Profile"
      WHERE "Profile"."supabaseId" = auth.uid()::text
      AND ("Profile"."role" = 'admin' OR "Profile"."role" = 'moderator')
    )
  );

-- UserStrike policies (users can view their own strikes)
CREATE POLICY "Users can view their own strikes"
  ON "UserStrike" FOR SELECT
  USING (
    "userId" IN (
      SELECT "id" FROM "Profile"
      WHERE "supabaseId" = auth.uid()::text
    )
  );

CREATE POLICY "Admins can view all strikes"
  ON "UserStrike" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Profile"
      WHERE "Profile"."supabaseId" = auth.uid()::text
      AND ("Profile"."role" = 'admin' OR "Profile"."role" = 'moderator')
    )
  );

CREATE POLICY "Admins can manage strikes"
  ON "UserStrike" FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "Profile"
      WHERE "Profile"."supabaseId" = auth.uid()::text
      AND ("Profile"."role" = 'admin' OR "Profile"."role" = 'moderator')
    )
  );

-- ModerationLog policies (admin only)
CREATE POLICY "Admins can view moderation log"
  ON "ModerationLog" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Profile"
      WHERE "Profile"."supabaseId" = auth.uid()::text
      AND ("Profile"."role" = 'admin' OR "Profile"."role" = 'moderator')
    )
  );

CREATE POLICY "Admins can create log entries"
  ON "ModerationLog" FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Profile"
      WHERE "Profile"."supabaseId" = auth.uid()::text
      AND ("Profile"."role" = 'admin' OR "Profile"."role" = 'moderator')
    )
  );

-- UserReport policies (users can submit and view their own reports)
CREATE POLICY "Users can view their own reports"
  ON "UserReport" FOR SELECT
  USING (
    "reporterId" IN (
      SELECT "id" FROM "Profile"
      WHERE "supabaseId" = auth.uid()::text
    )
  );

CREATE POLICY "Users can create reports"
  ON "UserReport" FOR INSERT
  WITH CHECK (
    "reporterId" IN (
      SELECT "id" FROM "Profile"
      WHERE "supabaseId" = auth.uid()::text
    )
  );

CREATE POLICY "Admins can view all reports"
  ON "UserReport" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Profile"
      WHERE "Profile"."supabaseId" = auth.uid()::text
      AND ("Profile"."role" = 'admin' OR "Profile"."role" = 'moderator')
    )
  );

CREATE POLICY "Admins can manage reports"
  ON "UserReport" FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "Profile"
      WHERE "Profile"."supabaseId" = auth.uid()::text
      AND ("Profile"."role" = 'admin' OR "Profile"."role" = 'moderator')
    )
  );


-- ============================================
-- 9. Helper functions
-- ============================================

-- Function to get active strikes for a user
CREATE OR REPLACE FUNCTION get_user_active_strikes(user_id INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM "UserStrike"
    WHERE "userId" = user_id
    AND "isActive" = TRUE
  );
END;
$$;

-- Function to check if user is suspended
CREATE OR REPLACE FUNCTION is_user_suspended(user_id INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  profile_record RECORD;
BEGIN
  SELECT "isSuspended", "suspendedUntil"
  INTO profile_record
  FROM "Profile"
  WHERE "id" = user_id;

  -- If permanently suspended
  IF profile_record."isSuspended" = TRUE AND profile_record."suspendedUntil" IS NULL THEN
    RETURN TRUE;
  END IF;

  -- If temporarily suspended and not expired
  IF profile_record."isSuspended" = TRUE AND profile_record."suspendedUntil" > NOW() THEN
    RETURN TRUE;
  END IF;

  -- If temporary suspension expired, clear it
  IF profile_record."isSuspended" = TRUE AND profile_record."suspendedUntil" <= NOW() THEN
    UPDATE "Profile"
    SET "isSuspended" = FALSE, "suspendedUntil" = NULL
    WHERE "id" = user_id;
    RETURN FALSE;
  END IF;

  RETURN FALSE;
END;
$$;

-- Function to auto-suspend user after threshold strikes
CREATE OR REPLACE FUNCTION check_strike_threshold()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  strike_count INTEGER;
BEGIN
  -- Count active strikes for this user
  SELECT COUNT(*) INTO strike_count
  FROM "UserStrike"
  WHERE "userId" = NEW."userId"
  AND "isActive" = TRUE;

  -- Suspend if 3+ strikes
  IF strike_count >= 3 THEN
    UPDATE "Profile"
    SET 
      "isSuspended" = TRUE,
      "suspendedUntil" = NOW() + INTERVAL '7 days',
      "suspensionReason" = 'Automatic suspension: ' || strike_count || ' strikes'
    WHERE "id" = NEW."userId";
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for auto-suspension
DROP TRIGGER IF EXISTS auto_suspend_on_strikes ON "UserStrike";
CREATE TRIGGER auto_suspend_on_strikes
  AFTER INSERT ON "UserStrike"
  FOR EACH ROW
  EXECUTE FUNCTION check_strike_threshold();


-- ============================================
-- 10. Create materialized view for moderation stats
-- ============================================

CREATE MATERIALIZED VIEW IF NOT EXISTS moderation_stats AS
SELECT
  -- Total counts
  (SELECT COUNT(*) FROM "FlaggedContent") as total_flags,
  (SELECT COUNT(*) FROM "FlaggedContent" WHERE "status" = 'pending') as pending_flags,
  (SELECT COUNT(*) FROM "FlaggedContent" WHERE "status" = 'rejected') as rejected_flags,
  (SELECT COUNT(*) FROM "UserStrike" WHERE "isActive" = TRUE) as active_strikes,
  (SELECT COUNT(*) FROM "UserReport" WHERE "status" = 'pending') as pending_reports,
  (SELECT COUNT(DISTINCT "userId") FROM "UserStrike") as users_with_strikes,
  (SELECT COUNT(*) FROM "Profile" WHERE "isSuspended" = TRUE) as suspended_users,
  
  -- Today's activity
  (SELECT COUNT(*) FROM "FlaggedContent" WHERE "createdAt" >= CURRENT_DATE) as flags_today,
  (SELECT COUNT(*) FROM "UserReport" WHERE "createdAt" >= CURRENT_DATE) as reports_today,
  (SELECT COUNT(*) FROM "ModerationLog" WHERE "createdAt" >= CURRENT_DATE) as actions_today,
  
  -- Last refresh time
  NOW() as last_updated;

-- Index for faster queries
CREATE UNIQUE INDEX IF NOT EXISTS moderation_stats_refresh_idx ON moderation_stats (last_updated);

-- Function to refresh stats
CREATE OR REPLACE FUNCTION refresh_moderation_stats()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY moderation_stats;
END;
$$;


-- ============================================
-- COMPLETE!
-- ============================================
-- Next steps:
-- 1. Set your first admin: UPDATE "Profile" SET "role" = 'admin', "isAdmin" = TRUE WHERE "email" = 'your@email.com';
-- 2. Refresh stats periodically: SELECT refresh_moderation_stats();
-- 3. Query stats: SELECT * FROM moderation_stats;
-- ============================================
