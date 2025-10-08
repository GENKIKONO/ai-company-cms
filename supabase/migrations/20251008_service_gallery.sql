/**
 * サービスギャラリー・動画機能実装
 * services.video_url 追加 + service-gallery バケット作成
 * 作成日: 2025/10/8
 */

-- === services テーブルにvideo_urlカラム追加 ===
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS video_url TEXT;

-- === Storage バケット設定 ===

-- service-gallery バケット作成（存在しない場合のみ）
INSERT INTO storage.buckets (id, name, public)
VALUES ('service-gallery', 'service-gallery', true)
ON CONFLICT (id) DO NOTHING;

-- === RLS ポリシー設定 ===

-- 既存の同名ポリシーがあれば削除
DROP POLICY IF EXISTS "service gallery public select" ON storage.objects;
DROP POLICY IF EXISTS "service gallery owner insert" ON storage.objects;
DROP POLICY IF EXISTS "service gallery owner update" ON storage.objects;
DROP POLICY IF EXISTS "service gallery owner delete" ON storage.objects;

-- 公開読み取り（全員）
CREATE POLICY "service gallery public select"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'service-gallery');

-- オーナーのみ書き込み（prefix: serviceId/）
CREATE POLICY "service gallery owner insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'service-gallery'
  AND EXISTS (
    SELECT 1
    FROM services s
    JOIN organizations o ON o.id = s.organization_id
    WHERE s.id::text = split_part(storage.objects.name, '/', 1)
      AND o.created_by = auth.uid()
  )
);

CREATE POLICY "service gallery owner update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'service-gallery'
  AND EXISTS (
    SELECT 1
    FROM services s
    JOIN organizations o ON o.id = s.organization_id
    WHERE s.id::text = split_part(storage.objects.name, '/', 1)
      AND o.created_by = auth.uid()
  )
);

CREATE POLICY "service gallery owner delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'service-gallery'
  AND EXISTS (
    SELECT 1
    FROM services s
    JOIN organizations o ON o.id = s.organization_id
    WHERE s.id::text = split_part(storage.objects.name, '/', 1)
      AND o.created_by = auth.uid()
  )
);

-- PostgREST スキーマリロード
SELECT pg_notify('pgrst','reload schema');

-- 完了メッセージ
DO $$
BEGIN
  RAISE NOTICE '✅ Service Gallery Implementation: SUCCESS';
  RAISE NOTICE '✅ Column: services.video_url added';
  RAISE NOTICE '✅ Storage: service-gallery bucket with public access';
  RAISE NOTICE '✅ Security: Service owner-based access control implemented';
END
$$;