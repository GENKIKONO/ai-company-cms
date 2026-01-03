-- =====================================================
-- Storage RLS Policies Setup for Assets Bucket
-- Fixes logo upload RLS policy violations
-- =====================================================

-- Enable RLS on storage.objects table if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "assets_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "assets_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "assets_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "assets_delete_policy" ON storage.objects;

-- Policy 1: SELECT (閲覧許可)
-- 目的: 認証済み/匿名ユーザーが公開されているロゴにアクセス可能にする
CREATE POLICY "assets_select_policy" ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = 'assets');

-- Policy 2: INSERT (アップロード許可)
-- 目的: ログイン済みのユーザーがファイルをアップロードできるようにする
CREATE POLICY "assets_insert_policy" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'assets' AND
        auth.uid() IS NOT NULL
    );

-- Policy 3: UPDATE (更新許可)
-- 目的: ファイルをアップロードしたユーザーが自分のファイルを更新できるようにする
CREATE POLICY "assets_update_policy" ON storage.objects
    FOR UPDATE TO authenticated
    USING (
        bucket_id = 'assets' AND
        auth.uid() = owner
    )
    WITH CHECK (
        bucket_id = 'assets' AND
        auth.uid() = owner
    );

-- Policy 4: DELETE (削除許可)
-- 目的: ファイルをアップロードしたユーザーが自分のファイルを削除できるようにする
CREATE POLICY "assets_delete_policy" ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'assets' AND
        auth.uid() = owner
    );

-- Ensure the bucket allows public access for reading
UPDATE storage.buckets 
SET public = true 
WHERE name = 'assets';

-- Display created policies for verification
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE 'assets_%'
ORDER BY policyname;