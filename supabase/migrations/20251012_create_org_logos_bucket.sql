/**
 * 企業ロゴストレージバケット作成
 * org-logos バケット + RLS ポリシー設定
 * 作成日: 2025/10/12
 */

-- === Storage バケット設定 ===

-- org-logos バケット作成（存在しない場合のみ）
INSERT INTO storage.buckets (id, name, public)
VALUES ('org-logos', 'org-logos', true)
ON CONFLICT (id) DO NOTHING;

-- === RLS ポリシー設定 ===

-- 既存の同名ポリシーがあれば削除
DROP POLICY IF EXISTS "org logos public select" ON storage.objects;
DROP POLICY IF EXISTS "org logos owner insert" ON storage.objects;
DROP POLICY IF EXISTS "org logos owner update" ON storage.objects;
DROP POLICY IF EXISTS "org logos owner delete" ON storage.objects;

-- 公開読み取り（全員）
CREATE POLICY "org logos public select"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'org-logos');

-- 組織オーナーのみ書き込み（prefix: organizationId/）
CREATE POLICY "org logos owner insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'org-logos'
  AND EXISTS (
    SELECT 1
    FROM organizations o
    WHERE o.id::text = split_part(storage.objects.name, '/', 1)
      AND o.created_by = auth.uid()
  )
);

CREATE POLICY "org logos owner update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'org-logos'
  AND EXISTS (
    SELECT 1
    FROM organizations o
    WHERE o.id::text = split_part(storage.objects.name, '/', 1)
      AND o.created_by = auth.uid()
  )
);

CREATE POLICY "org logos owner delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'org-logos'
  AND EXISTS (
    SELECT 1
    FROM organizations o
    WHERE o.id::text = split_part(storage.objects.name, '/', 1)
      AND o.created_by = auth.uid()
  )
);

-- PostgREST スキーマリロード
SELECT pg_notify('pgrst','reload schema');

-- 完了メッセージ
DO $$
BEGIN
  RAISE NOTICE '✅ Organization Logo Storage: SUCCESS';
  RAISE NOTICE '✅ Storage: org-logos bucket with public access';
  RAISE NOTICE '✅ Security: Organization owner-based access control implemented';
  RAISE NOTICE '✅ Pattern: {organizationId}/logo.{ext}';
END
$$;