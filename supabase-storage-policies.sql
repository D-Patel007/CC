-- Supabase Storage Setup for message-media bucket
-- Run this in your Supabase SQL Editor

-- 1. First, check if the bucket exists and is public
-- You can check this in the Supabase Dashboard > Storage

-- 2. If the bucket is not public, you can make it public with these policies:

-- Allow public read access to all files in message-media bucket
CREATE POLICY "Public read access for message-media"
ON storage.objects FOR SELECT
USING (bucket_id = 'message-media');

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'message-media' 
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own files
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'message-media'
  AND auth.uid()::text = split_part((storage.foldername(name))[array_length(storage.foldername(name), 1)], '-', 1)
)
WITH CHECK (
  bucket_id = 'message-media'
  AND auth.uid()::text = split_part((storage.foldername(name))[array_length(storage.foldername(name), 1)], '-', 1)
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'message-media'
  AND auth.uid()::text = split_part((storage.foldername(name))[array_length(storage.foldername(name), 1)], '-', 1)
);

-- Note: If policies already exist, you may need to drop them first:
-- DROP POLICY IF EXISTS "policy_name" ON storage.objects;
