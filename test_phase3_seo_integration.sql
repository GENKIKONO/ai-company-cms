-- Phase 3: SEO Integration & AI×SEO 相関分析システム テストSQL
-- 実行前に migrations/003_seo_search_console_metrics.sql を実行してください

-- 1. テストデータ確認
-- 既存の組織情報確認
SELECT id, name, slug, website_url, is_published 
FROM organizations 
WHERE is_published = true
ORDER BY created_at DESC
LIMIT 5;

-- AI Visibility Scores の状況確認
SELECT 
  org_id,
  url,
  total_visibility_score,
  ai_bot_hits_count,
  calculated_at
FROM ai_visibility_scores 
WHERE calculated_at >= NOW() - INTERVAL '30 days'
ORDER BY calculated_at DESC, total_visibility_score DESC
LIMIT 10;

-- AI Bot Logs の状況確認
SELECT 
  org_id,
  url,
  bot_name,
  accessed_at,
  COUNT(*) OVER (PARTITION BY org_id) as org_total_logs
FROM ai_bot_logs 
WHERE accessed_at >= NOW() - INTERVAL '30 days'
ORDER BY accessed_at DESC
LIMIT 10;

-- 2. SEO Search Console Metrics テーブル状況確認
SELECT COUNT(*) as total_records FROM seo_search_console_metrics;

-- テーブル構造確認
\d seo_search_console_metrics

-- 3. サンプルSEOデータ挿入（テスト用）
-- LuxuCare組織のサンプルデータ
INSERT INTO seo_search_console_metrics (
  org_id,
  url,
  search_query,
  impressions,
  clicks,
  average_position,
  ctr,
  date_recorded
) VALUES 
-- ページレベルメトリクス（search_query = NULL）
('c53b7fae-1ae3-48f4-98c1-5c3217f9fbb3', 'https://luxucare.co.jp/', NULL, 15420, 892, 3.2, 0.0578, '2025-10-30'),
('c53b7fae-1ae3-48f4-98c1-5c3217f9fbb3', 'https://luxucare.co.jp/services', NULL, 8945, 456, 5.8, 0.0510, '2025-10-30'),
('c53b7fae-1ae3-48f4-98c1-5c3217f9fbb3', 'https://luxucare.co.jp/about', NULL, 3201, 134, 8.1, 0.0419, '2025-10-30'),
('c53b7fae-1ae3-48f4-98c1-5c3217f9fbb3', 'https://luxucare.co.jp/contact', NULL, 2156, 89, 12.3, 0.0413, '2025-10-30'),

-- クエリレベルメトリクス
('c53b7fae-1ae3-48f4-98c1-5c3217f9fbb3', 'https://luxucare.co.jp/', 'AI 企業CMS', 5420, 312, 2.1, 0.0575, '2025-10-30'),
('c53b7fae-1ae3-48f4-98c1-5c3217f9fbb3', 'https://luxucare.co.jp/', 'LuxuCare', 3890, 234, 1.8, 0.0601, '2025-10-30'),
('c53b7fae-1ae3-48f4-98c1-5c3217f9fbb3', 'https://luxucare.co.jp/services', 'CMS サービス', 2845, 156, 4.2, 0.0548, '2025-10-30'),
('c53b7fae-1ae3-48f4-98c1-5c3217f9fbb3', 'https://luxucare.co.jp/services', 'AI CMS', 1945, 98, 6.1, 0.0504, '2025-10-30'),

-- 過去データ（トレンド分析用）
('c53b7fae-1ae3-48f4-98c1-5c3217f9fbb3', 'https://luxucare.co.jp/', NULL, 14820, 834, 3.5, 0.0563, '2025-10-29'),
('c53b7fae-1ae3-48f4-98c1-5c3217f9fbb3', 'https://luxucare.co.jp/', NULL, 14321, 798, 3.8, 0.0557, '2025-10-28'),
('c53b7fae-1ae3-48f4-98c1-5c3217f9fbb3', 'https://luxucare.co.jp/', NULL, 13945, 756, 4.1, 0.0542, '2025-10-27')
ON CONFLICT (org_id, url, search_query, date_recorded) DO NOTHING;

-- 4. 統合データ確認クエリ
-- AI × SEO 統合データビュー
WITH ai_latest AS (
  SELECT DISTINCT ON (url) 
    url,
    total_visibility_score,
    ai_bot_hits_count,
    calculated_at
  FROM ai_visibility_scores 
  WHERE org_id = 'c53b7fae-1ae3-48f4-98c1-5c3217f9fbb3'
    AND calculated_at >= NOW() - INTERVAL '30 days'
  ORDER BY url, calculated_at DESC
),
seo_agg AS (
  SELECT 
    url,
    AVG(average_position) as avg_position,
    SUM(impressions) as total_impressions,
    SUM(clicks) as total_clicks,
    AVG(ctr) as avg_ctr
  FROM seo_search_console_metrics 
  WHERE org_id = 'c53b7fae-1ae3-48f4-98c1-5c3217f9fbb3'
    AND search_query IS NULL -- ページレベルのみ
    AND date_recorded >= CURRENT_DATE - INTERVAL '7 days'
  GROUP BY url
)
SELECT 
  COALESCE(ai.url, seo.url) as url,
  ai.total_visibility_score as ai_score,
  ai.ai_bot_hits_count,
  seo.avg_position,
  seo.total_impressions,
  seo.total_clicks,
  seo.avg_ctr,
  -- 統合スコア計算（AI 60% + SEO 40%）
  CASE 
    WHEN ai.total_visibility_score IS NOT NULL AND seo.avg_position IS NOT NULL THEN
      ROUND((ai.total_visibility_score * 0.6) + (GREATEST(0, 100 - (seo.avg_position - 1) * 10) * 0.4))
    ELSE NULL
  END as combined_score,
  -- パフォーマンスカテゴリ
  CASE 
    WHEN ai.total_visibility_score >= 70 AND seo.avg_position <= 10 THEN 'ai_strong_seo_strong'
    WHEN ai.total_visibility_score >= 70 AND (seo.avg_position > 10 OR seo.avg_position IS NULL) THEN 'ai_strong_seo_weak'
    WHEN (ai.total_visibility_score < 70 OR ai.total_visibility_score IS NULL) AND seo.avg_position <= 10 THEN 'ai_weak_seo_strong'
    ELSE 'ai_weak_seo_weak'
  END as performance_category
FROM ai_latest ai
FULL OUTER JOIN seo_agg seo ON ai.url = seo.url
ORDER BY combined_score DESC NULLS LAST;

-- 5. 相関分析準備データ
SELECT 
  COUNT(*) as total_urls,
  COUNT(CASE WHEN ai_score IS NOT NULL AND avg_position IS NOT NULL THEN 1 END) as correlation_sample_size,
  AVG(ai_score) as avg_ai_score,
  AVG(avg_position) as avg_seo_position
FROM (
  WITH ai_latest AS (
    SELECT DISTINCT ON (url) 
      url, total_visibility_score as ai_score
    FROM ai_visibility_scores 
    WHERE org_id = 'c53b7fae-1ae3-48f4-98c1-5c3217f9fbb3'
      AND calculated_at >= NOW() - INTERVAL '30 days'
    ORDER BY url, calculated_at DESC
  ),
  seo_agg AS (
    SELECT url, AVG(average_position) as avg_position
    FROM seo_search_console_metrics 
    WHERE org_id = 'c53b7fae-1ae3-48f4-98c1-5c3217f9fbb3'
      AND search_query IS NULL 
      AND date_recorded >= CURRENT_DATE - INTERVAL '7 days'
    GROUP BY url
  )
  SELECT ai.ai_score, seo.avg_position
  FROM ai_latest ai
  FULL OUTER JOIN seo_agg seo ON ai.url = seo.url
) combined_data;

-- 6. Feature Flags 確認
SELECT 
  pf.plan_type,
  pf.feature_key,
  pf.config_value,
  fr.display_name
FROM plan_features pf
JOIN feature_registry fr ON pf.feature_key = fr.feature_key
WHERE pf.feature_key IN ('seo_gsc_integration', 'ai_seo_correlation')
ORDER BY pf.plan_type, pf.feature_key;

-- 7. パフォーマンス確認
EXPLAIN ANALYZE 
SELECT 
  org_id,
  url,
  AVG(average_position) as avg_position,
  SUM(impressions) as total_impressions
FROM seo_search_console_metrics 
WHERE org_id = 'c53b7fae-1ae3-48f4-98c1-5c3217f9fbb3'
  AND date_recorded >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY org_id, url
ORDER BY total_impressions DESC;

-- 8. データ削除（テスト後のクリーンアップ）
-- DELETE FROM seo_search_console_metrics WHERE org_id = 'c53b7fae-1ae3-48f4-98c1-5c3217f9fbb3';