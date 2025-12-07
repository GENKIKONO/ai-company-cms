-- =============================================
-- P1-6: admin.rls_test_results テーブル DDL
-- =============================================
--
-- このDDLは本番DBに適用済みです
-- RLSテスト結果を記録するための専用テーブル
--
-- 注意: 以下のDDLは既にSupabase本番環境に適用されているため、
-- 再実行する必要はありません。参考用として保存しています。

-- adminスキーマの作成（存在しない場合）
CREATE SCHEMA IF NOT EXISTS admin;

-- RLSテスト結果記録用テーブル
CREATE TABLE IF NOT EXISTS admin.rls_test_results (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_name   text NOT NULL,                    -- テスト名（例: "org_owner_can_read_own_org"）
  table_name  text NOT NULL,                    -- 対象テーブル名
  actor       text NOT NULL,                    -- テスト実行者の説明
  jwt_claims  jsonb,                           -- JWTクレーム情報（将来の自動化用）
  operation   text NOT NULL,                    -- 操作種別（SELECT, INSERT, UPDATE, DELETE）
  expected    text,                            -- 期待結果（"allow", "deny", "partial"等）
  actual      text,                            -- 実際の結果
  passed      boolean NOT NULL,                 -- テスト成功/失敗
  details     jsonb,                           -- 詳細情報（クエリ、結果件数等）
  created_at  timestamptz DEFAULT now()
);

-- RLS設定（セキュリティ強化）
ALTER TABLE admin.rls_test_results ENABLE ROW LEVEL SECURITY;

-- 権限設定（最小権限の原則）
REVOKE ALL ON SCHEMA admin FROM PUBLIC;
REVOKE ALL ON TABLE admin.rls_test_results FROM PUBLIC;

-- インデックス（パフォーマンス向上用）
CREATE INDEX IF NOT EXISTS idx_rls_test_results_table_name 
ON admin.rls_test_results(table_name);

CREATE INDEX IF NOT EXISTS idx_rls_test_results_created_at 
ON admin.rls_test_results(created_at);

CREATE INDEX IF NOT EXISTS idx_rls_test_results_passed 
ON admin.rls_test_results(passed);

-- 使用例（手動テスト結果の記録）:
/*
INSERT INTO admin.rls_test_results (
  test_name,
  table_name,
  actor,
  operation,
  expected,
  actual,
  passed,
  details
) VALUES (
  'org_owner_can_read_own_org',
  'organizations',
  'organization owner (user_id: 12345)',
  'SELECT',
  'allow',
  'allow',
  true,
  jsonb_build_object(
    'query', 'SELECT * FROM organizations WHERE id = $1',
    'result_count', 1,
    'execution_time_ms', 45,
    'test_timestamp', now()
  )
);
*/

-- テスト結果確認用クエリ:
/*
-- 最新のテスト結果を確認
SELECT 
  test_name,
  table_name,
  actor,
  operation,
  expected,
  actual,
  passed,
  created_at
FROM admin.rls_test_results
ORDER BY created_at DESC
LIMIT 20;

-- 失敗したテストのみ表示
SELECT 
  test_name,
  table_name,
  details->>'error_message' as error_message
FROM admin.rls_test_results
WHERE passed = false
ORDER BY created_at DESC;
*/