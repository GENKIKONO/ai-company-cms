-- 1) established_at カラムの詳細情報確認
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length,
  numeric_precision,
  datetime_precision
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'organizations'
  AND column_name IN ('established_at', 'founded');

-- 2) established_at を参照するトリガー確認
SELECT 
  t.tgname as trigger_name,
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = (SELECT oid FROM pg_class WHERE relname = 'organizations')
  AND pg_get_functiondef(p.oid) ILIKE '%established_at%';

-- 3) established_at を参照する関数確認
SELECT 
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND pg_get_functiondef(p.oid) ILIKE '%established_at%';

-- 4) established_at を参照するビュー確認
SELECT 
  viewname,
  definition
FROM pg_views
WHERE schemaname = 'public'
  AND definition ILIKE '%established_at%';

-- 5) テーブル制約確認
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  pg_get_constraintdef(c.oid) as constraint_definition
FROM information_schema.table_constraints tc
JOIN pg_constraint c ON c.conname = tc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'organizations'
  AND pg_get_constraintdef(c.oid) ILIKE '%established_at%';