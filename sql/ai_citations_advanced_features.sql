-- ====================================================================
-- AI Citations & Reports Advanced DB Features
-- コード側の優れた機能をDBに昇華する具体案（SQL付き）
-- ====================================================================

-- ■ 1. レスポンスIDグループ化VIEW（最高優先度）
-- 現在: アプリ側でgroupByResponseId()実行
-- 改善: DB側でグループ化済みデータ提供

CREATE VIEW v_ai_citations_grouped_responses AS
WITH response_summary AS (
  SELECT 
    response_id,
    organization_id,
    session_id,
    user_id,
    model_name AS model,
    response_created_at,
    COUNT(*) as sources_count,
    SUM(citations_count::bigint) as total_citations,
    AVG(CASE WHEN max_score IS NOT NULL THEN max_score ELSE NULL END) as avg_max_score
  FROM v_ai_citations_aggregates 
  GROUP BY response_id, organization_id, session_id, user_id, model_name, response_created_at
)
SELECT 
  rs.*,
  json_agg(
    json_build_object(
      'sourceKey', vca.source_key,
      'title', vca.title,
      'url', vca.url,
      'citationsCount', vca.citations_count,
      'totalWeight', vca.total_weight,
      'totalQuotedTokens', vca.total_quoted_tokens,
      'totalQuotedChars', vca.total_quoted_chars,
      'maxScore', vca.max_score,
      'avgScore', vca.avg_score,
      'lastCitedAt', vca.last_cited_at
    )
    ORDER BY 
      CASE WHEN vca.max_score IS NULL THEN 1 ELSE 0 END,
      vca.max_score DESC NULLS LAST,
      vca.citations_count::bigint DESC,
      vca.last_cited_at DESC
  ) as sources
FROM response_summary rs
JOIN v_ai_citations_aggregates vca ON vca.response_id = rs.response_id
GROUP BY rs.response_id, rs.organization_id, rs.session_id, rs.user_id, rs.model, 
         rs.response_created_at, rs.sources_count, rs.total_citations, rs.avg_max_score;

-- ■ 2. コンテンツランキングMV（最高優先度）
-- 現在: アプリ側でgetTopContents/getWeakContentsロジック
-- 改善: 事前計算済みランキングデータ

CREATE MATERIALIZED VIEW mv_content_ranking AS
WITH content_pageviews AS (
  -- パーティションテーブル統合クエリ（サンプル: 90日分）
  SELECT 
    cuv.id as content_id,
    cuv.organization_id,
    cuv.content_type,
    cuv.title,
    cuv.canonical_url,
    cuv.created_at,
    COALESCE(pv_counts.total_pageviews, 0) as page_views
  FROM content_union_view cuv
  LEFT JOIN (
    -- 実際にはUNION ALLで全パーティションテーブル統合
    SELECT 
      page_url,
      COUNT(*) as total_pageviews
    FROM analytics_events_202412  -- 例：2024年12月パーティション
    WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
    GROUP BY page_url
    
    UNION ALL
    
    SELECT 
      page_url,
      COUNT(*) as total_pageviews  
    FROM analytics_events_202411  -- 例：2024年11月パーティション
    WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
    GROUP BY page_url
    -- 他のパーティションも続く...
  ) pv_counts ON (
    pv_counts.page_url = cuv.canonical_url OR 
    pv_counts.page_url = replace(replace(cuv.canonical_url, 'https://', ''), 'http://', '')
  )
  WHERE cuv.is_published = true 
    AND cuv.canonical_url IS NOT NULL
),
org_stats AS (
  SELECT 
    organization_id,
    AVG(page_views) as avg_page_views,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY page_views) as median_page_views,
    COUNT(*) as total_contents
  FROM content_pageviews
  GROUP BY organization_id
)
SELECT 
  cp.*,
  os.avg_page_views,
  os.median_page_views,
  os.total_contents,
  -- パフォーマンス分類
  CASE 
    WHEN cp.page_views = 0 THEN 'zero_views'
    WHEN cp.page_views < os.avg_page_views * 0.3 THEN 'weak_performance'
    WHEN cp.page_views > os.avg_page_views * 1.5 THEN 'high_performance'
    ELSE 'average_performance'
  END as performance_category,
  -- 弱点理由自動生成
  CASE 
    WHEN cp.page_views = 0 THEN 'ページビューがありません'
    WHEN cp.page_views < os.avg_page_views * 0.3 THEN '平均的なページビューを大きく下回っています'
    ELSE '相対的にページビューが少ない状態です'
  END as weakness_reason,
  -- ランキング
  ROW_NUMBER() OVER (PARTITION BY cp.organization_id ORDER BY cp.page_views DESC) as rank_by_views,
  ROW_NUMBER() OVER (PARTITION BY cp.organization_id ORDER BY cp.page_views ASC) as rank_by_weakness
FROM content_pageviews cp
JOIN org_stats os ON os.organization_id = cp.organization_id;

-- ランキングMV用インデックス
CREATE INDEX idx_mv_content_ranking_org_perf 
  ON mv_content_ranking(organization_id, performance_category);
CREATE INDEX idx_mv_content_ranking_org_rank_views 
  ON mv_content_ranking(organization_id, rank_by_views);
CREATE INDEX idx_mv_content_ranking_org_rank_weakness 
  ON mv_content_ranking(organization_id, rank_by_weakness);

-- ■ 3. AI生成コンテンツ統計VIEW（高優先度）
-- 現在: 複数テーブルを個別カウント
-- 改善: 単一VIEW化

CREATE VIEW v_ai_content_stats AS
SELECT 
  organization_id,
  SUM(CASE WHEN content_type = 'service' AND is_ai_generated = true THEN 1 ELSE 0 END) as ai_services,
  SUM(CASE WHEN content_type = 'faq' AND is_ai_generated = true THEN 1 ELSE 0 END) as ai_faqs,
  SUM(CASE WHEN content_type = 'case_study' AND is_ai_generated = true THEN 1 ELSE 0 END) as ai_case_studies,
  SUM(CASE WHEN content_type = 'post' AND is_ai_generated = true THEN 1 ELSE 0 END) as ai_posts,
  SUM(CASE WHEN content_type = 'news' AND is_ai_generated = true THEN 1 ELSE 0 END) as ai_news,
  SUM(CASE WHEN content_type = 'product' AND is_ai_generated = true THEN 1 ELSE 0 END) as ai_products,
  COUNT(CASE WHEN is_ai_generated = true THEN 1 END) as total_ai_generated,
  COUNT(*) as total_contents,
  ROUND(
    COUNT(CASE WHEN is_ai_generated = true THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 
    2
  ) as ai_ratio_percentage
FROM content_union_view 
WHERE is_published = true
GROUP BY organization_id;

-- ■ 4. パーティション統合関数（最高優先度）
-- 現在: アプリ側でループ処理
-- 改善: 単一関数でパーティション横断集計

CREATE OR REPLACE FUNCTION get_content_pageviews_fast(
  p_organization_id uuid,
  p_period_start date,
  p_period_end date
) RETURNS TABLE (
  content_id uuid,
  canonical_url text,
  total_pageviews bigint
) 
LANGUAGE plpgsql AS $$
DECLARE
  partition_query text;
  month_cursor date;
BEGIN
  -- パーティションテーブルを動的に統合するクエリ生成
  partition_query := '';
  month_cursor := DATE_TRUNC('month', p_period_start);
  
  WHILE month_cursor <= p_period_end LOOP
    IF partition_query != '' THEN
      partition_query := partition_query || ' UNION ALL ';
    END IF;
    
    partition_query := partition_query || format(
      'SELECT page_url, COUNT(*) as views FROM analytics_events_%s 
       WHERE created_at >= %L AND created_at <= %L',
      TO_CHAR(month_cursor, 'YYYYMM'),
      p_period_start,
      p_period_end
    );
    
    month_cursor := month_cursor + INTERVAL '1 month';
  END LOOP;
  
  -- 最終的な統合クエリ実行
  RETURN QUERY EXECUTE format('
    SELECT 
      cuv.id,
      cuv.canonical_url,
      COALESCE(aggregated_views.total_views, 0)
    FROM content_union_view cuv
    LEFT JOIN (
      SELECT page_url, SUM(views) as total_views
      FROM (%s) combined_partitions
      GROUP BY page_url
    ) aggregated_views ON (
      aggregated_views.page_url = cuv.canonical_url OR
      aggregated_views.page_url = regexp_replace(cuv.canonical_url, ''^https?://'', '''')
    )
    WHERE cuv.organization_id = %L 
      AND cuv.is_published = true 
      AND cuv.canonical_url IS NOT NULL',
    partition_query,
    p_organization_id
  );
END $$;

-- ■ 5. BigInt集計・フォーマット関数（中優先度）
-- 現在: アプリ側でparseBigIntString/formatBigIntString
-- 改善: DB側関数化

CREATE OR REPLACE FUNCTION format_bigint_display(num_str text) 
RETURNS text 
LANGUAGE plpgsql AS $$
BEGIN
  IF num_str IS NULL OR num_str = '' THEN
    RETURN '0';
  END IF;
  
  -- 数値をbigintに変換してからフォーマット
  RETURN to_char(num_str::bigint, 'FM999,999,999,999');
EXCEPTION
  WHEN OTHERS THEN
    RETURN '0';
END $$;

CREATE OR REPLACE FUNCTION parse_bigint_safe(num_str text) 
RETURNS bigint 
LANGUAGE plpgsql AS $$
BEGIN
  IF num_str IS NULL OR num_str = '' THEN
    RETURN 0;
  END IF;
  
  RETURN num_str::bigint;
EXCEPTION
  WHEN OTHERS THEN
    RETURN 0;
END $$;

-- ■ 6. 監査・ログ集計MV（中優先度）
-- 現在: アプリ側でPromise.allSettled並行保存
-- 改善: 統合監査ビュー

CREATE MATERIALIZED VIEW mv_ai_audit_summary AS
SELECT 
  acr.organization_id,
  acr.model_name,
  DATE_TRUNC('day', acr.created_at) as audit_date,
  COUNT(*) as total_requests,
  COUNT(CASE WHEN acr.success = true THEN 1 END) as successful_requests,
  COUNT(CASE WHEN acr.success = false THEN 1 END) as failed_requests,
  SUM(acr.input_tokens) as total_input_tokens,
  SUM(acr.output_tokens) as total_output_tokens,
  AVG(acr.duration_ms) as avg_duration_ms,
  COUNT(DISTINCT acr.session_id) as unique_sessions,
  COUNT(aci.id) as total_citations,
  -- コスト概算（モデル別単価 * トークン数）
  CASE 
    WHEN acr.model_name LIKE '%gpt-4%' THEN 
      SUM(acr.input_tokens) * 0.00003 + SUM(acr.output_tokens) * 0.00006
    WHEN acr.model_name LIKE '%gpt-3.5%' THEN 
      SUM(acr.input_tokens) * 0.0000015 + SUM(acr.output_tokens) * 0.000002
    ELSE 0
  END as estimated_cost_usd
FROM ai_citations_responses acr
LEFT JOIN ai_citations_items aci ON aci.response_id = acr.id
WHERE acr.created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY acr.organization_id, acr.model_name, DATE_TRUNC('day', acr.created_at);

-- ■ 7. プロンプトテンプレート管理テーブル（中優先度）
-- 現在: アプリ側でハードコーディング
-- 改善: DB管理化

CREATE TABLE ai_prompt_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key text NOT NULL UNIQUE,
  template_name text NOT NULL,
  system_prompt text NOT NULL,
  user_prompt_template text NOT NULL,
  variables jsonb DEFAULT '{}',
  model_settings jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 初期プロンプトテンプレート投入
INSERT INTO ai_prompt_templates (template_key, template_name, system_prompt, user_prompt_template, model_settings) VALUES
('report_summary', 'レポートサマリー生成', 
 'あなたは企業のWebサイト分析とコンテンツマーケティングの専門家です。データを基に簡潔で分かりやすいレポートサマリーを生成してください。',
 '以下のデータをもとに、企業のAI月次レポートの自然文サマリーを日本語で生成してください。
レポートレベル: {{level}}

## 基本指標
- 月間ページビュー: {{total_page_views}}
- 公開コンテンツ数: {{unique_contents}}
- サービス: {{services_published}}
- FAQ: {{faqs_published}} 
- 導入事例: {{case_studies_published}}
- AI生成コンテンツ: {{ai_generated_contents}}

## 上位コンテンツ
{{top_contents_list}}

出力形式: プレーンテキストのみ',
 '{"model": "gpt-4o", "temperature": 0.7, "maxTokens": 500}'::jsonb),

('report_suggestions', 'レポート改善提案生成',
 'あなたは企業のWebサイト改善とコンテンツマーケティングの専門コンサルタントです。データ分析結果に基づき、実行可能で効果的な改善提案をJSON形式で生成してください。',
 '以下のデータをもとに、企業の改善提案を{{suggestion_count}}件生成してください。

## 現状データ
- 月間ページビュー: {{total_page_views}}
- 公開コンテンツ数: {{unique_contents}}
- AI生成コンテンツ数: {{ai_generated_contents}}

## 出力形式
以下のJSON配列形式で出力してください:
[
  {
    "id": "sug-001",
    "title": "具体的な改善提案のタイトル", 
    "description": "詳細な説明（100文字程度）",
    "priority": "high|medium|low",
    "category": "content|seo|ux"
  }
]',
 '{"model": "gpt-4o", "temperature": 0.7, "maxTokens": 800}'::jsonb);

-- ■ 8. フォールバック・リトライMV（中優先度）
-- 現在: アプリ側でフォールバック提案
-- 改善: DB側でプラン別フォールバック管理

CREATE TABLE ai_fallback_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_level text NOT NULL CHECK (plan_level IN ('light', 'detail', 'advanced', 'custom')),
  suggestion_order integer NOT NULL,
  suggestion_id text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  priority text NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  category text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(plan_level, suggestion_order)
);

-- フォールバック提案データ投入
INSERT INTO ai_fallback_suggestions (plan_level, suggestion_order, suggestion_id, title, description, priority, category) VALUES
('light', 1, 'sug-001', 'FAQ コンテンツの拡充', 'よく検索されるキーワードに対応したFAQを追加することで、ユーザーの疑問解決を促進できます。', 'high', 'content'),
('light', 2, 'sug-002', 'サービスページの説明強化', '具体的な事例や料金情報を追加することで、コンバージョン率向上が期待できます。', 'medium', 'content'),
('light', 3, 'sug-003', 'AI生成コンテンツの品質向上', '生成されたコンテンツの見直しと手動調整により、より価値の高い情報提供を実現できます。', 'medium', 'content'),
('detail', 4, 'sug-004', 'SEO最適化の実施', 'メタディスクリプションとタイトルタグを最適化し、検索エンジンでの視認性を向上させましょう。', 'high', 'seo'),
('detail', 5, 'sug-005', 'ユーザー体験の改善', 'サイト内検索機能の強化により、訪問者が求める情報により早くアクセスできます。', 'medium', 'ux');

-- ■ 9. 自動更新・メンテナンス用pg_cron設定

-- パフォーマンスランキングMVの1時間毎更新
SELECT cron.schedule('refresh_content_ranking', '0 * * * *', 'REFRESH MATERIALIZED VIEW mv_content_ranking;');

-- 監査サマリーMVの30分毎更新  
SELECT cron.schedule('refresh_ai_audit', '*/30 * * * *', 'REFRESH MATERIALIZED VIEW mv_ai_audit_summary;');

-- AI引用org期間MVの1時間毎更新
SELECT cron.schedule('refresh_citations_org_period', '0 * * * *', 'REFRESH MATERIALIZED VIEW mv_ai_citations_org_period;');

-- ■ 10. 高速化用複合インデックス

-- 組織×期間×パフォーマンス分析用
CREATE INDEX idx_content_ranking_org_period_perf 
  ON mv_content_ranking(organization_id, performance_category, page_views DESC);

-- 監査データ高速集計用  
CREATE INDEX idx_ai_audit_org_date_model 
  ON mv_ai_audit_summary(organization_id, audit_date, model_name);

-- レポート生成期間集計用
CREATE INDEX idx_citations_responses_org_created 
  ON ai_citations_responses(organization_id, created_at DESC) 
  WHERE success = true;

-- ====================================================================
-- 使用例：アプリケーション側での活用方法
-- ====================================================================

-- 例1: トップコンテンツ取得（従来のgetTopContents()を置き換え）
-- SELECT * FROM mv_content_ranking 
-- WHERE organization_id = ? AND rank_by_views <= 5
-- ORDER BY rank_by_views;

-- 例2: 弱点コンテンツ取得（従来のgetWeakContents()を置き換え）
-- SELECT * FROM mv_content_ranking 
-- WHERE organization_id = ? AND performance_category = 'weak_performance'
-- ORDER BY rank_by_weakness LIMIT 5;

-- 例3: AI統計取得（従来のcountAiGeneratedContent()を置き換え）
-- SELECT total_ai_generated FROM v_ai_content_stats WHERE organization_id = ?;

-- 例4: セッション引用グループ化（従来のgroupByResponseId()を置き換え）
-- SELECT * FROM v_ai_citations_grouped_responses WHERE session_id = ?;

-- 例5: プロンプト取得とテンプレート変数展開
-- SELECT user_prompt_template, model_settings 
-- FROM ai_prompt_templates 
-- WHERE template_key = 'report_summary' AND is_active = true;