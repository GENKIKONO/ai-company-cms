-- =====================================================
-- セキュリティ強化: anon アクセス制限（存在確認付き）
-- 商用レベル運用のための権限締め付け
-- =====================================================
-- 適用済み: 2024-12 (Supabase Assistant で実行確認済み)
-- 対象: 実在するテーブル・関数のみ
-- =====================================================

-- =====================================================
-- 1. 直接実行版（既に適用済み）
-- =====================================================
-- 以下は Supabase Assistant で実行・検証済み:
--
-- REVOKE SELECT ON public.organization_ai_usage FROM anon;
-- REVOKE SELECT ON public.monthly_report_jobs FROM anon;
-- REVOKE SELECT ON public.ops_audit FROM anon;
-- REVOKE SELECT ON public.site_admins FROM anon;
-- REVOKE EXECUTE ON FUNCTION public.increment_org_interview_stats(uuid, integer, integer) FROM anon;

-- =====================================================
-- 2. 存在確認付きテンプレート（将来の追加用）
-- =====================================================
-- エラーを回避しながらREVOKEを実行するパターン

DO $$
BEGIN
  -- organization_ai_usage
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'organization_ai_usage'
  ) THEN
    EXECUTE 'REVOKE SELECT ON public.organization_ai_usage FROM anon';
    RAISE NOTICE 'Revoked SELECT on organization_ai_usage from anon';
  END IF;

  -- monthly_report_jobs
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'monthly_report_jobs'
  ) THEN
    EXECUTE 'REVOKE SELECT ON public.monthly_report_jobs FROM anon';
    RAISE NOTICE 'Revoked SELECT on monthly_report_jobs from anon';
  END IF;

  -- ops_audit
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'ops_audit'
  ) THEN
    EXECUTE 'REVOKE SELECT ON public.ops_audit FROM anon';
    RAISE NOTICE 'Revoked SELECT on ops_audit from anon';
  END IF;

  -- site_admins
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'site_admins'
  ) THEN
    EXECUTE 'REVOKE SELECT ON public.site_admins FROM anon';
    RAISE NOTICE 'Revoked SELECT on site_admins from anon';
  END IF;

  -- ai_interview_sessions (内部データ)
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'ai_interview_sessions'
  ) THEN
    EXECUTE 'REVOKE SELECT ON public.ai_interview_sessions FROM anon';
    RAISE NOTICE 'Revoked SELECT on ai_interview_sessions from anon';
  END IF;

  -- increment_org_interview_stats 関数
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'increment_org_interview_stats'
      AND pg_get_function_identity_arguments(p.oid) = 'p_org_id uuid, p_interview_count integer, p_message_count integer'
  ) THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.increment_org_interview_stats(uuid, integer, integer) FROM anon';
    RAISE NOTICE 'Revoked EXECUTE on increment_org_interview_stats from anon';
  END IF;

END $$;

-- =====================================================
-- 3. 検証クエリ
-- =====================================================

-- テーブル権限の最終確認
SELECT
  schemaname,
  tablename,
  grantee,
  privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND tablename IN (
    'organization_ai_usage',
    'monthly_report_jobs',
    'ops_audit',
    'site_admins',
    'ai_interview_sessions'
  )
  AND grantee IN ('anon', 'authenticated')
ORDER BY tablename, grantee, privilege_type;

-- RPC権限の最終確認
SELECT
  routine_name,
  grantee,
  privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public'
  AND routine_name IN ('increment_org_interview_stats')
  AND grantee IN ('anon', 'authenticated')
ORDER BY routine_name, grantee, privilege_type;

-- =====================================================
-- 4. 公開テーブルのホワイトリスト（anon SELECT 許可）
-- =====================================================
-- 以下のテーブルは匿名ユーザーからの読み取りが必要:
--
-- CMS公開コンテンツ:
--   - cms_site_settings (公開設定)
--   - cms_pages (公開ページ)
--   - cms_faq_items (FAQ)
--   - cms_news (ニュース)
--
-- 公開企業情報:
--   - organizations (is_published = true のみ、RLSで制御)
--   - organization_services
--   - organization_gallery
--
-- プラン情報:
--   - plans (プラン一覧表示)
--   - plan_features
--
-- 公開グラント例:
-- GRANT SELECT ON public.cms_site_settings TO anon;
-- GRANT SELECT ON public.cms_pages TO anon;
-- GRANT SELECT ON public.plans TO anon;

-- =====================================================
-- 5. 除外したオブジェクト（存在しないため）
-- =====================================================
-- テーブル:
--   - public.ai_citations (存在しない → ai_citations_responses, ai_citations_items が類似)
--
-- 関数:
--   - auto_block_ip(text, text, integer) - 未確認
--   - get_plan_features(uuid) - 未確認
--   - count_report_regenerations(uuid, date, date) - 未確認
--   - fn_build_monthly_kpis(uuid, date, date) - 未確認
--
-- これらは将来追加された場合に存在確認付きテンプレートで対応

-- =====================================================
-- 6. ロールバック用
-- =====================================================
-- 必要な場合のみ実行:
--
-- GRANT SELECT ON public.organization_ai_usage TO anon;
-- GRANT SELECT ON public.monthly_report_jobs TO anon;
-- GRANT SELECT ON public.ops_audit TO anon;
-- GRANT SELECT ON public.site_admins TO anon;
-- GRANT EXECUTE ON FUNCTION public.increment_org_interview_stats(uuid, integer, integer) TO anon;
