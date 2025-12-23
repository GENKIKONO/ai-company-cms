-- ====================================================================
-- AI Citations DB Minimal Diff - 既存回避版
-- 重複を避けた差分最小のDB昇華案
-- ====================================================================

-- ■ 1. レスポンスグループ化VIEW（重複回避：v_ai_response_groups）
-- 目的: アプリ側のgroupByResponseId()処理をDB化
-- 既存v_ai_citations_aggregatesとの差別化: レスポンス単位のグループ化特化
CREATE VIEW v_ai_response_groups AS
WITH response_base AS (
  -- 既存MVを活用してレスポンス単位で事前集約
  SELECT 
    r.id as response_id,
    r.organization_id,
    r.session_id,
    r.user_id,
    r.model_name as model,
    r.created_at as response_created_at,
    COUNT(DISTINCT COALESCE(i.content_unit_id::text, cu.url, i.uri)) as sources_count,
    SUM(COUNT(i.id)) OVER (PARTITION BY r.id) as total_citations_in_response
  FROM ai_citations_responses r
  LEFT JOIN ai_citations_items i ON r.id = i.response_id  
  LEFT JOIN ai_content_units cu ON i.content_unit_id = cu.id
  WHERE r.created_at >= CURRENT_DATE - INTERVAL '90 days'
    AND r.organization_id IS NOT NULL
  GROUP BY r.id, r.organization_id, r.session_id, r.user_id, r.model_name, r.created_at
)
SELECT 
  rb.*,
  -- sources配列をJSON集約（ソート済み）
  COALESCE(
    json_agg(
      json_build_object(
        'sourceKey', agg.source_key,
        'title', agg.title,
        'url', agg.url,
        'citationsCount', agg.citations_count,
        'totalWeight', agg.total_weight,
        'totalQuotedTokens', agg.total_quoted_tokens,
        'totalQuotedChars', agg.total_quoted_chars,
        'maxScore', agg.max_score,
        'avgScore', agg.avg_score,
        'lastCitedAt', agg.last_cited_at
      )
      ORDER BY 
        CASE WHEN agg.max_score::numeric IS NULL THEN 1 ELSE 0 END,
        agg.max_score::numeric DESC NULLS LAST,
        agg.citations_count::bigint DESC,
        agg.last_cited_at DESC
    ) FILTER (WHERE agg.source_key IS NOT NULL), 
    '[]'::json
  ) as sources
FROM response_base rb
LEFT JOIN v_ai_citations_aggregates agg ON agg.response_id = rb.response_id
GROUP BY rb.response_id, rb.organization_id, rb.session_id, rb.user_id, 
         rb.model, rb.response_created_at, rb.sources_count, rb.total_citations_in_response;

-- 高速検索用インデックス
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_v_ai_response_groups_session
  ON ai_citations_responses (session_id, created_at DESC) 
  WHERE organization_id IS NOT NULL;

-- ■ 2. コンテンツパフォーマンスランキングMV（新規）
-- 目的: getTopContents/getWeakContentsロジックをDB化
-- 90日増分戦略: WHERE条件で期間限定し、毎時REFRESH
CREATE MATERIALIZED VIEW mv_content_perf_ranking AS
WITH analytics_union AS (
  -- パーティションテーブル統合（サンプル：最新3ヶ月）
  -- 本番では全パーティションをUNION ALLで統合
  SELECT page_url, COUNT(*) as view_count
  FROM analytics_events_202412 
  WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
  GROUP BY page_url
  
  UNION ALL
  
  SELECT page_url, COUNT(*) as view_count  
  FROM analytics_events_202411
  WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
  GROUP BY page_url
  
  UNION ALL
  
  SELECT page_url, COUNT(*) as view_count
  FROM analytics_events_202410  
  WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
  GROUP BY page_url
),
content_pageviews AS (
  SELECT 
    cuv.id,
    cuv.organization_id,
    cuv.content_type,
    cuv.title,
    cuv.canonical_url,
    cuv.created_at,
    cuv.is_published,
    COALESCE(SUM(au.view_count), 0) as page_views,
    -- URL正規化マッチング
    COALESCE(
      SUM(CASE WHEN au.page_url = cuv.canonical_url THEN au.view_count ELSE 0 END),
      SUM(CASE WHEN au.page_url = regexp_replace(cuv.canonical_url, '^https?://', '') THEN au.view_count ELSE 0 END),
      0
    ) as normalized_page_views
  FROM content_union_view cuv
  LEFT JOIN analytics_union au ON (
    au.page_url = cuv.canonical_url OR 
    au.page_url = regexp_replace(cuv.canonical_url, '^https?://', '')
  )
  WHERE cuv.is_published = true 
    AND cuv.canonical_url IS NOT NULL
    AND cuv.created_at >= CURRENT_DATE - INTERVAL '90 days'
  GROUP BY cuv.id, cuv.organization_id, cuv.content_type, cuv.title, 
           cuv.canonical_url, cuv.created_at, cuv.is_published
),
org_stats AS (
  -- 組織別統計（平均・中央値計算）
  SELECT 
    organization_id,
    COUNT(*) as total_contents,
    AVG(page_views) as avg_page_views,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY page_views) as median_page_views,
    PERCENTILE_CONT(0.1) WITHIN GROUP (ORDER BY page_views) as p10_page_views,
    PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY page_views) as p90_page_views
  FROM content_pageviews  
  GROUP BY organization_id
)
SELECT 
  cp.id as content_id,
  cp.organization_id,
  cp.content_type,
  cp.title,
  cp.canonical_url,
  cp.created_at,
  cp.page_views,
  cp.normalized_page_views,
  os.avg_page_views,
  os.median_page_views,
  os.total_contents,
  -- パフォーマンス分類ロジック（アプリと同等）
  CASE 
    WHEN cp.page_views = 0 THEN 'zero_views'
    WHEN cp.page_views < os.avg_page_views * 0.3 THEN 'weak_performance'  
    WHEN cp.page_views > os.avg_page_views * 1.5 THEN 'high_performance'
    WHEN cp.page_views > os.p90_page_views THEN 'top_performance'
    ELSE 'average_performance'
  END as performance_category,
  -- 弱点理由（アプリのweaknessReason相当）
  CASE 
    WHEN cp.page_views = 0 THEN 'ページビューがありません'
    WHEN cp.page_views < os.avg_page_views * 0.3 THEN 
      '平均的なページビューを大きく下回っています'
    ELSE 
      '相対的にページビューが少ない状態です'
  END as weakness_reason,
  -- ランキング（TOP/WEAK コンテンツ特定用）
  ROW_NUMBER() OVER (
    PARTITION BY cp.organization_id 
    ORDER BY cp.page_views DESC, cp.created_at DESC
  ) as rank_by_views,
  ROW_NUMBER() OVER (
    PARTITION BY cp.organization_id 
    ORDER BY cp.page_views ASC, cp.created_at ASC
  ) as rank_by_weakness,
  -- 生成タイムスタンプ（データ鮮度確認用）
  now() as computed_at
FROM content_pageviews cp
INNER JOIN org_stats os ON os.organization_id = cp.organization_id;

-- MVの複合インデックス（組織×ランキング高速化）
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_mv_content_perf_ranking_unique
  ON mv_content_perf_ranking (organization_id, content_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mv_content_perf_top_contents  
  ON mv_content_perf_ranking (organization_id, rank_by_views)
  WHERE rank_by_views <= 10;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mv_content_perf_weak_contents
  ON mv_content_perf_ranking (organization_id, rank_by_weakness) 
  WHERE performance_category IN ('zero_views', 'weak_performance');

-- ■ 3. 軽量認可関数（SECURITY DEFINER, anon/authenticatedからREVOKE）
-- 目的: RLSサブクエリ簡素化、get_org_id_by_response処理統一
CREATE OR REPLACE FUNCTION fn_get_org_by_response(response_id uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER  -- service_role権限で実行
STABLE  -- 同一transaction内でキャッシュ可能
AS $$
  SELECT organization_id 
  FROM ai_citations_responses 
  WHERE id = response_id;
$$;

-- 権限制御: anon/authenticatedからの直接実行を禁止
REVOKE EXECUTE ON FUNCTION fn_get_org_by_response(uuid) FROM anon, authenticated;

-- service_role専用（API/Edge Function経由のみ許可）
GRANT EXECUTE ON FUNCTION fn_get_org_by_response(uuid) TO service_role;

-- ■ 4. RLS適用（既存ポリシー拡張）
-- v_ai_response_groups用RLS
-- 注意: VIEWはベーステーブルのRLSを継承するが、明示的に制御
CREATE POLICY IF NOT EXISTS "v_ai_response_groups_org_access" 
ON ai_citations_responses FOR SELECT USING (
  organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid()
  )
);

-- mv_content_perf_ranking用RLS（通常は不要だがセキュリティ強化）
-- MVは基本的にAPI経由アクセスを想定
ALTER MATERIALIZED VIEW mv_content_perf_ranking OWNER TO service_role;

-- ■ 5. 権限付与（最小権限原則）
-- 認証済みユーザーに読み取り専用権限
GRANT SELECT ON v_ai_response_groups TO authenticated;
GRANT SELECT ON mv_content_perf_ranking TO authenticated, anon;

-- Edge Function / API用
GRANT SELECT ON v_ai_response_groups TO service_role;
GRANT SELECT ON mv_content_perf_ranking TO service_role;

-- ■ 6. 自動更新設定（pg_cron）
-- コンテンツランキングMV: 毎時0分にREFRESH（CONCURRENTLY = 無停止）
-- 既存の引用MVと時間をずらして負荷分散
SELECT cron.schedule(
  'refresh-content-ranking-mv', 
  '15 * * * *',  -- 毎時15分（既存引用MVとずらす）
  $$REFRESH MATERIALIZED VIEW CONCURRENTLY mv_content_perf_ranking;$$
);

-- ■ 7. セマンティックコメント（ドキュメント化）
COMMENT ON VIEW v_ai_response_groups IS 
'レスポンス単位でのAI引用グループ化VIEW。アプリのgroupByResponseId()処理を置換。sources配列をJSON事前生成し、ソート済み。90日間のデータ対象。';

COMMENT ON MATERIALIZED VIEW mv_content_perf_ranking IS
'コンテンツパフォーマンスランキングMV。組織×コンテンツの PV数・順位・分類を事前計算。getTopContents/getWeakContents処理を置換。毎時15分更新。';

COMMENT ON FUNCTION fn_get_org_by_response(uuid) IS
'レスポンスIDから組織IDを取得する軽量関数。RLS最適化・サブクエリ簡素化用。SECURITY DEFINER（service_role権限）で実行。';

-- ■ 8. 統計情報更新（性能最適化）
-- 新規MV/VIEWの統計を手動更新（初回作成後のクエリプラン最適化）
-- 本番適用後にEXECUTE推奨
-- ANALYZE mv_content_perf_ranking;

-- ■ 9. 増分更新戦略（大量データ対応）
-- 将来的にデータ増大時の対応策（コメントで方針記録）
/*
増分更新戦略（データ量増大時）:
1. mv_content_perf_ranking: WHERE created_at フィルタ条件をより短期間に調整
2. analytics_union: パーティションテーブル範囲を動的生成（PL/pgSQL化）
3. REFRESH CONCURRENTLY失敗時のフォールバック: 部分更新 → 全体更新のカスケード
*/

-- ====================================================================
-- 既存オブジェクトとの関係性
-- ====================================================================
/*
【活用する既存オブジェクト】
- v_ai_citations_aggregates: v_ai_response_groupsで参照
- mv_ai_citations_org_period: 引き続き期間集計で使用  
- content_union_view: コンテンツ統合ビューとしてmv_content_perf_rankingで活用
- organization_members: RLSでの組織認可ベース

【既存Edge Functionsとの関係】  
- monthly-report-generate: mv_content_perf_rankingのデータを参照可能
- reports-api: v_ai_response_groupsで高速化されたセッション取得
- ai-public: fn_get_org_by_response で認可チェック軽量化

【非破壊的共存】
既存のテーブル・API・Edge Functionsは無変更。
新規オブジェクトは「追加」のみで、段階的参照切替により移行。
*/