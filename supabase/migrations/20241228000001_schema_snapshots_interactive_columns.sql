-- ============================================
-- Schema Snapshots Interactive Mode Extension
-- 対話型APIサポート用の新カラム追加
-- ============================================

-- ============================================
-- 1. 新カラムの追加
-- ============================================

-- git_ref: スナップショット作成時のGitリファレンス（ブランチ名またはコミットハッシュ）
ALTER TABLE schema_snapshots
  ADD COLUMN IF NOT EXISTS git_ref TEXT;

-- app_version: アプリケーションバージョン（セマンティックバージョン等）
ALTER TABLE schema_snapshots
  ADD COLUMN IF NOT EXISTS app_version TEXT;

-- source: スナップショット作成のトリガー元（manual, ci, cron）
ALTER TABLE schema_snapshots
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';

-- ============================================
-- 2. 制約の追加
-- ============================================

-- source カラムの値制約
ALTER TABLE schema_snapshots
  ADD CONSTRAINT chk_schema_snapshots_source_valid
  CHECK (source IN ('manual', 'ci', 'cron'));

-- app_version 形式チェック（緩い制約 - 空文字列許可しない）
ALTER TABLE schema_snapshots
  ADD CONSTRAINT chk_schema_snapshots_app_version_format
  CHECK (app_version IS NULL OR char_length(app_version) > 0);

-- git_ref 形式チェック（緩い制約 - 空文字列許可しない）
ALTER TABLE schema_snapshots
  ADD CONSTRAINT chk_schema_snapshots_git_ref_format
  CHECK (git_ref IS NULL OR char_length(git_ref) > 0);

-- ============================================
-- 3. インデックスの追加（クエリ最適化用）
-- ============================================

-- source別の検索用インデックス
CREATE INDEX IF NOT EXISTS idx_schema_snapshots_source
  ON schema_snapshots (source, captured_at DESC);

-- app_version別の検索用インデックス
CREATE INDEX IF NOT EXISTS idx_schema_snapshots_app_version
  ON schema_snapshots (app_version)
  WHERE app_version IS NOT NULL;

-- git_ref別の検索用インデックス
CREATE INDEX IF NOT EXISTS idx_schema_snapshots_git_ref
  ON schema_snapshots (git_ref)
  WHERE git_ref IS NOT NULL;

-- ============================================
-- 4. コメント追加（ドキュメント用）
-- ============================================

COMMENT ON COLUMN schema_snapshots.git_ref IS 'Git reference (branch name or commit hash) at snapshot time';
COMMENT ON COLUMN schema_snapshots.app_version IS 'Application version string (e.g., 2025.12.28+build.1)';
COMMENT ON COLUMN schema_snapshots.source IS 'Trigger source: manual (API call), ci (CI/CD pipeline), cron (scheduled job)';

-- ============================================
-- 5. 既存データの更新（source列のデフォルト適用）
-- ============================================

UPDATE schema_snapshots
SET source = 'manual'
WHERE source IS NULL;

-- ============================================
-- Migration 完了通知
-- ============================================

INSERT INTO alert_events (event_type, severity, title, message, metadata, environment)
VALUES (
  'system_health',
  'low',
  'Schema Snapshots Interactive Mode Migration Applied',
  'Added git_ref, app_version, source columns for interactive API support',
  jsonb_build_object(
    'migration_file', '20241228000001_schema_snapshots_interactive_columns.sql',
    'applied_at', NOW(),
    'new_columns', jsonb_build_array('git_ref', 'app_version', 'source')
  ),
  'production'
);
