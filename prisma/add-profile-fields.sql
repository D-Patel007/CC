-- Add profile fields to Profile table
ALTER TABLE "Profile"
ADD COLUMN "year" TEXT,
ADD COLUMN "major" TEXT,
ADD COLUMN "bio" TEXT;
