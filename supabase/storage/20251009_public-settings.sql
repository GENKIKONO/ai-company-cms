-- Create public bucket for admin-managed assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('public-settings', 'public-settings', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies on storage.objects for public-settings bucket

-- Public read access for all files in public-settings bucket
DROP POLICY IF EXISTS "public settings public read" ON storage.objects;
CREATE POLICY "public settings public read"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'public-settings');

-- Authenticated users can insert files to public-settings bucket
DROP POLICY IF EXISTS "public settings owner write" ON storage.objects;
CREATE POLICY "public settings owner write"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'public-settings');

-- Authenticated users can delete files from public-settings bucket
DROP POLICY IF EXISTS "public settings owner delete" ON storage.objects;
CREATE POLICY "public settings owner delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'public-settings');

-- Authenticated users can update files in public-settings bucket
DROP POLICY IF EXISTS "public settings owner update" ON storage.objects;
CREATE POLICY "public settings owner update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'public-settings')
WITH CHECK (bucket_id = 'public-settings');