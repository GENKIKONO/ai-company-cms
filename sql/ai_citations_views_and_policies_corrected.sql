-- ========================================
-- AI Citations Views and RLS Policies - CORRECTED VERSION
-- 実際のテーブル構造に基づく修正版
-- ========================================

-- 1. Required Indexes for Performance
-- ========================================

-- Index 1: ai_citations_responses organization_id + created_at (for daily aggregation)
CREATE INDEX IF NOT EXISTS idx_ai_citations_responses_org_created 
ON ai_citations_responses (organization_id, created_at DESC)
WHERE organization_id IS NOT NULL;

-- Index 2: ai_citations_items response_id (基本JOIN用) 
CREATE INDEX IF NOT EXISTS idx_ai_citations_items_response_id
ON ai_citations_items (response_id);

-- Index 3: ai_citations_items source_id (orphan detection用)
CREATE INDEX IF NOT EXISTS idx_ai_citations_items_source_id
ON ai_citations_items (source_id)
WHERE source_id IS NOT NULL;

-- Index 4: ai_content_units organization_id (整合性チェック用)
CREATE INDEX IF NOT EXISTS idx_ai_content_units_organization_id
ON ai_content_units (organization_id)
WHERE organization_id IS NOT NULL;

-- 2. v_ai_citations_aggregates - セッション・レスポンス単位の引用集計ビュー
-- ========================================

CREATE OR REPLACE VIEW v_ai_citations_aggregates AS
SELECT 
  r.id as response_id,
  r.organization_id,
  r.session_id,
  r.user_id,
  r.model,
  r.created_at as response_created_at,
  -- source_keyは source_id 優先、フォールバックで uri
  COALESCE(i.source_id, i.uri) as source_key,
  i.title,
  i.uri as url,
  COUNT(i.id) as citations_count,
  SUM(COALESCE((i.meta->>'weight')::numeric, 1.0)) as total_weight,
  SUM(COALESCE((i.meta->>'quoted_tokens')::integer, 0)) as total_quoted_tokens,
  SUM(COALESCE(LENGTH(i.snippet), 0)) as total_quoted_chars,
  MAX(COALESCE((i.meta->>'score')::numeric, 0)) as max_score,
  AVG(COALESCE((i.meta->>'score')::numeric, 0)) as avg_score,
  MAX(i.created_at) as last_cited_at
FROM ai_citations_responses r
LEFT JOIN ai_citations_items i ON r.id = i.response_id
WHERE r.organization_id IS NOT NULL
  AND r.created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY r.id, r.organization_id, r.session_id, r.user_id, r.model, r.created_at,
         COALESCE(i.source_id, i.uri), i.title, i.uri
ORDER BY r.created_at DESC;

-- 3. mv_ai_citations_org_period - 組織×日次集計マテリアライズドビュー
-- ========================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_ai_citations_org_period AS
SELECT 
  r.organization_id,
  DATE(r.created_at) as day_bucket,
  COALESCE(i.source_id, i.uri) as source_key,
  i.title,
  i.uri as url,
  COUNT(i.id) as citations_count,
  SUM(COALESCE((i.meta->>'weight')::numeric, 1.0)) as total_weight,
  SUM(COALESCE((i.meta->>'quoted_tokens')::integer, 0)) as total_quoted_tokens,
  SUM(COALESCE(LENGTH(i.snippet), 0)) as total_quoted_chars,
  MAX(COALESCE((i.meta->>'score')::numeric, 0)) as max_score,
  AVG(COALESCE((i.meta->>'score')::numeric, 0)) as avg_score,
  MAX(i.created_at) as last_cited_at
FROM ai_citations_responses r
INNER JOIN ai_citations_items i ON r.id = i.response_id
WHERE r.organization_id IS NOT NULL
  AND r.created_at >= CURRENT_DATE - INTERVAL '90 days'
  AND i.source_id IS NOT NULL OR i.uri IS NOT NULL  -- source_keyがあるもののみ
GROUP BY r.organization_id, DATE(r.created_at), 
         COALESCE(i.source_id, i.uri), i.title, i.uri
ORDER BY r.organization_id, day_bucket DESC, citations_count DESC;

-- MV用ユニークインデックス（必須）
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_ai_citations_org_period_unique
ON mv_ai_citations_org_period (organization_id, day_bucket, source_key);

-- MV用検索インデックス
CREATE INDEX IF NOT EXISTS idx_mv_ai_citations_org_period_search
ON mv_ai_citations_org_period (organization_id, day_bucket DESC);

-- 4. v_ai_citations_daily - 公開KPI用日次集計ビュー  
-- ========================================

CREATE OR REPLACE VIEW v_ai_citations_daily AS
WITH daily_stats AS (
  SELECT 
    r.organization_id,
    DATE(r.created_at) as citation_date,
    COUNT(r.id) as total_responses,
    COUNT(CASE WHEN r.success THEN 1 END) as successful_responses,
    SUM(r.input_tokens) as total_input_tokens,
    SUM(r.output_tokens) as total_output_tokens,
    SUM(r.duration_ms) as total_duration_ms,
    COUNT(DISTINCT r.session_id) as unique_sessions,
    COUNT(DISTINCT r.user_id) as unique_users
  FROM ai_citations_responses r
  WHERE r.organization_id IS NOT NULL
    AND r.created_at >= CURRENT_DATE - INTERVAL '90 days'
  GROUP BY r.organization_id, DATE(r.created_at)
),
citation_items_stats AS (
  SELECT 
    r.organization_id,
    DATE(r.created_at) as citation_date,
    COUNT(i.id) as total_citations,
    COUNT(DISTINCT i.source_id) as unique_sources,
    COUNT(DISTINCT i.uri) as unique_uris
  FROM ai_citations_responses r
  INNER JOIN ai_citations_items i ON r.id = i.response_id
  WHERE r.organization_id IS NOT NULL
    AND r.created_at >= CURRENT_DATE - INTERVAL '90 days'
  GROUP BY r.organization_id, DATE(r.created_at)
)
SELECT 
  ds.organization_id,
  ds.citation_date,
  ds.total_responses,
  ds.successful_responses,
  ROUND(ds.successful_responses::numeric / NULLIF(ds.total_responses, 0) * 100, 2) as success_rate_percent,
  ds.total_input_tokens,
  ds.total_output_tokens,
  ds.total_duration_ms,
  ds.unique_sessions,
  ds.unique_users,
  COALESCE(cis.total_citations, 0) as total_citations,
  COALESCE(cis.unique_sources, 0) as unique_sources,
  COALESCE(cis.unique_uris, 0) as unique_uris,
  CURRENT_TIMESTAMP as view_updated_at
FROM daily_stats ds
LEFT JOIN citation_items_stats cis ON ds.organization_id = cis.organization_id 
  AND ds.citation_date = cis.citation_date
ORDER BY ds.organization_id, ds.citation_date DESC;

-- 5. v_ai_citations_integrity_daily - 管理者ダッシュボード用整合性指標
-- ========================================

CREATE OR REPLACE VIEW v_ai_citations_integrity_daily AS
WITH integrity_checks AS (
  SELECT 
    r.organization_id,
    DATE(r.created_at) as check_date,
    -- Orphan items: content_unit参照切れ
    COUNT(CASE WHEN i.source_id IS NOT NULL 
      AND NOT EXISTS (
        SELECT 1 FROM ai_content_units cu 
        WHERE cu.id::text = i.source_id 
          AND cu.organization_id = r.organization_id
      ) THEN 1 END) as orphan_items,
    -- Duplicate pairs: 同一(response_id, source_id)の2件目以降
    SUM(CASE WHEN dup.dup_count > 1 THEN dup.dup_count - 1 ELSE 0 END) as duplicate_pairs,
    -- Response-Items alignment
    COUNT(CASE WHEN r.success = true AND items_count.item_count = 0 THEN 1 END) as success_no_items,
    COUNT(CASE WHEN r.success = false AND items_count.item_count > 0 THEN 1 END) as failed_with_items,
    -- General stats
    COUNT(r.id) as total_responses,
    COUNT(i.id) as total_items
  FROM ai_citations_responses r
  LEFT JOIN ai_citations_items i ON r.id = i.response_id
  LEFT JOIN (
    SELECT response_id, source_id, COUNT(*) as dup_count
    FROM ai_citations_items
    WHERE source_id IS NOT NULL
    GROUP BY response_id, source_id
  ) dup ON i.response_id = dup.response_id AND i.source_id = dup.source_id
  LEFT JOIN (
    SELECT response_id, COUNT(*) as item_count
    FROM ai_citations_items
    GROUP BY response_id
  ) items_count ON r.id = items_count.response_id
  WHERE r.organization_id IS NOT NULL
    AND r.created_at >= CURRENT_DATE - INTERVAL '90 days'
  GROUP BY r.organization_id, DATE(r.created_at)
)
SELECT 
  ic.organization_id,
  ic.check_date,
  ic.orphan_items,
  ic.duplicate_pairs,
  ic.success_no_items,
  ic.failed_with_items,
  ic.total_responses,
  ic.total_items,
  ROUND(ic.orphan_items::numeric / NULLIF(ic.total_items, 0) * 100, 2) as orphan_rate_percent,
  ROUND(ic.duplicate_pairs::numeric / NULLIF(ic.total_items, 0) * 100, 2) as duplicate_rate_percent,
  CASE 
    WHEN ic.orphan_items = 0 AND ic.duplicate_pairs = 0 AND ic.success_no_items = 0 AND ic.failed_with_items = 0 
    THEN 'HEALTHY'
    WHEN ic.orphan_items > ic.total_items * 0.1 OR ic.duplicate_pairs > ic.total_items * 0.1
    THEN 'CRITICAL' 
    ELSE 'WARNING'
  END as integrity_status,
  CURRENT_TIMESTAMP as view_updated_at
FROM integrity_checks ic
ORDER BY ic.organization_id, ic.check_date DESC;

-- 6. Row Level Security Policies
-- ========================================

-- RLS Enable (if not already enabled)
ALTER TABLE ai_citations_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_citations_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_content_units ENABLE ROW LEVEL SECURITY;

-- ai_citations_responses SELECT Policy
CREATE POLICY IF NOT EXISTS "ai_citations_responses_select_policy" ON ai_citations_responses
  FOR SELECT 
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- ai_citations_items SELECT Policy  
CREATE POLICY IF NOT EXISTS "ai_citations_items_select_policy" ON ai_citations_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ai_citations_responses r
      WHERE r.id = response_id
        AND r.organization_id IN (
          SELECT organization_id 
          FROM organization_members 
          WHERE user_id = auth.uid()
        )
    )
  );

-- ai_content_units SELECT Policy
CREATE POLICY IF NOT EXISTS "ai_content_units_select_policy" ON ai_content_units  
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- INSERT Policies (組織メンバーのみ - SERVER使用想定)
CREATE POLICY IF NOT EXISTS "ai_citations_responses_insert_policy" ON ai_citations_responses
  FOR INSERT 
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "ai_citations_items_insert_policy" ON ai_citations_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_citations_responses r
      WHERE r.id = response_id
        AND r.organization_id IN (
          SELECT organization_id 
          FROM organization_members 
          WHERE user_id = auth.uid()
        )
    )
  );

CREATE POLICY IF NOT EXISTS "ai_content_units_insert_policy" ON ai_content_units
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- 7. View RLS and Grants
-- ========================================

-- Grant SELECT on views to authenticated users (RLS will filter by organization)
GRANT SELECT ON v_ai_citations_aggregates TO authenticated;
GRANT SELECT ON mv_ai_citations_org_period TO authenticated;
GRANT SELECT ON v_ai_citations_daily TO authenticated;
GRANT SELECT ON v_ai_citations_integrity_daily TO authenticated;

-- Comments for documentation
COMMENT ON VIEW v_ai_citations_aggregates IS 'Response-level citation aggregates for session APIs - matches existing API expectations';
COMMENT ON MATERIALIZED VIEW mv_ai_citations_org_period IS 'Organization daily citation aggregates for period queries - optimized for mv_ai_citations_org_period API calls';
COMMENT ON VIEW v_ai_citations_daily IS 'Daily AI citations aggregation for organization KPI dashboard';
COMMENT ON VIEW v_ai_citations_integrity_daily IS 'Daily integrity metrics for admin dashboard - includes orphan/duplicate detection';

-- ========================================
-- Materialized View Refresh Strategy
-- ========================================

-- Manual refresh command (to be run via cron or admin API)
-- REFRESH MATERIALIZED VIEW mv_ai_citations_org_period;

-- ========================================
-- Migration Verification Queries
-- ========================================

-- Test query 1: Check view creation
-- SELECT 'v_ai_citations_aggregates' as view_name, COUNT(*) as row_count FROM v_ai_citations_aggregates LIMIT 5;
-- SELECT 'mv_ai_citations_org_period' as view_name, COUNT(*) as row_count FROM mv_ai_citations_org_period LIMIT 5;
-- SELECT 'v_ai_citations_daily' as view_name, COUNT(*) as row_count FROM v_ai_citations_daily LIMIT 5;
-- SELECT 'v_ai_citations_integrity_daily' as view_name, COUNT(*) as row_count FROM v_ai_citations_integrity_daily LIMIT 5;

-- Test query 2: Check indexes
-- SELECT schemaname, tablename, indexname FROM pg_indexes WHERE indexname LIKE 'idx_%ai_citations%' OR indexname LIKE 'idx_%ai_content%';

-- Test query 3: Check RLS policies  
-- SELECT schemaname, tablename, policyname, cmd FROM pg_policies WHERE tablename LIKE 'ai_citations%' OR tablename LIKE 'ai_content_units';

-- Test query 4: API compatibility test
-- SELECT response_id, organization_id, session_id, source_key, citations_count FROM v_ai_citations_aggregates WHERE organization_id = 'test-org-id' LIMIT 10;
-- SELECT organization_id, day_bucket, source_key, citations_count FROM mv_ai_citations_org_period WHERE organization_id = 'test-org-id' AND day_bucket >= '2024-12-01' LIMIT 10;