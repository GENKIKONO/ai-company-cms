# AI × SEO ダッシュボード テストデータセットアップ

## 🚀 テストデータ挿入手順

### 1. 組織プラン・フィーチャーフラグ更新

Supabase SQLエディタで以下を実行:

```sql
-- テスト用: LuxuCare組織のプランとフィーチャーフラグを更新

UPDATE organizations 
SET 
  plan = 'business',
  feature_flags = '{
    "ai_bot_analytics": true,
    "ai_visibility_analytics": true, 
    "ai_reports": true,
    "seo_analytics": true
  }'
WHERE slug = 'luxucare';

-- 確認クエリ
SELECT id, name, slug, plan, feature_flags 
FROM organizations 
WHERE slug = 'luxucare';
```

### 2. 分析データ挿入

```sql
-- テスト用データ挿入（30日間のサンプルデータ）

-- 組織IDを取得
WITH luxucare_org AS (
  SELECT id FROM organizations WHERE slug = 'luxucare'
)

-- 1. AI Bot Logsサンプルデータ
INSERT INTO ai_bot_logs (org_id, url, bot_name, user_agent, request_method, response_status, accessed_at)
SELECT 
  luxucare_org.id,
  'https://luxucare.co.jp/' || CASE 
    WHEN random() < 0.3 THEN ''
    WHEN random() < 0.6 THEN 'services'
    WHEN random() < 0.8 THEN 'about'
    ELSE 'contact'
  END,
  CASE 
    WHEN random() < 0.4 THEN 'GPTBot'
    WHEN random() < 0.7 THEN 'ClaudeBot'
    WHEN random() < 0.9 THEN 'PerplexityBot'
    ELSE 'Google-Extended'
  END,
  'Mozilla/5.0 (compatible; GPTBot/1.0; +https://openai.com/gptbot)',
  'GET',
  200,
  NOW() - INTERVAL '1 day' * (random() * 30)
FROM luxucare_org, generate_series(1, 150);

-- 2. AI Visibility Scoresサンプルデータ
INSERT INTO ai_visibility_scores (org_id, score, metadata, calculated_at)
SELECT 
  luxucare_org.id,
  45 + (random() * 20),  -- 45-65の範囲
  json_build_object(
    'total_pages', 25 + (random() * 15)::int,
    'visible_pages', 15 + (random() * 10)::int,
    'structured_data_coverage', 0.6 + (random() * 0.3)
  ),
  NOW() - INTERVAL '1 day' * (random() * 30)
FROM luxucare_org, generate_series(1, 30);

-- 3. SEO Search Console Metricsサンプルデータ  
INSERT INTO seo_search_console_metrics (org_id, date, page_url, query, impressions, clicks, position, ctr)
SELECT 
  luxucare_org.id,
  CURRENT_DATE - INTERVAL '1 day' * (random() * 30),
  'https://luxucare.co.jp/' || CASE 
    WHEN random() < 0.3 THEN ''
    WHEN random() < 0.6 THEN 'services'
    ELSE 'about'
  END,
  CASE 
    WHEN random() < 0.2 THEN 'AI 開発'
    WHEN random() < 0.4 THEN 'ウェブ制作'
    WHEN random() < 0.6 THEN 'SEO対策'
    WHEN random() < 0.8 THEN 'LuxuCare'
    ELSE 'コンサルティング'
  END,
  (100 + random() * 900)::int,  -- 100-1000のインプレッション
  (random() * 50)::int,         -- 0-50のクリック
  1 + (random() * 20),          -- 1-20の平均順位
  random() * 0.1                -- 0-10%のCTR
FROM luxucare_org, generate_series(1, 200);
```

### 3. データ確認

```sql
-- データ挿入確認
SELECT 
  'ai_bot_logs' as table_name, COUNT(*) as count 
FROM ai_bot_logs 
WHERE org_id = (SELECT id FROM organizations WHERE slug = 'luxucare')
UNION ALL
SELECT 
  'ai_visibility_scores' as table_name, COUNT(*) as count
FROM ai_visibility_scores 
WHERE org_id = (SELECT id FROM organizations WHERE slug = 'luxucare')
UNION ALL
SELECT 
  'seo_search_console_metrics' as table_name, COUNT(*) as count
FROM seo_search_console_metrics 
WHERE org_id = (SELECT id FROM organizations WHERE slug = 'luxucare');
```

## 🎯 ダッシュボードアクセス

セットアップ完了後、以下URLでダッシュボードにアクセス:

```
http://localhost:3006/dashboard/analytics/ai-seo-report
```

### 期待される表示

1. **サマリーカード**
   - AI Bot Hits: ~150件
   - AI Visibility Score: 45-65
   - SEO インプレッション: ~50,000-90,000
   - 構造化データ整備率: 60-90%

2. **AI×SEO マトリクス**
   - 4象限での URL分布表示
   - 各象限のクリック詳細

3. **トレンドチャート**
   - 30日間のAI Visibilityトレンド
   - SEOインプレッショントレンド

4. **エクスポート機能**
   - CSV/JSON エクスポート有効

## 🧹 クリーンアップ

テスト終了後、データをクリーンアップ:

```sql
-- テストデータ削除
DELETE FROM ai_bot_logs WHERE org_id = (SELECT id FROM organizations WHERE slug = 'luxucare');
DELETE FROM ai_visibility_scores WHERE org_id = (SELECT id FROM organizations WHERE slug = 'luxucare');
DELETE FROM seo_search_console_metrics WHERE org_id = (SELECT id FROM organizations WHERE slug = 'luxucare');

-- 組織設定を元に戻す
UPDATE organizations 
SET 
  plan = 'free',
  feature_flags = '{}'
WHERE slug = 'luxucare';
```