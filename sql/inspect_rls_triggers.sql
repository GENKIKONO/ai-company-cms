-- =============================================================================
-- RLS ポリシー・トリガー 調査クエリ
-- Supabase SQL Editor で実行し、結果を共有してください
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. RLS ポリシー一覧（ai_monthly_reports / monthly_reports）
-- -----------------------------------------------------------------------------
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual AS using_condition,
  with_check
FROM pg_policies
WHERE tablename IN ('ai_monthly_reports', 'monthly_reports', 'monthly_report_jobs', 'monthly_report_sections')
ORDER BY tablename, policyname;

-- -----------------------------------------------------------------------------
-- 2. RLS 有効/無効 確認
-- -----------------------------------------------------------------------------
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled,
  forcerowsecurity AS rls_forced
FROM pg_tables
WHERE tablename IN ('ai_monthly_reports', 'monthly_reports', 'monthly_report_jobs', 'monthly_report_sections')
ORDER BY tablename;

-- -----------------------------------------------------------------------------
-- 3. トリガー一覧（月次レポート関連テーブル）
-- -----------------------------------------------------------------------------
SELECT
  event_object_table AS table_name,
  trigger_name,
  event_manipulation AS event,
  action_timing AS timing,
  action_statement AS function_call,
  CASE WHEN is_trigger_enabled = 'O' THEN 'enabled'
       WHEN is_trigger_enabled = 'D' THEN 'disabled'
       ELSE is_trigger_enabled END AS status
FROM information_schema.triggers
WHERE event_object_table IN ('ai_monthly_reports', 'monthly_reports', 'monthly_report_jobs', 'monthly_report_sections')
ORDER BY event_object_table, trigger_name;

-- -----------------------------------------------------------------------------
-- 4. トリガー関数の定義（内容確認用）
-- -----------------------------------------------------------------------------
SELECT
  p.proname AS function_name,
  pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname LIKE '%monthly%'
ORDER BY p.proname;

-- -----------------------------------------------------------------------------
-- 5. 外部キー制約（参照整合性確認）
-- -----------------------------------------------------------------------------
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('ai_monthly_reports', 'monthly_reports', 'monthly_report_jobs', 'monthly_report_sections')
ORDER BY tc.table_name;

-- -----------------------------------------------------------------------------
-- 6. 既存インデックス確認
-- -----------------------------------------------------------------------------
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('ai_monthly_reports', 'monthly_reports')
ORDER BY tablename, indexname;
