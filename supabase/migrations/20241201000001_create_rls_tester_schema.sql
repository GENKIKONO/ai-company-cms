-- =========================================================
-- RLS Tester メタテーブル群 - 最終版 DDL
-- AIOHub Phase 3 - EPIC 3-2
-- =========================================================

-- RLS テストユーザー定義
-- 擬似ユーザーの JWT claims テンプレートとロール情報を管理
CREATE TABLE public.rls_test_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name text UNIQUE NOT NULL, -- 'orgA_owner', 'orgA_admin', 'orgB_member', 'system_admin' etc.
  organization_id uuid, -- テナント識別子（NULLは system-wide ユーザー）
  user_role text NOT NULL CHECK (user_role IN ('owner', 'admin', 'member', 'viewer', 'system_admin')),
  jwt_template jsonb NOT NULL, -- JWT claims テンプレート: { sub, email, role, org_id, custom_claims... }
  description text,
  is_active boolean DEFAULT true, -- テスト対象として有効かどうか
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- 制約: organization_id が NULL の場合は system_admin のみ許可
  CONSTRAINT check_system_admin_no_org CHECK (
    (organization_id IS NULL AND user_role = 'system_admin') OR 
    (organization_id IS NOT NULL AND user_role != 'system_admin')
  )
);

-- RLS テストシナリオ定義  
-- 各テストケースの詳細（対象テーブル、操作、期待結果）を管理
CREATE TABLE public.rls_test_scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_name text NOT NULL,
  target_table text NOT NULL, -- 対象テーブル名
  target_schema text DEFAULT 'public', -- スキーマ名（デフォルト: public）
  operation text NOT NULL CHECK (operation IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE')),
  expected_result text NOT NULL CHECK (expected_result IN ('ALLOW', 'DENY')), -- ERROR は実行時判定
  test_data jsonb, -- テスト用データ: INSERT/UPDATE用payload, SELECT/DELETE用WHERE条件
  test_conditions text, -- 追加の実行条件やSQLフラグメント  
  category text DEFAULT 'general', -- テストカテゴリ（例: 'ownership', 'membership', 'public_access'）
  priority integer DEFAULT 1, -- 実行優先度（1=高, 5=低）
  description text,
  is_active boolean DEFAULT true, -- テスト実行対象として有効かどうか
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- 複合ユニーク制約: 同じテーブル・操作・カテゴリで重複シナリオを防ぐ
  UNIQUE(target_table, target_schema, operation, category, scenario_name)
);

-- RLS テスト実行サマリー
-- 1回のテストラン全体の情報と結果サマリーを管理
CREATE TABLE public.rls_test_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_type text NOT NULL CHECK (trigger_type IN ('MANUAL', 'CI', 'SCHEDULED')),
  trigger_source text, -- 'github-actions', 'super-admin-console', 'cron-job' etc.
  suite_name text DEFAULT 'default', -- テストスイート名（一部のシナリオのみ実行する場合）
  git_commit_hash text, -- CI実行時のコミットハッシュ
  git_branch text, -- ブランチ名
  environment text DEFAULT 'development', -- 実行環境
  
  -- 実行統計
  total_scenarios integer NOT NULL DEFAULT 0,
  passed_scenarios integer NOT NULL DEFAULT 0,
  failed_scenarios integer NOT NULL DEFAULT 0,
  error_scenarios integer NOT NULL DEFAULT 0,
  skipped_scenarios integer NOT NULL DEFAULT 0,
  
  -- 成功率（自動計算）
  success_rate numeric(5,2) GENERATED ALWAYS AS (
    CASE WHEN total_scenarios > 0 
    THEN (passed_scenarios::numeric / total_scenarios * 100) 
    ELSE 0 END
  ) STORED,
  
  -- 実行時間管理
  execution_time_ms integer,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  status text DEFAULT 'RUNNING' CHECK (status IN ('RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED', 'TIMEOUT')),
  
  -- 結果メタデータ
  result_summary jsonb, -- { by_table: {}, by_operation: {}, by_user_role: {} } 等の集計情報
  error_summary text, -- 主要なエラーサマリー
  
  created_at timestamptz DEFAULT now()
);

-- RLS テスト実行結果（詳細）
-- 各 (scenario × user) 組み合わせの実行結果を記録
CREATE TABLE public.rls_test_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_run_id uuid NOT NULL REFERENCES rls_test_runs(id) ON DELETE CASCADE,
  scenario_id uuid NOT NULL REFERENCES rls_test_scenarios(id) ON DELETE CASCADE,
  test_user_id uuid NOT NULL REFERENCES rls_test_users(id) ON DELETE CASCADE,
  
  -- シナリオ情報のスナップショット（後で参照しやすくするため）
  scenario_name text NOT NULL,
  target_table text NOT NULL,
  target_schema text NOT NULL,
  operation text NOT NULL,
  test_user_role text NOT NULL,
  
  -- 期待値vs実際の結果
  expected_result text NOT NULL CHECK (expected_result IN ('ALLOW', 'DENY')),
  actual_result text NOT NULL CHECK (actual_result IN ('ALLOW', 'DENY', 'ERROR')),
  success boolean GENERATED ALWAYS AS (
    expected_result = actual_result AND actual_result != 'ERROR'
  ) STORED,
  
  -- 実行詳細
  row_count integer, -- 影響を受けた行数（SELECT時は取得行数、INSERT/UPDATE/DELETE時は変更行数）
  execution_time_ms integer,
  executed_at timestamptz DEFAULT now(),
  
  -- エラー情報
  error_code text, -- PostgreSQL エラーコード（42501 = insufficient_privilege 等）
  error_message text, -- エラーメッセージ
  error_details jsonb, -- 詳細エラー情報とコンテキスト
  
  -- テストメタデータ
  jwt_claims_used jsonb, -- 実際に使用された JWT claims のコピー
  test_data_used jsonb, -- 実際に使用されたテストデータ
  sql_executed text, -- 実行されたSQL文（デバッグ用）
  
  created_at timestamptz DEFAULT now(),
  
  -- 複合ユニーク制約: 同一テストラン内で同じシナリオ×ユーザーの重複実行を防ぐ
  UNIQUE(test_run_id, scenario_id, test_user_id)
);

-- =========================================================
-- インデックス作成
-- =========================================================

-- rls_test_users
CREATE INDEX idx_rls_test_users_organization ON rls_test_users(organization_id);
CREATE INDEX idx_rls_test_users_role ON rls_test_users(user_role);
CREATE INDEX idx_rls_test_users_active ON rls_test_users(is_active) WHERE is_active = true;

-- rls_test_scenarios  
CREATE INDEX idx_rls_test_scenarios_table ON rls_test_scenarios(target_table, target_schema);
CREATE INDEX idx_rls_test_scenarios_operation ON rls_test_scenarios(operation);
CREATE INDEX idx_rls_test_scenarios_category ON rls_test_scenarios(category);
CREATE INDEX idx_rls_test_scenarios_active ON rls_test_scenarios(is_active) WHERE is_active = true;
CREATE INDEX idx_rls_test_scenarios_priority ON rls_test_scenarios(priority, created_at);

-- rls_test_runs
CREATE INDEX idx_rls_test_runs_trigger ON rls_test_runs(trigger_type, trigger_source);
CREATE INDEX idx_rls_test_runs_success_rate ON rls_test_runs(success_rate DESC);
CREATE INDEX idx_rls_test_runs_started_at ON rls_test_runs(started_at DESC);
CREATE INDEX idx_rls_test_runs_status ON rls_test_runs(status);
CREATE INDEX idx_rls_test_runs_git ON rls_test_runs(git_commit_hash, git_branch);

-- rls_test_results
CREATE INDEX idx_rls_test_results_run_id ON rls_test_results(test_run_id);
CREATE INDEX idx_rls_test_results_success ON rls_test_results(success);
CREATE INDEX idx_rls_test_results_table_operation ON rls_test_results(target_table, operation);
CREATE INDEX idx_rls_test_results_user_role ON rls_test_results(test_user_role);
CREATE INDEX idx_rls_test_results_actual_result ON rls_test_results(actual_result);
CREATE INDEX idx_rls_test_results_executed_at ON rls_test_results(executed_at DESC);

-- 複合インデックス（分析クエリ用）
CREATE INDEX idx_rls_test_results_analysis ON rls_test_results(test_run_id, target_table, operation, success);

-- =========================================================
-- RLS ポリシー設定
-- =========================================================

-- RLS有効化
ALTER TABLE rls_test_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rls_test_scenarios ENABLE ROW LEVEL SECURITY;  
ALTER TABLE rls_test_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rls_test_results ENABLE ROW LEVEL SECURITY;

-- ポリシー: Super Admin（app_users.role IN ('owner','admin')）のみアクセス可能
-- ※実際のポリシー作成は本番適用時に実行

-- Super Admin 読み取りポリシー例
-- CREATE POLICY "Super Admin can view RLS test data" ON rls_test_users
--   FOR SELECT
--   TO authenticated 
--   USING (
--     EXISTS (
--       SELECT 1 FROM app_users 
--       WHERE app_users.id = auth.uid() 
--       AND app_users.role IN ('owner', 'admin')
--     )
--   );

-- Super Admin 書き込みポリシー例  
-- CREATE POLICY "Super Admin can manage RLS test data" ON rls_test_users
--   FOR ALL
--   TO authenticated
--   USING (
--     EXISTS (
--       SELECT 1 FROM app_users 
--       WHERE app_users.id = auth.uid() 
--       AND app_users.role IN ('owner', 'admin')
--     )
--   );

-- 注意: 同様のポリシーを他の3テーブルにも適用する必要があります
-- service_role での Edge Function からのアクセスは RLS をバイパスするため、
-- Edge Function の認証・認可を別途実装してください

-- =========================================================
-- 初期データ例
-- =========================================================

-- テスト用ユーザーの例
INSERT INTO rls_test_users (role_name, organization_id, user_role, jwt_template, description) VALUES
('system_admin', NULL, 'system_admin', '{"sub": "00000000-0000-0000-0000-000000000001", "role": "admin", "email": "system@example.com"}', 'System administrator'),
('orgA_owner', '11111111-1111-1111-1111-111111111111', 'owner', '{"sub": "00000000-0000-0000-0000-000000000002", "role": "user", "org_id": "11111111-1111-1111-1111-111111111111", "user_role": "owner"}', 'Organization A owner'),
('orgA_admin', '11111111-1111-1111-1111-111111111111', 'admin', '{"sub": "00000000-0000-0000-0000-000000000003", "role": "user", "org_id": "11111111-1111-1111-1111-111111111111", "user_role": "admin"}', 'Organization A admin'),
('orgB_member', '22222222-2222-2222-2222-222222222222', 'member', '{"sub": "00000000-0000-0000-0000-000000000004", "role": "user", "org_id": "22222222-2222-2222-2222-222222222222", "user_role": "member"}', 'Organization B member');

-- =========================================================
-- 設計注意点（コメント）
-- =========================================================

/*
【設計方針・注意点】

1. **JWT Claims 管理**
   - jwt_template には実際の JWT claims を JSON で格納
   - set_config('request.jwt.claims', claims_json, true) で使用
   - sub, role, org_id, user_role 等の必要な claims を含める

2. **テストデータ汚染防止**  
   - test_data には INSERT/UPDATE 用のペイロードを格納
   - SQL Function 内でトランザクション + ROLLBACK を使用
   - 書き込み系テストは必ず元に戻すこと

3. **パフォーマンス考慮**
   - 大量シナリオ実行時は priority でソート、並列度制限
   - is_active = false でテスト除外可能
   - category でテストスイートを分割可能

4. **結果分析**
   - success カラムで簡単な成功/失敗判定
   - result_summary に集計情報を JSON で格納
   - git_commit_hash で変更点追跡

5. **エラーハンドリング**  
   - PostgreSQL エラーコードを error_code に格納
   - 詳細は error_details に JSON で保存
   - sql_executed でデバッグ用にSQL文を記録

6. **RLS ポリシー**
   - これらのテーブル自体は Super Admin のみアクセス
   - Edge Function は service_role でアクセス
   - テスト対象のテーブルは通常のユーザー権限でテスト実行
*/