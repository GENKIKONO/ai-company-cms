-- =====================================================
-- ops_audit テーブルのインデックス最適化
-- 監査ログクエリの高速化のため
-- =====================================================

-- 1. 複合インデックス: action + created_at DESC (高頻度クエリ用)
-- アクションでフィルター後、created_at DESCでソートするクエリに最適
CREATE INDEX IF NOT EXISTS idx_ops_audit_action_created_at
ON ops_audit (action, created_at DESC);

-- 2. 単一インデックス: created_at DESC (ページネーション用)
CREATE INDEX IF NOT EXISTS idx_ops_audit_created_at_desc
ON ops_audit (created_at DESC);

-- 3. 部分一致検索用のGINインデックス (actor_id, target_id)
-- pg_trgm拡張が有効な場合のみ使用可能
-- CREATE INDEX IF NOT EXISTS idx_ops_audit_actor_trgm
-- ON ops_audit USING gin (actor_id gin_trgm_ops);
-- CREATE INDEX IF NOT EXISTS idx_ops_audit_target_trgm
-- ON ops_audit USING gin (target_id gin_trgm_ops);

-- 4. target_type インデックス
CREATE INDEX IF NOT EXISTS idx_ops_audit_target_type
ON ops_audit (target_type);

-- =====================================================
-- intrusion_detection_alerts のインデックス
-- セキュリティダッシュボード用
-- =====================================================

-- status + detected_at DESC
CREATE INDEX IF NOT EXISTS idx_intrusion_alerts_status_detected
ON intrusion_detection_alerts (status, detected_at DESC);

-- =====================================================
-- 確認クエリ
-- =====================================================
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = ''ops_audit'';
