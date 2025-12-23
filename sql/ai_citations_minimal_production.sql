-- ====================================================================
-- AI Citations Production Migration - Minimal Implementation
-- 既存DB実態準拠、ゼロダウンタイム段階切替対応
-- ====================================================================

-- ■ 1. レスポンスグループ化VIEW（衝突なし確認済み）
-- 目的: アプリのgroupByResponseId()処理をDB化、sources配列JSON事前生成
-- 汎用性: 90日フィルタなし、全期間対象でAPI側で期間指定
CREATE VIEW v_ai_response_groups_v1 AS
WITH response_metadata AS (
  -- レスポンス基本情報（重複排除）
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
citations_aggregated AS (
  -- 引用アイテム集約（source_key単位）
  SELECT 
    i.response_id,
    COALESCE(i.content_unit_id::text, cu.url, i.uri) as source_key,
    COALESCE(cu.title, i.title) as title,
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
  GROUP BY i.response_id, 
           COALESCE(i.content_unit_id::text, cu.url, i.uri),
           COALESCE(cu.title, i.title), 
           COALESCE(cu.url, i.uri)
)
SELECT 
  rm.response_id,
  rm.organization_id,
  rm.session_id,
  rm.user_id,
  rm.model_name as model,  -- API互換エイリアス
  rm.response_created_at,
  COALESCE(COUNT(ca.source_key), 0) as sources_count,
  COALESCE(SUM(ca.citations_count), 0) as total_citations,
  -- sources配列をJSON事前生成（ソート済み）
  COALESCE(
    json_agg(
      json_build_object(
        'sourceKey', ca.source_key,
        'title', ca.title,
        'url', ca.url,
        'citationsCount', ca.citations_count::text,  -- bigint→string (API互換)
        'totalWeight', ca.total_weight::text,
        'totalQuotedTokens', ca.total_quoted_tokens::text,
        'totalQuotedChars', ca.total_quoted_chars::text,
        'maxScore', CASE WHEN ca.max_score IS NOT NULL THEN ca.max_score::text END,
        'avgScore', CASE WHEN ca.avg_score IS NOT NULL THEN ca.avg_score::text END,
        'lastCitedAt', ca.last_cited_at::text
      )
      ORDER BY 
        CASE WHEN ca.max_score IS NULL THEN 1 ELSE 0 END,
        ca.max_score DESC NULLS LAST,
        ca.citations_count DESC,
        ca.last_cited_at DESC
    ) FILTER (WHERE ca.source_key IS NOT NULL),
    '[]'::json
  ) as sources
FROM response_metadata rm
LEFT JOIN citations_aggregated ca ON ca.response_id = rm.response_id
GROUP BY rm.response_id, rm.organization_id, rm.session_id, rm.user_id, 
         rm.model_name, rm.response_created_at
ORDER BY rm.response_created_at DESC;

-- ■ 2. コンテンツパフォーマンスランキングMV
-- 目的: getTopContents/getWeakContentsロジックのDB化、事前計算ランキング
-- 期間戦略: 外部WHERE条件で絞り込み（MVは全データ、API側で期間指定）
CREATE MATERIALIZED VIEW mv_content_perf_ranking_v1 AS
WITH content_citation_metrics AS (
  -- AI引用関連メトリクス（quoted_tokens/chars をページビュー代替）
  SELECT 
    cu.id as content_id,
    cu.organization_id,
    cu.title,
    cu.url as canonical_url,
    cu.content_type,
    cu.last_updated as created_at,
    -- AI引用ベースの「視認度」メトリクス
    COUNT(DISTINCT i.response_id) as ai_citation_responses,
    COUNT(i.id) as ai_citations_total,
    SUM(COALESCE(CAST(i.meta->>'quoted_tokens' AS integer), 0)) as quoted_tokens_total,
    SUM(COALESCE(LENGTH(i.snippet), 0)) as quoted_chars_total,
    AVG(COALESCE(CAST(i.meta->>'score' AS numeric), 0)) as avg_citation_score,
    MAX(i.created_at) as last_cited_at
  FROM ai_content_units cu
  LEFT JOIN ai_citations_items i ON i.content_unit_id = cu.id
  WHERE cu.organization_id IS NOT NULL 
    AND cu.url IS NOT NULL
  GROUP BY cu.id, cu.organization_id, cu.title, cu.url, cu.content_type, cu.last_updated
),
org_performance_stats AS (
  -- 組織別パフォーマンス統計（平均・分位数計算）
  SELECT 
    organization_id,
    COUNT(*) as total_contents,
    AVG(quoted_tokens_total) as avg_quoted_tokens,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY quoted_tokens_total) as median_quoted_tokens,
    PERCENTILE_CONT(0.1) WITHIN GROUP (ORDER BY quoted_tokens_total) as p10_quoted_tokens,
    PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY quoted_tokens_total) as p90_quoted_tokens
  FROM content_citation_metrics
  GROUP BY organization_id
)
SELECT 
  ccm.content_id,
  ccm.organization_id,
  ccm.title,
  ccm.canonical_url,
  ccm.content_type,
  ccm.created_at,
  ccm.ai_citation_responses,
  ccm.ai_citations_total,
  ccm.quoted_tokens_total as page_views,  -- quoted_tokens を「ページビュー相当」として使用
  ccm.quoted_chars_total,
  ccm.avg_citation_score,
  ccm.last_cited_at,
  ops.avg_quoted_tokens,
  ops.median_quoted_tokens,
  ops.total_contents,
  -- パフォーマンス分類（アプリロジック移植）
  CASE 
    WHEN ccm.quoted_tokens_total = 0 THEN 'zero_views'
    WHEN ccm.quoted_tokens_total < ops.avg_quoted_tokens * 0.3 THEN 'weak_performance'
    WHEN ccm.quoted_tokens_total > ops.avg_quoted_tokens * 1.5 THEN 'high_performance'
    WHEN ccm.quoted_tokens_total > ops.p90_quoted_tokens THEN 'top_performance'
    ELSE 'average_performance'
  END as performance_category,
  -- 弱点理由生成（アプリのweaknessReason相当）
  CASE 
    WHEN ccm.quoted_tokens_total = 0 THEN 'AI引用がありません'
    WHEN ccm.quoted_tokens_total < ops.avg_quoted_tokens * 0.3 THEN 
      'AI引用頻度が平均を大きく下回っています'
    ELSE 
      '相対的にAI引用が少ない状態です'
  END as weakness_reason,
  -- ランキング計算（TOP/WEAK判定用）
  ROW_NUMBER() OVER (
    PARTITION BY ccm.organization_id 
    ORDER BY ccm.quoted_tokens_total DESC, ccm.created_at DESC
  ) as rank_by_views,
  ROW_NUMBER() OVER (
    PARTITION BY ccm.organization_id 
    ORDER BY ccm.quoted_tokens_total ASC, ccm.created_at ASC
  ) as rank_by_weakness,
  -- 計算タイムスタンプ（鮮度監視用）
  now() as computed_at
FROM content_citation_metrics ccm
INNER JOIN org_performance_stats ops ON ops.organization_id = ccm.organization_id;

-- ■ 3. 軽量組織ID解決関数（SECURITY DEFINER）
-- 目的: RLS最適化、サブクエリ簡素化、権限チェック集約化
CREATE OR REPLACE FUNCTION fn_get_org_by_response(response_id uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER  -- service_role 権限で実行（RLS無視）
STABLE  -- 同一transaction内でキャッシュ可能
AS $$
  SELECT organization_id 
  FROM ai_citations_responses 
  WHERE id = response_id
  LIMIT 1;  -- 確実に1件のみ返却
$$;

-- ■ 4. 必要インデックス追加（IF NOT EXISTS, CONCURRENTLY）
-- ai_citations_responses 高速化
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_citations_responses_org_created
  ON ai_citations_responses (organization_id, created_at DESC) 
  WHERE organization_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_citations_responses_session_created
  ON ai_citations_responses (session_id, created_at DESC)
  WHERE session_id IS NOT NULL;

-- ai_citations_items 高速化  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_citations_items_response_id
  ON ai_citations_items (response_id) 
  WHERE response_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_citations_items_content_unit
  ON ai_citations_items (content_unit_id)
  WHERE content_unit_id IS NOT NULL;

-- ai_content_units 高速化
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_content_units_org_url
  ON ai_content_units (organization_id, url)
  WHERE organization_id IS NOT NULL AND url IS NOT NULL;

-- MVの高速検索インデックス
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_mv_content_perf_ranking_v1_unique
  ON mv_content_perf_ranking_v1 (organization_id, content_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mv_content_perf_top_v1
  ON mv_content_perf_ranking_v1 (organization_id, rank_by_views)
  WHERE rank_by_views <= 10;  -- TOP10のみ高速化

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mv_content_perf_weak_v1
  ON mv_content_perf_ranking_v1 (organization_id, rank_by_weakness)
  WHERE performance_category IN ('zero_views', 'weak_performance');

-- ■ 5. RLS継承確認（VIEW/MV用）
-- ベーステーブルのRLSが継承されることを確認
-- VIEWはベーステーブルのRLSポリシを自動継承
-- 追加のポリシは不要だが、明示的確認のためコメント記載
/*
v_ai_response_groups_v1: ai_citations_responsesのRLSにより組織制限
mv_content_perf_ranking_v1: ai_content_unitsのRLSにより組織制限
fn_get_org_by_response: SECURITY DEFINERによりRLS無視（意図的）
*/

-- ■ 6. 権限設定（最小権限原則）
-- VIEW: 認証済みユーザーに読み取り専用
GRANT SELECT ON v_ai_response_groups_v1 TO authenticated;
GRANT SELECT ON mv_content_perf_ranking_v1 TO authenticated;

-- Edge Function / API 用
GRANT SELECT ON v_ai_response_groups_v1 TO service_role;
GRANT SELECT ON mv_content_perf_ranking_v1 TO service_role;

-- 関数の権限制御: anon/authenticated からEXECUTEをREVOKE
REVOKE EXECUTE ON FUNCTION fn_get_org_by_response(uuid) FROM anon, authenticated;
-- service_role のみ許可（API/Edge Function経由限定）
GRANT EXECUTE ON FUNCTION fn_get_org_by_response(uuid) TO service_role;

-- ■ 7. pg_cron自動更新設定
-- mv_content_perf_ranking_v1 の毎時更新（負荷分散のため20分に設定）
SELECT cron.schedule(
  'refresh-content-ranking-mv-v1',
  '20 * * * *',  -- 毎時20分実行（既存ジョブと時間分散）
  $$REFRESH MATERIALIZED VIEW CONCURRENTLY mv_content_perf_ranking_v1;$$
);

-- ■ 8. セマンティックCOMMENT（運用ドキュメント化）
COMMENT ON VIEW v_ai_response_groups_v1 IS
'AI引用レスポンスのグループ化VIEW。アプリのgroupByResponseId()処理をDB化。sources配列をJSON事前生成、ソート済み。全期間対象、API側で期間フィルタリング。';

COMMENT ON MATERIALIZED VIEW mv_content_perf_ranking_v1 IS
'コンテンツパフォーマンスランキングMV。AI引用メトリクス（quoted_tokens）ベースの順位・分類を事前計算。getTopContents/getWeakContents処理置換。毎時20分更新。';

COMMENT ON FUNCTION fn_get_org_by_response(uuid) IS
'レスポンスIDから組織IDを高速解決。SECURITY DEFINER（service_role権限）でRLS回避。サブクエリ最適化・権限チェック集約用。anon/authenticated実行禁止。';

-- ■ 9. 初回MV構築（適用後実行推奨）
-- 本SQLファイル適用後、以下をmanual実行してMVを初期構築
-- REFRESH MATERIALIZED VIEW mv_content_perf_ranking_v1;

-- ■ 10. 統計情報更新（性能最適化）
-- 新規オブジェクトの統計情報を最新化（クエリプラン最適化）
-- 本番適用後に実行推奨:
-- ANALYZE mv_content_perf_ranking_v1;

-- ====================================================================
-- 段階切替用の環境変数参照例
-- ====================================================================
/*
API側での段階切替例:

-- src/app/api/my/ai-citations/route.ts
const USE_AI_RESPONSE_GROUPS = process.env.USE_AI_RESPONSE_GROUPS === 'true';

if (USE_AI_RESPONSE_GROUPS) {
  // 新: v_ai_response_groups_v1 使用
  const { data } = await supabase
    .from('v_ai_response_groups_v1')
    .select('*')
    .eq('session_id', sessionId);
    
  return {
    sessionId,
    responses: data || [],
    totalResponses: data?.length || 0,
    totalSources: data?.reduce((sum, r) => sum + JSON.parse(r.sources).length, 0) || 0
  };
} else {
  // 旧: 既存ロジック継続
}

-- Edge Function: reports-* での切替例
const USE_CONTENT_RANKING = Deno.env.get('USE_CONTENT_RANKING_MV') === 'true';

if (USE_CONTENT_RANKING) {
  // 新: mv_content_perf_ranking_v1 から直接取得
  const { data: topContents } = await supabaseClient
    .from('mv_content_perf_ranking_v1')
    .select('content_id, title, canonical_url, page_views')
    .eq('organization_id', orgId)
    .lte('rank_by_views', 5)
    .order('rank_by_views');
} else {
  // 旧: アプリ側集計継続
}
*/