-- ============================================
-- Supabase Row Level Security (RLS) Policies
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable RLS on all tables
ALTER TABLE "Profile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Listing" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Event" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EventAttendee" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Conversation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Category" ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILE POLICIES
-- ============================================

-- Anyone can view profiles (for marketplace listings, events, etc.)
CREATE POLICY "Profiles are viewable by everyone" 
ON "Profile" FOR SELECT 
USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" 
ON "Profile" FOR UPDATE 
USING (auth.uid()::text = "supabaseId");

-- Users can insert their own profile (during signup)
CREATE POLICY "Users can insert own profile" 
ON "Profile" FOR INSERT 
WITH CHECK (auth.uid()::text = "supabaseId");

-- ============================================
-- LISTING POLICIES
-- ============================================

-- Anyone can view active listings (public marketplace)
CREATE POLICY "Listings are viewable by everyone" 
ON "Listing" FOR SELECT 
USING (true);

-- Authenticated users can create listings
CREATE POLICY "Authenticated users can create listings" 
ON "Listing" FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "Profile" 
    WHERE id = "Listing"."sellerId" 
    AND "supabaseId" = auth.uid()::text
  )
);

-- Users can update their own listings
CREATE POLICY "Users can update own listings" 
ON "Listing" FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM "Profile" 
    WHERE id = "Listing"."sellerId" 
    AND "supabaseId" = auth.uid()::text
  )
);

-- Users can delete their own listings
CREATE POLICY "Users can delete own listings" 
ON "Listing" FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM "Profile" 
    WHERE id = "Listing"."sellerId" 
    AND "supabaseId" = auth.uid()::text
  )
);

-- ============================================
-- EVENT POLICIES
-- ============================================

-- Anyone can view events (public events page)
CREATE POLICY "Events are viewable by everyone" 
ON "Event" FOR SELECT 
USING (true);

-- Authenticated users can create events
CREATE POLICY "Authenticated users can create events" 
ON "Event" FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "Profile" 
    WHERE id = "Event"."organizerId" 
    AND "supabaseId" = auth.uid()::text
  )
);

-- Organizers can update their own events
CREATE POLICY "Organizers can update own events" 
ON "Event" FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM "Profile" 
    WHERE id = "Event"."organizerId" 
    AND "supabaseId" = auth.uid()::text
  )
);

-- Organizers can delete their own events
CREATE POLICY "Organizers can delete own events" 
ON "Event" FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM "Profile" 
    WHERE id = "Event"."organizerId" 
    AND "supabaseId" = auth.uid()::text
  )
);

-- ============================================
-- EVENT ATTENDEE POLICIES
-- ============================================

-- Anyone can view event attendees (to see who's attending)
CREATE POLICY "Event attendees are viewable by everyone" 
ON "EventAttendee" FOR SELECT 
USING (true);

-- Users can RSVP to events (insert their own attendance)
CREATE POLICY "Users can RSVP to events" 
ON "EventAttendee" FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "Profile" 
    WHERE id = "EventAttendee"."userId" 
    AND "supabaseId" = auth.uid()::text
  )
);

-- Users can cancel their own RSVP
CREATE POLICY "Users can cancel own RSVP" 
ON "EventAttendee" FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM "Profile" 
    WHERE id = "EventAttendee"."userId" 
    AND "supabaseId" = auth.uid()::text
  )
);

-- ============================================
-- CONVERSATION POLICIES
-- ============================================

-- Users can only view conversations they're part of
CREATE POLICY "Users can view own conversations" 
ON "Conversation" FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM "Profile" 
    WHERE (id = "Conversation"."user1Id" OR id = "Conversation"."user2Id")
    AND "supabaseId" = auth.uid()::text
  )
);

-- Users can create conversations
CREATE POLICY "Users can create conversations" 
ON "Conversation" FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "Profile" 
    WHERE (id = "Conversation"."user1Id" OR id = "Conversation"."user2Id")
    AND "supabaseId" = auth.uid()::text
  )
);

-- Users can update conversations they're part of (for read receipts, etc.)
CREATE POLICY "Users can update own conversations" 
ON "Conversation" FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM "Profile" 
    WHERE (id = "Conversation"."user1Id" OR id = "Conversation"."user2Id")
    AND "supabaseId" = auth.uid()::text
  )
);

-- ============================================
-- MESSAGE POLICIES
-- ============================================

-- Users can only view messages in their conversations
CREATE POLICY "Users can view messages in own conversations" 
ON "Message" FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM "Conversation" c
    INNER JOIN "Profile" p ON (p.id = c."user1Id" OR p.id = c."user2Id")
    WHERE c.id = "Message"."conversationId"
    AND p."supabaseId" = auth.uid()::text
  )
);

-- Users can send messages in their conversations
CREATE POLICY "Users can send messages in own conversations" 
ON "Message" FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "Conversation" c
    INNER JOIN "Profile" p ON (p.id = c."user1Id" OR p.id = c."user2Id")
    WHERE c.id = "Message"."conversationId"
    AND p."supabaseId" = auth.uid()::text
    AND p.id = "Message"."senderId"
  )
);

-- Users can update their own messages (for editing)
CREATE POLICY "Users can update own messages" 
ON "Message" FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM "Profile" 
    WHERE id = "Message"."senderId" 
    AND "supabaseId" = auth.uid()::text
  )
);

-- Users can delete their own messages
CREATE POLICY "Users can delete own messages" 
ON "Message" FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM "Profile" 
    WHERE id = "Message"."senderId" 
    AND "supabaseId" = auth.uid()::text
  )
);

-- ============================================
-- CATEGORY POLICIES (Read-only for users)
-- ============================================

-- Everyone can view categories
CREATE POLICY "Categories are viewable by everyone" 
ON "Category" FOR SELECT 
USING (true);

-- Only authenticated users can suggest categories (optional - remove if you don't want this)
-- Admin/moderators would need to manage via service role
-- CREATE POLICY "Authenticated users can suggest categories" 
-- ON "Category" FOR INSERT 
-- TO authenticated
-- WITH CHECK (true);

-- ============================================
-- DONE! 
-- ============================================
-- After running this:
-- 1. Go to Supabase Dashboard > Database > Policies
-- 2. Verify all policies are created
-- 3. Test your app to ensure everything still works
-- 4. The security warnings should disappear
-- ============================================
