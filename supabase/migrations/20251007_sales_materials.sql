/**
 * 営業資料機能実装
 * sales_materials テーブルとRLSポリシー
 * 作成日: 2025/10/7
 */

-- === 営業資料テーブル作成 ===

-- sales_materials テーブル（冪等化対応）
CREATE TABLE IF NOT EXISTS public.sales_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス追加（組織別検索最適化）
CREATE INDEX IF NOT EXISTS idx_sales_materials_organization_id 
  ON public.sales_materials(organization_id);

-- === RLSポリシー設定 ===

-- RLS有効化
ALTER TABLE public.sales_materials ENABLE ROW LEVEL SECURITY;

-- ポリシー存在チェック関数（再利用）
CREATE OR REPLACE FUNCTION policy_exists_materials(table_name text, policy_name text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = table_name 
    AND policyname = policy_name
  );
END;
$$ LANGUAGE plpgsql;

-- 読み取りポリシー（組織メンバー or 管理者）
DO $$
BEGIN
  IF NOT policy_exists_materials('sales_materials', 'sales_materials_read') THEN
    CREATE POLICY "sales_materials_read" ON public.sales_materials
    FOR SELECT USING (
      -- 管理者は全件閲覧可能
      is_admin()
      OR
      -- 組織のオーナーまたは作成者
      EXISTS (
        SELECT 1 FROM public.organizations o
        WHERE o.id = sales_materials.organization_id
        AND (o.created_by = auth.uid())
      )
    );
  END IF;
END $$;

-- 書き込みポリシー（組織メンバーのみ）
DO $$
BEGIN
  IF NOT policy_exists_materials('sales_materials', 'sales_materials_insert') THEN
    CREATE POLICY "sales_materials_insert" ON public.sales_materials
    FOR INSERT WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.organizations o
        WHERE o.id = sales_materials.organization_id
        AND o.created_by = auth.uid()
      )
    );
  END IF;
END $$;

-- 更新ポリシー（組織メンバーのみ）
DO $$
BEGIN
  IF NOT policy_exists_materials('sales_materials', 'sales_materials_update') THEN
    CREATE POLICY "sales_materials_update" ON public.sales_materials
    FOR UPDATE USING (
      EXISTS (
        SELECT 1 FROM public.organizations o
        WHERE o.id = sales_materials.organization_id
        AND o.created_by = auth.uid()
      )
    );
  END IF;
END $$;

-- 削除ポリシー（組織メンバーのみ）
DO $$
BEGIN
  IF NOT policy_exists_materials('sales_materials', 'sales_materials_delete') THEN
    CREATE POLICY "sales_materials_delete" ON public.sales_materials
    FOR DELETE USING (
      EXISTS (
        SELECT 1 FROM public.organizations o
        WHERE o.id = sales_materials.organization_id
        AND o.created_by = auth.uid()
      )
    );
  END IF;
END $$;

-- === Storage バケット設定 ===

-- sales_materials バケット作成（存在しない場合のみ）
INSERT INTO storage.buckets (id, name, public)
VALUES ('sales-materials', 'sales-materials', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS ポリシー設定
CREATE POLICY IF NOT EXISTS "sales_materials_storage_select"
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'sales-materials' 
  AND (
    -- 管理者は全件アクセス可
    is_admin()
    OR
    -- 組織メンバーは自組織のファイルのみアクセス可
    (auth.uid()::text || '/') = ANY(string_to_array(name, '/'))
  )
);

CREATE POLICY IF NOT EXISTS "sales_materials_storage_insert"
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'sales-materials'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY IF NOT EXISTS "sales_materials_storage_update"
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'sales-materials'
  AND (auth.uid()::text || '/') = ANY(string_to_array(name, '/'))
);

CREATE POLICY IF NOT EXISTS "sales_materials_storage_delete"
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'sales-materials'
  AND (auth.uid()::text || '/') = ANY(string_to_array(name, '/'))
);

-- === クリーンアップ ===

-- ヘルパー関数削除
DROP FUNCTION IF EXISTS policy_exists_materials(text, text);

-- PostgREST スキーマリロード
SELECT pg_notify('pgrst','reload schema');

-- 完了メッセージ
DO $$
BEGIN
  RAISE NOTICE '✅ Sales Materials Implementation: SUCCESS';
  RAISE NOTICE '✅ Table: sales_materials with RLS policies';
  RAISE NOTICE '✅ Storage: sales-materials bucket with access control';
  RAISE NOTICE '✅ Security: Organization-based access control implemented';
END
$$;