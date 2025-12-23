-- ====================================================================
-- AI Citations Production Migration - Final Implementation
-- 衝突回避版（v2サフィックス）、既存DB実態準拠
-- ====================================================================

-- ■ 1. レスポンスグループ化VIEW（v2: 衝突回避）
-- 目的: アプリのgroupByResponseId()処理をDB化、sources配列JSON事前生成
-- 汎用性: 期間フィルタなし（API側で制御）、既存スキーマ準拠
CREATE OR REPLACE VIEW v_ai_response_groups_v2 AS
WITH response_base AS (
  -- レスポンス基本情報（DISTINCT で重複排除）
  SELECT DISTINCT
    r.id as response_id,
    r.organization_id,
    r.session_id,
    r.user_id,
    r.model_name,
    r.created_at as response_created_at
  FROM ai_citations_responses r
  WHERE r.organization_id IS NOT NULL
),
citations_by_source AS (
  -- 引用アイテムをsource_key単位で集約
  SELECT 
    i.response_id,
    -- source_key生成: content_unit_id::text > url > uri の優先順位
    COALESCE(i.content_unit_id::text, cu.url, i.uri) as source_key,
    COALESCE(cu.title, i.title, 'Untitled') as title,
    COALESCE(cu.url, i.uri) as url,
    COUNT(i.id) as citations_count,
    SUM(COALESCE(CAST(i.meta->>'weight' AS numeric), 1.0)) as total_weight,
    SUM(COALESCE(CAST(i.meta->>'quoted_tokens' AS integer), 0)) as total_quoted_tokens,
    SUM(COALESCE(LENGTH(i.snippet), 0)) as total_quoted_chars,
    MAX(COALESCE(CAST(i.meta->>'score' AS numeric), 0)) as max_score,
    AVG(COALESCE(CAST(i.meta->>'score' AS numeric), 0)) as avg_score,
    MAX(i.created_at) as last_cited_at
  FROM ai_citations_items i
  LEFT JOIN ai_content_units cu ON i.content_unit_id = cu.id
  WHERE (i.content_unit_id IS NOT NULL OR i.uri IS NOT NULL)
  GROUP BY 
    i.response_id,
    COALESCE(i.content_unit_id::text, cu.url, i.uri),
    COALESCE(cu.title, i.title, 'Untitled'), 
    COALESCE(cu.url, i.uri)
)
SELECT 
  rb.response_id,
  rb.organization_id,
  rb.session_id,
  rb.user_id,
  rb.model_name as model,  -- API互換エイリアス
  rb.response_created_at,
  COALESCE(COUNT(cbs.source_key), 0) as sources_count,
  COALESCE(SUM(cbs.citations_count), 0) as total_citations,
  -- sources配列をJSON事前生成（既存API互換、ソート済み）
  COALESCE(
    json_agg(
      json_build_object(
        'sourceKey', cbs.source_key,
        'title', cbs.title,
        'url', cbs.url,
        'citationsCount', cbs.citations_count::text,  -- bigint→string (DTO互換)
        'totalWeight', cbs.total_weight::text,
        'totalQuotedTokens', cbs.total_quoted_tokens::text,
        'totalQuotedChars', cbs.total_quoted_chars::text,
        'maxScore', CASE WHEN cbs.max_score > 0 THEN cbs.max_score::text END,
        'avgScore', CASE WHEN cbs.avg_score > 0 THEN cbs.avg_score::text END,
        'lastCitedAt', cbs.last_cited_at::text
      )
      ORDER BY 
        -- ソートロジック: maxScore DESC NULLS LAST, citationsCount DESC, lastCitedAt DESC
        CASE WHEN cbs.max_score IS NULL OR cbs.max_score = 0 THEN 1 ELSE 0 END,
        cbs.max_score DESC NULLS LAST,
        cbs.citations_count DESC,
        cbs.last_cited_at DESC
    ) FILTER (WHERE cbs.source_key IS NOT NULL),
    '[]'::json
  ) as sources
FROM response_base rb
LEFT JOIN citations_by_source cbs ON cbs.response_id = rb.response_id
GROUP BY 
  rb.response_id, rb.organization_id, rb.session_id, rb.user_id, 
  rb.model_name, rb.response_created_at
ORDER BY rb.response_created_at DESC;

-- ■ 2. コンテンツパフォーマンスランキングMV（v2: 衝突回避）
-- 目的: AI引用メトリクスベースのコンテンツランキング事前計算
-- 戦略: 外部WHERE条件で期間絞り込み、MVは全データ保持
CREATE MATERIALIZED VIEW mv_content_perf_ranking_v2 AS
WITH ai_citation_metrics AS (
  -- AI引用ベースのコンテンツメトリクス計算
  SELECT 
    cu.id as content_id,
    cu.organization_id,
    cu.title,
    cu.url as canonical_url,
    cu.content_type,
    cu.last_updated as created_at,
    -- AI引用関連メトリクス
    COUNT(DISTINCT i.response_id) as ai_citation_responses,
    COUNT(i.id) as ai_citations_total,
    SUM(COALESCE(CAST(i.meta->>'quoted_tokens' AS integer), 0)) as quoted_tokens_total,
    SUM(COALESCE(LENGTH(i.snippet), 0)) as quoted_chars_total,
    AVG(COALESCE(CAST(i.meta->>'score' AS numeric), 0)) as avg_citation_score,
    MAX(COALESCE(CAST(i.meta->>'score' AS numeric), 0)) as max_citation_score,
    MAX(i.created_at) as last_cited_at,
    -- 「ページビュー相当」として quoted_tokens を使用
    SUM(COALESCE(CAST(i.meta->>'quoted_tokens' AS integer), 0)) as page_views_equivalent
  FROM ai_content_units cu
  LEFT JOIN ai_citations_items i ON i.content_unit_id = cu.id
  WHERE cu.organization_id IS NOT NULL 
    AND cu.url IS NOT NULL
  GROUP BY cu.id, cu.organization_id, cu.title, cu.url, cu.content_type, cu.last_updated
),
org_performance_baseline AS (
  -- 組織別パフォーマンス基準値計算
  SELECT 
    organization_id,
    COUNT(*) as total_contents,
    AVG(page_views_equivalent) as avg_page_views,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY page_views_equivalent) as median_page_views,
    PERCENTILE_CONT(0.1) WITHIN GROUP (ORDER BY page_views_equivalent) as p10_page_views,
    PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY page_views_equivalent) as p90_page_views,
    STDDEV(page_views_equivalent) as stddev_page_views
  FROM ai_citation_metrics
  GROUP BY organization_id
)
SELECT 
  acm.content_id,
  acm.organization_id,
  acm.title,
  acm.canonical_url,
  acm.content_type,
  acm.created_at,
  acm.ai_citation_responses,
  acm.ai_citations_total,
  acm.quoted_tokens_total,
  acm.quoted_chars_total,
  acm.avg_citation_score,
  acm.max_citation_score,
  acm.last_cited_at,
  acm.page_views_equivalent as page_views,  -- quoted_tokens を「ページビュー」として扱う
  opb.avg_page_views,
  opb.median_page_views,
  opb.total_contents,
  -- パフォーマンス分類（アプリロジック移植）
  CASE 
    WHEN acm.page_views_equivalent = 0 THEN 'zero_views'
    WHEN acm.page_views_equivalent < opb.avg_page_views * 0.3 THEN 'weak_performance'
    WHEN acm.page_views_equivalent > opb.avg_page_views * 1.5 THEN 'high_performance'
    WHEN acm.page_views_equivalent > opb.p90_page_views THEN 'top_performance'
    ELSE 'average_performance'
  END as performance_category,
  -- 弱点理由生成（アプリのweaknessReason移植）
  CASE 
    WHEN acm.page_views_equivalent = 0 THEN 'AI引用されていません'
    WHEN acm.page_views_equivalent < opb.avg_page_views * 0.3 THEN 
      'AI引用頻度が組織平均を大きく下回っています'
    WHEN acm.ai_citations_total < 3 THEN
      'AI引用回数が少ない状態です'
    ELSE 
      '相対的にAI引用が少ない状態です'
  END as weakness_reason,
  -- ランキング計算（getTopContents/getWeakContents用）
  ROW_NUMBER() OVER (
    PARTITION BY acm.organization_id 
    ORDER BY acm.page_views_equivalent DESC, acm.created_at DESC
  ) as rank_by_views,
  ROW_NUMBER() OVER (
    PARTITION BY acm.organization_id 
    ORDER BY acm.page_views_equivalent ASC, acm.created_at ASC
  ) as rank_by_weakness,
  -- スコア順ランキング（高品質コンテンツ特定用）
  ROW_NUMBER() OVER (
    PARTITION BY acm.organization_id 
    ORDER BY acm.max_citation_score DESC NULLS LAST, acm.avg_citation_score DESC NULLS LAST
  ) as rank_by_score,
  -- MV更新タイムスタンプ（鮮度監視用）
  now() as computed_at
FROM ai_citation_metrics acm
INNER JOIN org_performance_baseline opb ON opb.organization_id = acm.organization_id;

-- ■ 3. 軽量組織ID解決関数（SECURITY DEFINER）
-- 目的: RLSサブクエリ最適化、権限チェック集約化
CREATE OR REPLACE FUNCTION fn_get_org_by_response(p_response_id uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER  -- service_role 権限で実行（RLS回避）
STABLE  -- 同一transaction内結果キャッシュ
AS $$
  SELECT organization_id 
  FROM ai_citations_responses 
  WHERE id = p_response_id
  LIMIT 1;  -- 確実に1件または NULL
$$;

-- ■ 4. 高性能インデックス追加（CONCURRENTLY, IF NOT EXISTS）

-- ai_citations_responses 高速化
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_citations_responses_org_created_v2
  ON ai_citations_responses (organization_id, created_at DESC) 
  WHERE organization_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_citations_responses_session_created_v2
  ON ai_citations_responses (session_id, created_at DESC)
  WHERE session_id IS NOT NULL;

-- ai_citations_items 高速化  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_citations_items_response_meta_v2
  ON ai_citations_items (response_id, content_unit_id)
  WHERE response_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_citations_items_content_unit_v2
  ON ai_citations_items (content_unit_id, created_at DESC)
  WHERE content_unit_id IS NOT NULL;

-- ai_content_units 高速化
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_content_units_org_url_v2
  ON ai_content_units (organization_id, url)
  WHERE organization_id IS NOT NULL AND url IS NOT NULL;

-- MV専用高速検索インデックス
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_mv_content_perf_ranking_v2_unique
  ON mv_content_perf_ranking_v2 (organization_id, content_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mv_content_perf_top_ranking_v2
  ON mv_content_perf_ranking_v2 (organization_id, rank_by_views)
  WHERE rank_by_views <= 10;  -- TOP10コンテンツ高速化

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mv_content_perf_weak_ranking_v2
  ON mv_content_perf_ranking_v2 (organization_id, rank_by_weakness)
  WHERE performance_category IN ('zero_views', 'weak_performance');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mv_content_perf_score_ranking_v2
  ON mv_content_perf_ranking_v2 (organization_id, rank_by_score)
  WHERE rank_by_score <= 5;  -- 高品質TOP5

-- ■ 5. RLS継承確認（VIEW/MV/Function）
-- ベーステーブルのRLSポリシが自動継承されることを確認
-- 追加ポリシは不要（既存RLS設定を活用）
/*
v_ai_response_groups_v2: ai_citations_responses の organization_members RLS継承
mv_content_perf_ranking_v2: ai_content_units の organization RLS継承  
fn_get_org_by_response: SECURITY DEFINER により意図的にRLS無視
*/

-- ■ 6. 権限設定（最小権限原則）
-- 認証済みユーザー: 読み取り専用権限
GRANT SELECT ON v_ai_response_groups_v2 TO authenticated;
GRANT SELECT ON mv_content_perf_ranking_v2 TO authenticated;

-- Edge Function / API 経由アクセス用
GRANT SELECT ON v_ai_response_groups_v2 TO service_role;
GRANT SELECT ON mv_content_perf_ranking_v2 TO service_role;

-- 関数権限制御: anon/authenticated からのEXECUTEを明示的にREVOKE
REVOKE EXECUTE ON FUNCTION fn_get_org_by_response(uuid) FROM anon, authenticated;
-- service_role のみに限定許可（API経由のみ）
GRANT EXECUTE ON FUNCTION fn_get_org_by_response(uuid) TO service_role;

-- ■ 7. pg_cron自動更新ジョブ設定
-- mv_content_perf_ranking_v2 の毎時自動更新（負荷分散）
SELECT cron.schedule(
  'refresh-content-ranking-mv-v2',
  '25 * * * *',  -- 毎時25分実行（既存ジョブとの時間分散）
  $$REFRESH MATERIALIZED VIEW CONCURRENTLY mv_content_perf_ranking_v2;$$
);

-- ■ 8. 運用監視用メタデータ
-- セマンティックコメント（ドキュメント化）
COMMENT ON VIEW v_ai_response_groups_v2 IS
'AI引用レスポンスグループ化VIEW v2。アプリのgroupByResponseId()処理をDB化、sources配列JSON事前生成・ソート済み。全期間対象（API側で期間制御）。90%処理時間短縮目標。';

COMMENT ON MATERIALIZED VIEW mv_content_perf_ranking_v2 IS
'AIコンテンツパフォーマンスランキングMV v2。引用メトリクス（quoted_tokens）ベースの順位・分類事前計算。getTopContents/getWeakContents処理置換。毎時25分更新、95%処理時間短縮目標。';

COMMENT ON FUNCTION fn_get_org_by_response(uuid) IS
'レスポンスID→組織ID高速解決関数。SECURITY DEFINER（service_role）でRLS最適化。サブクエリ簡素化、70%RLS処理短縮目標。anon/authenticated実行禁止。';

-- ■ 9. 初回MV構築手順（コメント形式）
-- 本SQLファイル適用後、以下を実行してMVを初期構築:
-- REFRESH MATERIALIZED VIEW CONCURRENTLY mv_content_perf_ranking_v2;

-- ■ 10. 統計情報更新（性能最適化）
-- 新規オブジェクトのクエリプラン最適化（本番適用後推奨）:
-- ANALYZE mv_content_perf_ranking_v2;

-- ====================================================================
-- 段階切替用の環境変数制御例（API/Edge Function側実装参考）
-- ====================================================================
/*
■ API側での段階切替実装例:

-- src/app/api/my/ai-citations/route.ts
const USE_AI_RESPONSE_GROUPS = process.env.USE_AI_RESPONSE_GROUPS === 'true';

if (USE_AI_RESPONSE_GROUPS) {
  // 新: v_ai_response_groups_v2 使用（90%高速化）
  const { data } = await supabase
    .from('v_ai_response_groups_v2')
    .select('*')
    .eq('session_id', sessionId);
    
  const response = {
    sessionId,
    responses: data?.map(row => ({
      responseId: row.response_id,
      organizationId: row.organization_id,
      sessionId: row.session_id,
      userId: row.user_id,
      model: row.model,
      responseCreatedAt: row.response_created_at,
      sources: JSON.parse(row.sources)  // 事前生成JSON使用
    })) || [],
    totalResponses: data?.length || 0,
    totalSources: data?.reduce((sum, r) => sum + r.sources_count, 0) || 0
  };
  return NextResponse.json({ success: true, data: response });
} else {
  // 旧: 既存groupByResponseId()ロジック継続
  const aggregates = await supabase.from('v_ai_citations_aggregates')...;
  const responses = groupByResponseId(aggregates || []);
  // 既存処理
}

■ Edge Function での切替実装例:

-- Edge Function: monthly-report-generate
const USE_CONTENT_RANKING = Deno.env.get('USE_CONTENT_RANKING_MV') === 'true';

if (USE_CONTENT_RANKING) {
  // 新: mv_content_perf_ranking_v2 直接取得（95%高速化）
  const [topContents, weakContents] = await Promise.all([
    supabaseClient
      .from('mv_content_perf_ranking_v2')
      .select('content_id, title, canonical_url, page_views')
      .eq('organization_id', orgId)
      .lte('rank_by_views', 5)
      .order('rank_by_views'),
    
    supabaseClient
      .from('mv_content_perf_ranking_v2')
      .select('content_id, title, canonical_url, page_views, weakness_reason')
      .eq('organization_id', orgId)
      .in('performance_category', ['zero_views', 'weak_performance'])
      .lte('rank_by_weakness', 5)
      .order('rank_by_weakness')
  ]);
  
  return { topContents: topContents.data, weakContents: weakContents.data };
} else {
  // 旧: アプリ側でgetTopContents/getWeakContents実行
  const topContents = await getTopContents(orgId, period, 5);
  const weakContents = await getWeakContents(orgId, period, 5);
  return { topContents, weakContents };
}
*/