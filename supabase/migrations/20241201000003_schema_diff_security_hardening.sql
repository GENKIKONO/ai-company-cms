-- ============================================
-- EPIC 3-7: Schema Diff Security Hardening
-- Supabase Review対応: インデックス・権限・制約の強化
-- ============================================

-- ============================================
-- 1. パフォーマンスインデックスの追加
-- ============================================

-- schema_snapshots テーブル: 頻繁なクエリパターンに対応
CREATE INDEX IF NOT EXISTS idx_schema_snapshots_env_captured 
  ON schema_snapshots (environment, captured_at DESC);

CREATE INDEX IF NOT EXISTS idx_schema_snapshots_hash 
  ON schema_snapshots (schema_hash);

CREATE INDEX IF NOT EXISTS idx_schema_snapshots_captured_at 
  ON schema_snapshots (captured_at DESC);

-- schema_diff_history テーブル: Admin Console用クエリの最適化
CREATE INDEX IF NOT EXISTS idx_schema_diff_history_env_diff_at 
  ON schema_diff_history (environment, diff_at DESC);

CREATE INDEX IF NOT EXISTS idx_schema_diff_history_severity 
  ON schema_diff_history (severity, diff_at DESC);

CREATE INDEX IF NOT EXISTS idx_schema_diff_history_diff_at 
  ON schema_diff_history (diff_at DESC);

-- job_runs_v2 テーブル: ジョブ状況監視用
CREATE INDEX IF NOT EXISTS idx_job_runs_v2_name_started 
  ON job_runs_v2 (job_name, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_job_runs_v2_status_started 
  ON job_runs_v2 (status, started_at DESC);

-- alert_events テーブル: アラート監視用
CREATE INDEX IF NOT EXISTS idx_alert_events_created_at 
  ON alert_events (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_alert_events_severity_created 
  ON alert_events (severity, created_at DESC);

-- ============================================
-- 2. RLS ポリシーの強化
-- ============================================

-- schema_snapshots テーブル: super_admin のみアクセス可能
ALTER TABLE schema_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super Admin Full Access on schema_snapshots" 
  ON schema_snapshots 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_app_meta_data ->> 'role' = 'super_admin'
    )
  );

-- schema_diff_history テーブル: super_admin のみアクセス可能
ALTER TABLE schema_diff_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super Admin Full Access on schema_diff_history" 
  ON schema_diff_history 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_app_meta_data ->> 'role' = 'super_admin'
    )
  );

-- alert_events テーブル: admin 以上のアクセス
ALTER TABLE alert_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin Access on alert_events" 
  ON alert_events 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_app_meta_data ->> 'role' IN ('admin', 'super_admin')
    )
  );

-- job_runs_v2 テーブル: super_admin のみアクセス可能  
ALTER TABLE job_runs_v2 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super Admin Full Access on job_runs_v2" 
  ON job_runs_v2 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_app_meta_data ->> 'role' = 'super_admin'
    )
  );

-- ============================================
-- 3. データ整合性制約の追加
-- ============================================

-- schema_snapshots テーブル
ALTER TABLE schema_snapshots 
  ADD CONSTRAINT chk_schema_snapshots_environment_valid 
  CHECK (environment IN ('local', 'development', 'staging', 'production'));

ALTER TABLE schema_snapshots 
  ADD CONSTRAINT chk_schema_snapshots_captured_at_recent 
  CHECK (captured_at >= '2024-01-01'::timestamp AND captured_at <= NOW() + interval '1 hour');

ALTER TABLE schema_snapshots 
  ADD CONSTRAINT chk_schema_snapshots_hash_format 
  CHECK (char_length(schema_hash) >= 8 AND char_length(schema_hash) <= 64);

-- schema_diff_history テーブル
ALTER TABLE schema_diff_history 
  ADD CONSTRAINT chk_schema_diff_history_severity_valid 
  CHECK (severity IN ('info', 'warn', 'error', 'critical'));

ALTER TABLE schema_diff_history 
  ADD CONSTRAINT chk_schema_diff_history_environment_valid 
  CHECK (environment IN ('local', 'development', 'staging', 'production'));

ALTER TABLE schema_diff_history 
  ADD CONSTRAINT chk_schema_diff_history_diff_at_recent 
  CHECK (diff_at >= '2024-01-01'::timestamp AND diff_at <= NOW() + interval '1 hour');

-- alert_events テーブル
ALTER TABLE alert_events 
  ADD CONSTRAINT chk_alert_events_severity_valid 
  CHECK (severity IN ('low', 'medium', 'high', 'critical'));

ALTER TABLE alert_events 
  ADD CONSTRAINT chk_alert_events_event_type_valid 
  CHECK (event_type IN ('schema_diff', 'system_health', 'job_failure', 'security_alert'));

-- job_runs_v2 テーブル
ALTER TABLE job_runs_v2 
  ADD CONSTRAINT chk_job_runs_v2_status_valid 
  CHECK (status IN ('running', 'succeeded', 'failed', 'timeout', 'cancelled'));

ALTER TABLE job_runs_v2 
  ADD CONSTRAINT chk_job_runs_v2_retry_count_reasonable 
  CHECK (retry_count >= 0 AND retry_count <= 10);

-- ============================================
-- 4. VIEWのセキュリティ強化  
-- ============================================

-- Admin Console用VIEWの再作成（RLS適用）
DROP VIEW IF EXISTS admin_alerts_latest_v1;
DROP VIEW IF EXISTS admin_jobs_recent_v1;
DROP VIEW IF EXISTS admin_summary_today_v1;

-- admin_alerts_latest_v1: 最新24時間のアラート（RLS適用）
CREATE VIEW admin_alerts_latest_v1 
WITH (security_invoker = true) AS
SELECT 
  id,
  event_type,
  severity,
  title,
  message,
  metadata,
  created_at,
  environment
FROM alert_events
WHERE created_at >= NOW() - interval '24 hours'
ORDER BY created_at DESC;

-- admin_jobs_recent_v1: 最新24時間のジョブ実行（RLS適用）
CREATE VIEW admin_jobs_recent_v1 
WITH (security_invoker = true) AS
SELECT 
  id,
  job_name,
  status,
  started_at,
  finished_at,
  metadata,
  retry_count,
  error_message
FROM job_runs_v2
WHERE started_at >= NOW() - interval '24 hours'
ORDER BY started_at DESC;

-- admin_summary_today_v1: 今日のサマリー（RLS適用）
CREATE VIEW admin_summary_today_v1 
WITH (security_invoker = true) AS
SELECT 
  (SELECT COUNT(*) FROM alert_events WHERE created_at >= CURRENT_DATE) as today_alerts,
  (SELECT COUNT(*) FROM alert_events WHERE severity IN ('high', 'critical') AND created_at >= CURRENT_DATE) as critical_alerts,
  (SELECT COUNT(*) FROM job_runs_v2 WHERE started_at >= CURRENT_DATE) as today_jobs,
  (SELECT COUNT(*) FROM job_runs_v2 WHERE status = 'failed' AND started_at >= CURRENT_DATE) as failed_jobs,
  (SELECT COUNT(*) FROM schema_diff_history WHERE diff_at >= CURRENT_DATE) as today_diffs,
  (SELECT COUNT(*) FROM schema_diff_history WHERE severity IN ('warn', 'error', 'critical') AND diff_at >= CURRENT_DATE) as important_diffs,
  (SELECT COUNT(DISTINCT environment) FROM schema_snapshots WHERE captured_at >= NOW() - interval '24 hours') as active_environments;

-- ============================================
-- 5. 関数のセキュリティ強化
-- ============================================

-- execute_sql 関数のアクセス制御強化（service_role のみ）
-- Note: この関数は schema extractor からのみ呼び出されることを想定
REVOKE ALL ON FUNCTION execute_sql(text) FROM public;
GRANT EXECUTE ON FUNCTION execute_sql(text) TO service_role;

-- ============================================
-- 6. 監査ログの設定
-- ============================================

-- 重要テーブルの変更ログ（簡易版）
CREATE OR REPLACE FUNCTION audit_schema_changes() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO alert_events (event_type, severity, title, message, metadata, environment)
  VALUES (
    'schema_audit',
    'medium',
    'Schema table modified',
    format('Table %s was %s', TG_TABLE_NAME, TG_OP),
    jsonb_build_object(
      'table_name', TG_TABLE_NAME,
      'operation', TG_OP,
      'timestamp', NOW(),
      'user_id', auth.uid()
    ),
    'production'
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 重要テーブルにトリガー設定
CREATE TRIGGER audit_schema_snapshots 
  AFTER INSERT OR UPDATE OR DELETE ON schema_snapshots
  FOR EACH ROW EXECUTE FUNCTION audit_schema_changes();

CREATE TRIGGER audit_schema_diff_history 
  AFTER INSERT OR UPDATE OR DELETE ON schema_diff_history
  FOR EACH ROW EXECUTE FUNCTION audit_schema_changes();

-- ============================================
-- 7. 権限の最小化
-- ============================================

-- 一般ユーザーから不要な権限を除去
REVOKE ALL ON schema_snapshots FROM authenticated;
REVOKE ALL ON schema_diff_history FROM authenticated;
REVOKE ALL ON job_runs_v2 FROM authenticated;

-- anon ロールからも除去
REVOKE ALL ON schema_snapshots FROM anon;
REVOKE ALL ON schema_diff_history FROM anon;
REVOKE ALL ON job_runs_v2 FROM anon;
REVOKE ALL ON alert_events FROM anon;

-- VIEWへのアクセスも制限（認証必須）
REVOKE ALL ON admin_alerts_latest_v1 FROM anon;
REVOKE ALL ON admin_jobs_recent_v1 FROM anon;
REVOKE ALL ON admin_summary_today_v1 FROM anon;

GRANT SELECT ON admin_alerts_latest_v1 TO authenticated;
GRANT SELECT ON admin_jobs_recent_v1 TO authenticated;
GRANT SELECT ON admin_summary_today_v1 TO authenticated;

-- ============================================
-- 8. レート制限対応（将来実装用のコメント）
-- ============================================

/*
-- Edge Function からの API 呼び出し制限
-- 実装時は以下のアプローチを検討:
-- 1. pg_cron による定期実行制御
-- 2. Redis/Upstash による呼び出し回数制限  
-- 3. Slack webhook 呼び出し頻度制限
-- 4. スキーマ差分検知の実行間隔制御
*/

-- ============================================
-- Migration 完了通知
-- ============================================

INSERT INTO alert_events (event_type, severity, title, message, metadata, environment)
VALUES (
  'system_health',
  'low', 
  'Schema Diff Security Migration Applied',
  'Security hardening migration completed successfully',
  jsonb_build_object(
    'migration_file', '20241201000003_schema_diff_security_hardening.sql',
    'applied_at', NOW(),
    'components', jsonb_build_array(
      'indexes', 'rls_policies', 'constraints', 
      'views', 'functions', 'permissions', 'audit_triggers'
    )
  ),
  'production'
);