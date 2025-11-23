-- ================================================
-- EMAIL NOTIFICATION PREFERENCES
-- ================================================
-- Add email notification preferences to Profile table
-- This allows users to opt-in/opt-out of email notifications

-- Add emailNotifications column (default TRUE for opt-in by default)
ALTER TABLE "Profile" 
ADD COLUMN IF NOT EXISTS "emailNotifications" BOOLEAN DEFAULT TRUE NOT NULL;

-- Add individual email preference columns for granular control
ALTER TABLE "Profile"
ADD COLUMN IF NOT EXISTS "emailNewMessages" BOOLEAN DEFAULT TRUE NOT NULL;

ALTER TABLE "Profile"
ADD COLUMN IF NOT EXISTS "emailContentFlags" BOOLEAN DEFAULT TRUE NOT NULL;

ALTER TABLE "Profile"
ADD COLUMN IF NOT EXISTS "emailEventReminders" BOOLEAN DEFAULT TRUE NOT NULL;

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_profile_email_notifications 
ON "Profile"("emailNotifications");

-- Add comments for documentation
COMMENT ON COLUMN "Profile"."emailNotifications" IS 'Master toggle for all email notifications';
COMMENT ON COLUMN "Profile"."emailNewMessages" IS 'Receive emails for new messages';
COMMENT ON COLUMN "Profile"."emailContentFlags" IS 'Receive emails when content is flagged';
COMMENT ON COLUMN "Profile"."emailEventReminders" IS 'Receive event reminder emails';

-- ================================================
-- TESTING
-- ================================================
-- To test, run:
-- SELECT id, name, "emailNotifications", "emailNewMessages", "emailContentFlags", "emailEventReminders" 
-- FROM "Profile" LIMIT 5;
