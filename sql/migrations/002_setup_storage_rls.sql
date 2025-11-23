-- =====================================================
-- Storage RLS Policies Setup for Assets Bucket
-- Migration: 002_setup_storage_rls
-- =====================================================

-- Drop existing policies if they exist to avoid conflicts
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
    WITH CHECK (bucket_id = 'assets');

-- Policy 3: UPDATE (更新許可)
-- 目的: ファイルをアップロードしたユーザーが自分のファイルを更新できるようにする
CREATE POLICY "assets_update_policy" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'assets' AND auth.uid() = owner)
    WITH CHECK (bucket_id = 'assets' AND auth.uid() = owner);

-- Policy 4: DELETE (削除許可)
-- 目的: ファイルをアップロードしたユーザーが自分のファイルを削除できるようにする
CREATE POLICY "assets_delete_policy" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'assets' AND auth.uid() = owner);

-- Ensure the bucket allows public access
UPDATE storage.buckets 
SET public = true 
WHERE name = 'assets';

-- Ensure RLS is enabled on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;