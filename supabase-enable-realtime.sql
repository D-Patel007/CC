-- Enable real-time for the Notification table
-- Run this in your Supabase SQL Editor

-- Enable realtime publication for the Notification table
ALTER PUBLICATION supabase_realtime ADD TABLE "Notification";

-- Verify it's enabled
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
