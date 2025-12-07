-- =============================================
-- P1-6: RLS ポリシー一覧取得クエリ
-- =============================================
--
-- このDDLはSupabaseダッシュボードで実行済みです
-- 現在のRLSポリシー設定を確認するためのクエリ
--
-- 実行方法：
-- 1. Supabaseダッシュボード → SQL Editor
-- 2. 以下のクエリを実行
-- 3. 結果をCSV等でエクスポート可能

-- 現在適用されているRLSポリシーの一覧を取得
SELECT 
  schemaname,           -- スキーマ名（通常は 'public'）
  tablename,            -- テーブル名
  policyname,           -- ポリシー名
  cmd,                  -- 操作種別（SELECT, INSERT, UPDATE, DELETE, ALL）
  roles,                -- 適用されるロール配列
  using,                -- 条件式（SELECT/DELETE用）
  with_check            -- 条件式（INSERT/UPDATE用）
FROM pg_policies 
WHERE schemaname = 'public'  -- publicスキーマのポリシーのみ
ORDER BY tablename, policyname;

-- 特定テーブルのポリシーのみ確認する場合
-- SELECT 
--   schemaname,
--   tablename,
--   policyname,
--   cmd,
--   roles,
--   using,
--   with_check
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
--   AND tablename = 'organizations'  -- 対象テーブル名を指定
-- ORDER BY policyname;

-- RLS有効テーブルの一覧確認
-- SELECT 
--   schemaname,
--   tablename,
--   rowsecurity  -- RLSが有効かどうか
-- FROM pg_tables 
-- WHERE schemaname = 'public'
--   AND rowsecurity = true
-- ORDER BY tablename;

-- 使用例：
-- 1. 上記クエリを実行してポリシー一覧を確認
-- 2. 気になるポリシーがある場合は、該当テーブルで実際にクエリを試す
-- 3. 結果を admin.rls_test_results テーブルに記録