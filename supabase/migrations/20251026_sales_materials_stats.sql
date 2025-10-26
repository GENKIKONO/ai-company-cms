/**
 * 営業資料統計機能実装
 * sales_materials_stats テーブルとRLSポリシー
 * 作成日: 2025/10/26
 */

-- === 営業資料統計テーブル作成 ===

-- sales_materials_stats テーブル（冪等化対応）
CREATE TABLE IF NOT EXISTS public.sales_materials_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID REFERENCES public.sales_materials(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('view', 'download')),
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス追加（クエリパフォーマンス最適化）
CREATE INDEX IF NOT EXISTS idx_sales_materials_stats_material_id 
  ON public.sales_materials_stats(material_id);

CREATE INDEX IF NOT EXISTS idx_sales_materials_stats_created_at 
  ON public.sales_materials_stats(created_at);

CREATE INDEX IF NOT EXISTS idx_sales_materials_stats_action 
  ON public.sales_materials_stats(action);

CREATE INDEX IF NOT EXISTS idx_sales_materials_stats_material_action_date 
  ON public.sales_materials_stats(material_id, action, created_at);

-- === RLSポリシー設定 ===

-- RLS有効化
ALTER TABLE public.sales_materials_stats ENABLE ROW LEVEL SECURITY;

-- ポリシー存在チェック関数（再利用）
CREATE OR REPLACE FUNCTION policy_exists_stats(table_name text, policy_name text)
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

-- 挿入ポリシー（匿名ユーザーも含め全員許可）
DO $$
BEGIN
  IF NOT policy_exists_stats('sales_materials_stats', 'sales_materials_stats_insert') THEN
    CREATE POLICY "sales_materials_stats_insert" ON public.sales_materials_stats
    FOR INSERT WITH CHECK (
      -- 統計記録は誰でも可能（匿名ユーザー含む）
      true
    );
  END IF;
END $$;

-- 読み取りポリシー（管理者のみ）
DO $$
BEGIN
  IF NOT policy_exists_stats('sales_materials_stats', 'sales_materials_stats_read') THEN
    CREATE POLICY "sales_materials_stats_read" ON public.sales_materials_stats
    FOR SELECT USING (
      -- 管理者のみ閲覧可能
      is_admin()
    );
  END IF;
END $$;

-- 更新・削除ポリシー（管理者のみ）
DO $$
BEGIN
  IF NOT policy_exists_stats('sales_materials_stats', 'sales_materials_stats_update') THEN
    CREATE POLICY "sales_materials_stats_update" ON public.sales_materials_stats
    FOR UPDATE USING (
      is_admin()
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT policy_exists_stats('sales_materials_stats', 'sales_materials_stats_delete') THEN
    CREATE POLICY "sales_materials_stats_delete" ON public.sales_materials_stats
    FOR DELETE USING (
      is_admin()
    );
  END IF;
END $$;

-- === 統計集計用ビュー作成 ===

-- 営業資料統計サマリービュー
CREATE OR REPLACE VIEW public.sales_materials_stats_summary AS
SELECT 
  s.material_id,
  m.title as material_title,
  o.name as organization_name,
  COUNT(CASE WHEN s.action = 'view' THEN 1 END) as total_views,
  COUNT(CASE WHEN s.action = 'download' THEN 1 END) as total_downloads,
  COUNT(DISTINCT CASE WHEN s.action = 'view' THEN s.user_id END) as unique_viewers,
  COUNT(DISTINCT CASE WHEN s.action = 'download' THEN s.user_id END) as unique_downloaders,
  MAX(CASE WHEN s.action = 'view' THEN s.created_at END) as last_viewed_at,
  MAX(CASE WHEN s.action = 'download' THEN s.created_at END) as last_downloaded_at,
  MAX(s.created_at) as last_activity_at
FROM public.sales_materials_stats s
JOIN public.sales_materials m ON s.material_id = m.id
JOIN public.organizations o ON m.organization_id = o.id
GROUP BY s.material_id, m.title, o.name;

-- 日別統計ビュー
CREATE OR REPLACE VIEW public.sales_materials_daily_stats AS
SELECT 
  DATE(s.created_at) as date,
  s.material_id,
  m.title as material_title,
  COUNT(CASE WHEN s.action = 'view' THEN 1 END) as views,
  COUNT(CASE WHEN s.action = 'download' THEN 1 END) as downloads,
  COUNT(DISTINCT CASE WHEN s.action = 'view' THEN s.user_id END) as unique_views,
  COUNT(DISTINCT CASE WHEN s.action = 'download' THEN s.user_id END) as unique_downloads
FROM public.sales_materials_stats s
JOIN public.sales_materials m ON s.material_id = m.id
GROUP BY DATE(s.created_at), s.material_id, m.title
ORDER BY date DESC;

-- === ビューのRLSポリシー設定 ===

-- サマリービューのRLS（管理者のみ）
ALTER VIEW public.sales_materials_stats_summary SET (security_invoker = true);
ALTER VIEW public.sales_materials_daily_stats SET (security_invoker = true);

-- === 統計関数作成 ===

-- 営業資料の人気度スコア計算関数
CREATE OR REPLACE FUNCTION get_material_popularity_score(material_uuid UUID)
RETURNS NUMERIC AS $$
DECLARE
  view_count INTEGER;
  download_count INTEGER;
  unique_users INTEGER;
  popularity_score NUMERIC;
BEGIN
  SELECT 
    COUNT(CASE WHEN action = 'view' THEN 1 END),
    COUNT(CASE WHEN action = 'download' THEN 1 END),
    COUNT(DISTINCT user_id)
  INTO view_count, download_count, unique_users
  FROM public.sales_materials_stats
  WHERE material_id = material_uuid
    AND created_at >= NOW() - INTERVAL '30 days';

  -- スコア計算: ダウンロード重視 + ユニーク性考慮
  popularity_score := (view_count * 1.0) + (download_count * 3.0) + (unique_users * 2.0);
  
  RETURN COALESCE(popularity_score, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- === クリーンアップ ===

-- ヘルパー関数削除
DROP FUNCTION IF EXISTS policy_exists_stats(text, text);

-- PostgREST スキーマリロード
SELECT pg_notify('pgrst','reload schema');

-- 完了メッセージ
DO $$
BEGIN
  RAISE NOTICE '✅ Sales Materials Stats Implementation: SUCCESS';
  RAISE NOTICE '✅ Table: sales_materials_stats with RLS policies';
  RAISE NOTICE '✅ Views: stats_summary and daily_stats created';
  RAISE NOTICE '✅ Security: Anonymous insert allowed, admin read-only access';
  RAISE NOTICE '✅ Functions: popularity_score calculation available';
END
$$;