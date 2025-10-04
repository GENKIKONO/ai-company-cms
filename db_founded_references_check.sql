-- 1) トリガーと関数定義でfoundedを参照しているものを検索
SELECT 
  t.tgname as trigger_name,
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE pg_get_functiondef(p.oid) ILIKE '%founded%'
  AND t.tgrelid = (SELECT oid FROM pg_class WHERE relname = 'organizations');

-- 2) すべての関数でfoundedを参照しているものを全文検索
SELECT 
  schemaname,
  proname as function_name,
  pg_get_functiondef(oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE pg_get_functiondef(p.oid) ILIKE '%founded%'
  AND n.nspname IN ('public', 'auth', 'storage');

-- 3) ビュー、制約、デフォルト、RLSポリシーでfoundedを参照しているものを検索
-- ビューの検索
SELECT 
  schemaname,
  viewname,
  definition
FROM pg_views
WHERE definition ILIKE '%founded%'
  AND schemaname = 'public';

-- 制約の検索
SELECT 
  tc.constraint_name,
  tc.table_name,
  pg_get_constraintdef(c.oid) as constraint_definition
FROM information_schema.table_constraints tc
JOIN pg_constraint c ON c.conname = tc.constraint_name
WHERE pg_get_constraintdef(c.oid) ILIKE '%founded%'
  AND tc.table_schema = 'public';

-- RLSポリシーの検索
SELECT 
  schemaname,
  tablename,
  policyname,
  qual,
  with_check
FROM pg_policies
WHERE (qual ILIKE '%founded%' OR with_check ILIKE '%founded%')
  AND schemaname = 'public';

-- カラムのデフォルト値の検索
SELECT 
  table_name,
  column_name,
  column_default
FROM information_schema.columns
WHERE column_default ILIKE '%founded%'
  AND table_schema = 'public';