-- ============================================================
-- Storage Bucket RLS Policies for Yoonjaespace
-- Run this in Supabase SQL Editor
-- ============================================================

-- BUCKET: studio-assets
-- For logos, studio images, and other assets
-- Policy: Authenticated users can upload/update/delete

-- Allow authenticated users to SELECT (read) from studio-assets
CREATE POLICY "Allow authenticated users to read studio-assets"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'studio-assets');

-- Allow authenticated users to INSERT (upload) to studio-assets
CREATE POLICY "Allow authenticated users to upload to studio-assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'studio-assets');

-- Allow authenticated users to UPDATE files in studio-assets
CREATE POLICY "Allow authenticated users to update studio-assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'studio-assets')
WITH CHECK (bucket_id = 'studio-assets');

-- Allow authenticated users to DELETE files in studio-assets
CREATE POLICY "Allow authenticated users to delete from studio-assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'studio-assets');

-- ============================================================

-- BUCKET: studio-photos
-- For client photos and booking images
-- Policy: Authenticated users can upload/update/delete
-- Public can read (for client photo delivery)

-- Allow PUBLIC to SELECT (read) from studio-photos
CREATE POLICY "Allow public to read studio-photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'studio-photos');

-- Allow authenticated users to INSERT (upload) to studio-photos
CREATE POLICY "Allow authenticated users to upload to studio-photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'studio-photos');

-- Allow authenticated users to UPDATE files in studio-photos
CREATE POLICY "Allow authenticated users to update studio-photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'studio-photos')
WITH CHECK (bucket_id = 'studio-photos');

-- Allow authenticated users to DELETE files in studio-photos
CREATE POLICY "Allow authenticated users to delete from studio-photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'studio-photos');

-- ============================================================
-- Verify policies (optional - just for checking)
-- ============================================================

-- Check all storage policies
-- SELECT * FROM pg_policies WHERE tablename = 'objects';
