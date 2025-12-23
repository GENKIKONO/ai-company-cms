-- ========================================
-- AI Citations Views - DB実装準拠版
-- model_name, content_unit_id を正として実装
-- ========================================

-- 1. v_ai_citations_aggregates - レスポンス×source_key粒度
CREATE OR REPLACE VIEW v_ai_citations_aggregates AS
SELECT 
  r.id as response_id,
  r.organization_id,
  r.session_id,
  r.user_id,
  r.model_name as model,  -- 互換エイリアス
  r.created_at as response_created_at,
  COALESCE(i.content_unit_id::text, cu.url, i.uri) as source_key,
  COALESCE(cu.title, i.title) as title,
  COALESCE(cu.url, i.uri) as url,
  COUNT(i.id) as citations_count,
  SUM(COALESCE((i.meta->>'weight')::numeric, 1.0))::text as total_weight,
  SUM(COALESCE((i.meta->>'quoted_tokens')::integer, 0))::text as total_quoted_tokens,
  SUM(COALESCE(LENGTH(i.snippet), 0))::text as total_quoted_chars,
  MAX(COALESCE((i.meta->>'score')::numeric, 0))::text as max_score,
  AVG(COALESCE((i.meta->>'score')::numeric, 0))::text as avg_score,
  MAX(i.created_at) as last_cited_at
FROM ai_citations_responses r
LEFT JOIN ai_citations_items i ON r.id = i.response_id
LEFT JOIN ai_content_units cu ON i.content_unit_id = cu.id
WHERE r.organization_id IS NOT NULL
  AND r.created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY r.id, r.organization_id, r.session_id, r.user_id, r.model_name, r.created_at,
         COALESCE(i.content_unit_id::text, cu.url, i.uri), COALESCE(cu.title, i.title), 
         COALESCE(cu.url, i.uri)
ORDER BY r.created_at DESC;

-- 2. mv_ai_citations_org_period - 組織×日次×source_key粒度  
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_ai_citations_org_period AS
SELECT 
  r.organization_id,
  DATE(r.created_at) as day_bucket,
  COALESCE(i.content_unit_id::text, cu.url, i.uri) as source_key,
  COALESCE(cu.title, i.title) as title,
  COALESCE(cu.url, i.uri) as url,
  COUNT(i.id)::text as citations_count,
  SUM(COALESCE((i.meta->>'weight')::numeric, 1.0))::text as total_weight,
  SUM(COALESCE((i.meta->>'quoted_tokens')::integer, 0))::text as total_quoted_tokens,
  SUM(COALESCE(LENGTH(i.snippet), 0))::text as total_quoted_chars,
  MAX(COALESCE((i.meta->>'score')::numeric, 0))::text as max_score,
  AVG(COALESCE((i.meta->>'score')::numeric, 0))::text as avg_score,
  MAX(i.created_at) as last_cited_at
FROM ai_citations_responses r
INNER JOIN ai_citations_items i ON r.id = i.response_id
LEFT JOIN ai_content_units cu ON i.content_unit_id = cu.id
WHERE r.organization_id IS NOT NULL
  AND r.created_at >= CURRENT_DATE - INTERVAL '90 days'
  AND (i.content_unit_id IS NOT NULL OR i.uri IS NOT NULL)
GROUP BY r.organization_id, DATE(r.created_at), 
         COALESCE(i.content_unit_id::text, cu.url, i.uri), 
         COALESCE(cu.title, i.title), COALESCE(cu.url, i.uri)
ORDER BY r.organization_id, day_bucket DESC, citations_count::int DESC;

-- ユニークインデックス
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_ai_citations_org_period_unique
ON mv_ai_citations_org_period (organization_id, day_bucket, source_key);

-- 検索インデックス
CREATE INDEX IF NOT EXISTS idx_mv_ai_citations_org_period_search
ON mv_ai_citations_org_period (organization_id, day_bucket DESC);

-- 3. 必要なテーブルインデックス
CREATE INDEX IF NOT EXISTS idx_ai_citations_items_content_unit_id
ON ai_citations_items (content_unit_id) WHERE content_unit_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ai_content_units_id_title_url  
ON ai_content_units (id, title, url) WHERE organization_id IS NOT NULL;

-- 4. RLS policies
ALTER TABLE ai_citations_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_citations_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_content_units ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "ai_citations_responses_org_access" ON ai_citations_responses FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
);

CREATE POLICY IF NOT EXISTS "ai_citations_items_org_access" ON ai_citations_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM ai_citations_responses r WHERE r.id = response_id 
    AND r.organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()))
);

CREATE POLICY IF NOT EXISTS "ai_content_units_org_access" ON ai_content_units FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
);

-- 5. ビューアクセス許可
GRANT SELECT ON v_ai_citations_aggregates TO authenticated;
GRANT SELECT ON mv_ai_citations_org_period TO authenticated;

-- 6. 1時間毎更新 (pg_cron)
-- SELECT cron.schedule('refresh-citations-mv', '0 * * * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_ai_citations_org_period;');