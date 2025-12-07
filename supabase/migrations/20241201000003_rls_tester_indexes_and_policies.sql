-- =========================================================
-- RLS Tester メタテーブル - インデックス & RLS ポリシー追加
-- AIOHub Phase 3 - EPIC 3-2 (最終仕上げ)
-- =========================================================

-- =========================================================
-- パフォーマンス向上インデックス追加
-- =========================================================

-- rls_test_results - 高頻度クエリ用インデックス
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rls_results_run
  ON public.rls_test_results(test_run_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rls_results_table_op
  ON public.rls_test_results(target_table, operation);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rls_results_scenario
  ON public.rls_test_results(scenario_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rls_results_user_success
  ON public.rls_test_results(test_user_id, success);

-- rls_test_runs - 実行履歴・ダッシュボード用インデックス
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rls_runs_trigger
  ON public.rls_test_runs(trigger_type);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rls_runs_status
  ON public.rls_test_runs(status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rls_runs_started_desc
  ON public.rls_test_runs(started_at DESC);

-- rls_test_scenarios - シナリオ検索用インデックス
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rls_scenarios_table_op
  ON public.rls_test_scenarios(target_table, operation);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rls_scenarios_category_active
  ON public.rls_test_scenarios(category, is_active)
  WHERE is_active = true;

-- rls_test_users - ユーザー検索用インデックス
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rls_test_users_org
  ON public.rls_test_users(organization_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rls_test_users_role_active
  ON public.rls_test_users(user_role, is_active)
  WHERE is_active = true;

-- =========================================================
-- RLS ポリシー設定
-- =========================================================

-- Super Admin 読み取りポリシー（4テーブル共通）
DO $$
BEGIN
  -- rls_test_runs: Super Admin のみ読み取り可
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public'
      AND tablename='rls_test_runs'
      AND policyname='super_admin_read_rls_test_runs'
  ) THEN
    CREATE POLICY super_admin_read_rls_test_runs
    ON public.rls_test_runs
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1
        FROM public.app_users au
        WHERE au.id = auth.uid()
          AND au.role IN ('owner','admin')
      )
    );
  END IF;

  -- rls_test_results: Super Admin のみ読み取り可
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public'
      AND tablename='rls_test_results'
      AND policyname='super_admin_read_rls_test_results'
  ) THEN
    CREATE POLICY super_admin_read_rls_test_results
    ON public.rls_test_results
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1
        FROM public.app_users au
        WHERE au.id = auth.uid()
          AND au.role IN ('owner','admin')
      )
    );
  END IF;

  -- rls_test_scenarios: Super Admin のみ読み取り可
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public'
      AND tablename='rls_test_scenarios'
      AND policyname='super_admin_read_rls_test_scenarios'
  ) THEN
    CREATE POLICY super_admin_read_rls_test_scenarios
    ON public.rls_test_scenarios
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1
        FROM public.app_users au
        WHERE au.id = auth.uid()
          AND au.role IN ('owner','admin')
      )
    );
  END IF;

  -- rls_test_users: Super Admin のみ読み取り可
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public'
      AND tablename='rls_test_users'
      AND policyname='super_admin_read_rls_test_users'
  ) THEN
    CREATE POLICY super_admin_read_rls_test_users
    ON public.rls_test_users
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1
        FROM public.app_users au
        WHERE au.id = auth.uid()
          AND au.role IN ('owner','admin')
      )
    );
  END IF;
END$$;

-- service_role 書き込みポリシー（結果保存用）
DO $$
BEGIN
  -- rls_test_runs: service_role のみ書き込み可
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public'
      AND tablename='rls_test_runs'
      AND policyname='service_write_rls_test_runs'
  ) THEN
    CREATE POLICY service_write_rls_test_runs
    ON public.rls_test_runs
    FOR INSERT, UPDATE
    TO service_role
    WITH CHECK (true);
  END IF;

  -- rls_test_results: service_role のみ書き込み可
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public'
      AND tablename='rls_test_results'
      AND policyname='service_write_rls_test_results'
  ) THEN
    CREATE POLICY service_write_rls_test_results
    ON public.rls_test_results
    FOR INSERT, UPDATE
    TO service_role
    WITH CHECK (true);
  END IF;

  -- rls_test_scenarios: service_role 読み取り可（テスト実行用）
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public'
      AND tablename='rls_test_scenarios'
      AND policyname='service_read_rls_test_scenarios'
  ) THEN
    CREATE POLICY service_read_rls_test_scenarios
    ON public.rls_test_scenarios
    FOR SELECT
    TO service_role
    USING (true);
  END IF;

  -- rls_test_users: service_role 読み取り可（テスト実行用）
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public'
      AND tablename='rls_test_users'
      AND policyname='service_read_rls_test_users'
  ) THEN
    CREATE POLICY service_read_rls_test_users
    ON public.rls_test_users
    FOR SELECT
    TO service_role
    USING (true);
  END IF;
END$$;

-- =========================================================
-- 分析用ビュー（オプション）
-- =========================================================

-- テストラン成功率の履歴ビュー
CREATE OR REPLACE VIEW public.rls_test_runs_summary AS
SELECT 
  DATE(started_at) as test_date,
  trigger_type,
  COUNT(*) as total_runs,
  AVG(success_rate) as avg_success_rate,
  MIN(success_rate) as min_success_rate,
  MAX(success_rate) as max_success_rate,
  SUM(failed_scenarios + error_scenarios) as total_failures
FROM rls_test_runs 
WHERE status = 'COMPLETED'
  AND started_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(started_at), trigger_type
ORDER BY test_date DESC, trigger_type;

-- 最新の失敗シナリオサマリービュー
CREATE OR REPLACE VIEW public.rls_test_latest_failures AS
SELECT 
  tr.scenario_name,
  tr.target_table,
  tr.operation,
  tr.test_user_role,
  tr.expected_result,
  tr.actual_result,
  tr.error_message,
  tr.executed_at,
  run.trigger_source
FROM rls_test_results tr
JOIN rls_test_runs run ON tr.test_run_id = run.id
WHERE tr.success = false
  AND tr.executed_at >= CURRENT_TIMESTAMP - INTERVAL '7 days'
ORDER BY tr.executed_at DESC
LIMIT 50;

-- =========================================================
-- RLS ビュー用ポリシー
-- =========================================================

-- 分析ビューも Super Admin のみアクセス可能
ALTER VIEW rls_test_runs_summary OWNER TO postgres;
ALTER VIEW rls_test_latest_failures OWNER TO postgres;

-- ビューへのRLSは通常不要（ベーステーブルのRLSが適用される）だが、
-- 明示的に権限を制御する場合は以下をコメントアウト
-- GRANT SELECT ON rls_test_runs_summary TO authenticated;
-- GRANT SELECT ON rls_test_latest_failures TO authenticated;

-- =========================================================
-- マイグレーション完了ログ
-- =========================================================

INSERT INTO public.migration_logs (version, description, applied_at)
VALUES (
  '20241201000003', 
  'RLS Tester: Added performance indexes and RLS policies', 
  now()
) ON CONFLICT (version) DO NOTHING;

-- =========================================================
-- 設計注意点（コメント）
-- =========================================================

/*
【RLS ポリシー設計方針】

1. **読み取り権限**
   - Super Admin（app_users.role IN ('owner','admin')）のみがメタテーブルを参照可能
   - app_users テーブル自体のRLSで、少なくとも自身の行は取得できることが前提
   - EXISTS サブクエリでapp_users.role を確認

2. **書き込み権限**  
   - service_role のみがテスト結果を書き込み可能
   - Edge Function が service_role で接続し、結果をINSERT/UPDATE
   - シナリオ・ユーザー定義の編集は当面は想定しない（管理者が直接SQL実行）

3. **インデックス戦略**
   - test_run_id: 単一ランの詳細表示で頻用
   - target_table + operation: テーブル別・操作別の分析用
   - started_at DESC: 実行履歴の時系列表示用
   - success, is_active: フィルタリング高速化

4. **パフォーマンス考慮**
   - CONCURRENTLY インデックス作成で本番環境への影響最小化
   - 複合インデックスの列順は実際のクエリパターンに最適化
   - 将来的にテスト結果が数万件以上になる場合はパーティショニング検討

5. **分析ビュー**
   - 日次・週次のサマリー分析用
   - Super Admin Console での表示に使用
   - ベーステーブルのRLSを継承するため追加制御不要
*/