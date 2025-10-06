-- RLS/スキーマ/ポリシー検査用SQLクエリ集
-- 目的: 既存環境を壊さない読み取り専用の検査
-- 対象: posts, services, case_studies, faqs テーブル

-- ============================================
-- 1. RLS有効テーブル一覧
-- ============================================
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN '✅ RLS有効'
    ELSE '❌ RLS無効'
  END as status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('posts', 'services', 'case_studies', 'faqs')
ORDER BY tablename;

-- ============================================
-- 2. 各テーブルのポリシー一覧
-- ============================================
SELECT 
  tablename,
  policyname,
  cmd as command,
  permissive,
  roles,
  CASE cmd
    WHEN 'INSERT' THEN '🟢 INSERT'
    WHEN 'SELECT' THEN '🔵 SELECT'
    WHEN 'UPDATE' THEN '🟡 UPDATE'
    WHEN 'DELETE' THEN '🔴 DELETE'
    ELSE '❓ ' || cmd
  END as command_icon
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('posts', 'services', 'case_studies', 'faqs')
ORDER BY tablename, cmd, policyname;

-- ============================================
-- 3. 必須カラム有無チェック
-- ============================================
WITH required_columns AS (
  SELECT unnest(ARRAY['organization_id', 'created_by', 'created_at', 'updated_at']) as column_name
),
target_tables AS (
  SELECT unnest(ARRAY['posts', 'services', 'case_studies', 'faqs']) as table_name
),
table_columns AS (
  SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
  FROM information_schema.columns 
  WHERE table_schema = 'public' 
    AND table_name IN ('posts', 'services', 'case_studies', 'faqs')
)
SELECT 
  tt.table_name,
  rc.column_name,
  CASE 
    WHEN tc.column_name IS NOT NULL THEN '✅ 存在'
    ELSE '❌ 不足'
  END as status,
  tc.data_type,
  tc.is_nullable
FROM target_tables tt
CROSS JOIN required_columns rc
LEFT JOIN table_columns tc ON tt.table_name = tc.table_name AND rc.column_name = tc.column_name
ORDER BY tt.table_name, rc.column_name;

-- ============================================
-- 4. 外部キー制約確認
-- ============================================
SELECT 
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name,
  CASE 
    WHEN ccu.table_name = 'organizations' AND kcu.column_name = 'organization_id' THEN '✅ 正常'
    WHEN ccu.table_name = 'users' AND kcu.column_name = 'created_by' THEN '✅ 正常'
    ELSE '⚠️  確認要'
  END as status
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('posts', 'services', 'case_studies', 'faqs')
  AND kcu.column_name IN ('organization_id', 'created_by')
ORDER BY tc.table_name, kcu.column_name;

-- ============================================
-- 5. organizations テーブル確認
-- ============================================
SELECT 
  'organizations' as table_name,
  COUNT(*) as record_count,
  MIN(created_at) as oldest_record,
  MAX(created_at) as newest_record,
  COUNT(DISTINCT created_by) as unique_creators
FROM public.organizations;

-- ============================================
-- 6. auth.users 参照確認（権限がある場合のみ）
-- ============================================
-- 注意: auth.users への直接アクセスは制限されている場合があります
-- service_role 権限でのみ実行可能

-- SELECT 
--   COUNT(*) as user_count,
--   COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmed_users,
--   COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as recent_users
-- FROM auth.users;

-- ============================================
-- 7. ポリシー詳細情報
-- ============================================
SELECT 
  tablename,
  policyname,
  cmd as command,
  CASE 
    WHEN qual IS NOT NULL THEN '✅ USING句あり'
    ELSE '⚠️  USING句なし'
  END as using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN '✅ WITH CHECK句あり'
    ELSE '⚠️  WITH CHECK句なし'
  END as with_check_clause,
  CASE cmd
    WHEN 'INSERT' THEN 
      CASE WHEN with_check IS NOT NULL THEN '✅ 適切' ELSE '❌ WITH CHECK必須' END
    WHEN 'SELECT' THEN 
      CASE WHEN qual IS NOT NULL THEN '✅ 適切' ELSE '❌ USING必須' END
    WHEN 'UPDATE' THEN 
      CASE WHEN qual IS NOT NULL THEN '✅ 適切' ELSE '❌ USING必須' END
    WHEN 'DELETE' THEN 
      CASE WHEN qual IS NOT NULL THEN '✅ 適切' ELSE '❌ USING必須' END
    ELSE '❓ 不明'
  END as policy_completeness
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('posts', 'services', 'case_studies', 'faqs')
ORDER BY tablename, cmd, policyname;

-- ============================================
-- 8. テーブルサイズと統計情報
-- ============================================
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size,
  pg_stat_get_tuples_inserted(oid) as inserts,
  pg_stat_get_tuples_updated(oid) as updates,
  pg_stat_get_tuples_deleted(oid) as deletes
FROM pg_tables pt
JOIN pg_class pc ON pc.relname = pt.tablename
WHERE schemaname = 'public' 
  AND tablename IN ('posts', 'services', 'case_studies', 'faqs')
ORDER BY tablename;

-- ============================================
-- 9. インデックス確認
-- ============================================
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef,
  CASE 
    WHEN indexname LIKE '%organization_id%' THEN '🎯 組織ID'
    WHEN indexname LIKE '%created_by%' THEN '👤 作成者'
    WHEN indexname LIKE '%created_at%' THEN '📅 作成日'
    WHEN indexname LIKE '%pkey%' THEN '🔑 主キー'
    ELSE '📋 その他'
  END as index_type
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('posts', 'services', 'case_studies', 'faqs')
ORDER BY tablename, indexname;

-- ============================================
-- 10. 統合サマリ（最終チェック）
-- ============================================
WITH table_checks AS (
  SELECT 
    'posts' as table_name,
    (SELECT rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'posts') as rls_enabled,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'posts') as policy_count,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'posts' AND column_name IN ('organization_id', 'created_by', 'created_at', 'updated_at')) as required_columns_count
  UNION ALL
  SELECT 
    'services' as table_name,
    (SELECT rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'services') as rls_enabled,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'services') as policy_count,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'services' AND column_name IN ('organization_id', 'created_by', 'created_at', 'updated_at')) as required_columns_count
  UNION ALL
  SELECT 
    'case_studies' as table_name,
    (SELECT rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'case_studies') as rls_enabled,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'case_studies') as policy_count,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'case_studies' AND column_name IN ('organization_id', 'created_by', 'created_at', 'updated_at')) as required_columns_count
  UNION ALL
  SELECT 
    'faqs' as table_name,
    (SELECT rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'faqs') as rls_enabled,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'faqs') as policy_count,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'faqs' AND column_name IN ('organization_id', 'created_by', 'created_at', 'updated_at')) as required_columns_count
)
SELECT 
  table_name,
  CASE WHEN rls_enabled THEN '✅' ELSE '❌' END as rls_status,
  CASE WHEN policy_count >= 2 THEN '✅' ELSE '❌' END as policy_status,
  CASE WHEN required_columns_count = 4 THEN '✅' ELSE '❌' END as columns_status,
  CASE 
    WHEN rls_enabled AND policy_count >= 2 AND required_columns_count = 4 THEN '🎉 完全'
    ELSE '⚠️  要修正'
  END as overall_status,
  policy_count || ' policies' as policy_detail,
  required_columns_count || '/4 columns' as column_detail
FROM table_checks
ORDER BY table_name;

-- ============================================
-- 使用方法:
-- 1. Supabaseダッシュボード > SQL Editor で実行
-- 2. または psql で実行: psql -f rls_check.sql
-- 3. 各セクションを個別に実行することも可能
-- ============================================