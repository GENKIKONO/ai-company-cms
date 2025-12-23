-- =====================================================
-- 公開テーブル/ビューのホワイトリスト
-- anon ユーザーに SELECT を許可するオブジェクト
-- =====================================================
-- 目的: 匿名アクセスが必要なデータのみ明示的に許可
-- 原則: デフォルト拒否 → 必要なもののみ GRANT
-- =====================================================

-- =====================================================
-- 1. 公開ビュー（匿名閲覧用）
-- =====================================================
-- これらは is_published = true のデータのみを返す安全なビュー

-- 公開企業一覧ビュー
GRANT SELECT ON public.public_organizations TO anon;
GRANT SELECT ON public.v_public_organizations TO anon;

-- 公開サービス（JSON-LD用）
GRANT SELECT ON public.public_services_jsonld TO anon;

-- =====================================================
-- 2. CMS公開コンテンツ
-- =====================================================
-- サイト全体の設定・コンテンツ

-- サイト設定（ヘッダー、フッター等）
-- GRANT SELECT ON public.cms_site_settings TO anon;

-- FAQアイテム
-- GRANT SELECT ON public.cms_faq_items TO anon;

-- ニュース/お知らせ
-- GRANT SELECT ON public.cms_news TO anon;

-- =====================================================
-- 3. プラン情報（価格ページ用）
-- =====================================================
-- GRANT SELECT ON public.plans TO anon;
-- GRANT SELECT ON public.plan_features TO anon;

-- =====================================================
-- 4. 検証クエリ
-- =====================================================

-- 公開ビュー/テーブルの anon 権限確認
SELECT
  schemaname,
  tablename,
  grantee,
  privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND tablename IN (
    'public_organizations',
    'v_public_organizations',
    'public_services_jsonld',
    'cms_site_settings',
    'cms_faq_items',
    'cms_news',
    'plans',
    'plan_features'
  )
  AND grantee = 'anon'
ORDER BY tablename;

-- =====================================================
-- 5. ビューのセキュリティ確認
-- =====================================================
-- public_organizations ビューが is_published フィルターを持つか確認
SELECT
  viewname,
  definition
FROM pg_views
WHERE schemaname = 'public'
  AND viewname IN ('public_organizations', 'v_public_organizations')
LIMIT 2;

-- =====================================================
-- 注意事項
-- =====================================================
-- 1. ビューは基底テーブルへの直接アクセスを防ぐ
-- 2. RLS は VIEW には適用されない → ビュー定義で WHERE 句が重要
-- 3. 新しい公開コンテンツを追加する際はこのファイルに追記
-- 4. 機密データを含むテーブルは絶対に anon に GRANT しない
