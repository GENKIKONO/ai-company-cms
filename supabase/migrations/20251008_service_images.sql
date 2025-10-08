/**
 * サービス画像機能実装
 * services テーブルに image_url カラム追加 + service-images バケット作成
 * 作成日: 2025/10/8
 */

-- === services テーブルにimage_urlカラム追加 ===

-- image_url カラム追加（存在しない場合のみ）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'services' 
    AND column_name = 'image_url'
  ) THEN
    ALTER TABLE public.services ADD COLUMN image_url TEXT;
    RAISE NOTICE '✅ Added image_url column to services table';
  ELSE
    RAISE NOTICE '⚠️ image_url column already exists in services table';
  END IF;
END $$;

-- === Storage バケット設定 ===

-- service-images バケット作成（存在しない場合のみ）
INSERT INTO storage.buckets (id, name, public)
VALUES ('service-images', 'service-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS ポリシー設定

-- 読み取りポリシー（匿名ユーザー含む全員）
CREATE POLICY IF NOT EXISTS "service_images_storage_select"
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'service-images'
);

-- 挿入ポリシー（認証済みユーザーのみ）
CREATE POLICY IF NOT EXISTS "service_images_storage_insert"
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'service-images'
  AND auth.uid() IS NOT NULL
);

-- 更新ポリシー（ファイルパスにuser_idが含まれる場合のみ）
CREATE POLICY IF NOT EXISTS "service_images_storage_update"
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'service-images'
  AND auth.uid() IS NOT NULL
  AND (
    -- ファイルパスの最初のセグメントがサービスIDと一致する場合
    -- パス形式: {serviceId}/main.webp
    EXISTS (
      SELECT 1 FROM public.services s
      JOIN public.organizations o ON s.organization_id = o.id
      WHERE s.id::text = split_part(name, '/', 1)
      AND o.created_by = auth.uid()
    )
  )
);

-- 削除ポリシー（ファイルパスにuser_idが含まれる場合のみ）
CREATE POLICY IF NOT EXISTS "service_images_storage_delete"
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'service-images'
  AND auth.uid() IS NOT NULL
  AND (
    -- ファイルパスの最初のセグメントがサービスIDと一致する場合
    -- パス形式: {serviceId}/main.webp
    EXISTS (
      SELECT 1 FROM public.services s
      JOIN public.organizations o ON s.organization_id = o.id
      WHERE s.id::text = split_part(name, '/', 1)
      AND o.created_by = auth.uid()
    )
  )
);

-- PostgREST スキーマリロード
SELECT pg_notify('pgrst','reload schema');

-- 完了メッセージ
DO $$
BEGIN
  RAISE NOTICE '✅ Service Images Implementation: SUCCESS';
  RAISE NOTICE '✅ Column: services.image_url added';
  RAISE NOTICE '✅ Storage: service-images bucket with public access';
  RAISE NOTICE '✅ Security: Service owner-based access control implemented';
END
$$;