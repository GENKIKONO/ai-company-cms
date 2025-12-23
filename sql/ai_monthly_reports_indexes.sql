-- =============================================================================
-- ai_monthly_reports インデックス作成
-- 実行前に本番への影響を確認すること（ロック時間は短いが念のため低負荷時推奨）
-- =============================================================================

-- 1. 組織ID インデックス（RLS条件 + 一覧取得で頻繁に使用）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_monthly_reports_org
ON public.ai_monthly_reports(organization_id);

-- 2. 期間 複合インデックス（年月検索 + ソートで使用）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_monthly_reports_period
ON public.ai_monthly_reports(period_start, period_end);

-- 3. ステータス インデックス（フィルタリングで使用）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_monthly_reports_status
ON public.ai_monthly_reports(status);

-- 4. 組織×期間 複合インデックス（最頻出クエリパターン）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_monthly_reports_org_period
ON public.ai_monthly_reports(organization_id, period_start DESC);

-- =============================================================================
-- 確認クエリ
-- =============================================================================
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'ai_monthly_reports';
