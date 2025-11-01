-- Phase 3: SEO Integration & AI×SEO 相関分析システム
-- Google Search Console メトリクステーブル

CREATE TABLE seo_search_console_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  search_query TEXT, -- NULL の場合はページレベル集計、値がある場合はクエリレベル集計
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  average_position DECIMAL(5,2),
  ctr DECIMAL(5,4),
  date_recorded DATE NOT NULL,
  fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- URL毎・クエリ毎・日毎のユニーク制約
  UNIQUE(org_id, url, search_query, date_recorded)
);

-- パフォーマンス用インデックス
CREATE INDEX idx_seo_metrics_org_date ON seo_search_console_metrics(org_id, date_recorded DESC);
CREATE INDEX idx_seo_metrics_url ON seo_search_console_metrics(url);
CREATE INDEX idx_seo_metrics_query ON seo_search_console_metrics(search_query) WHERE search_query IS NOT NULL;

-- RLS ポリシー: 組織ごとのデータ分離
ALTER TABLE seo_search_console_metrics ENABLE ROW LEVEL SECURITY;

-- 組織メンバー: 自組織のデータのみアクセス可能
CREATE POLICY seo_metrics_org_members ON seo_search_console_metrics
  FOR ALL
  USING (
    org_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

-- Service Role: 全データアクセス可能（API処理用）
CREATE POLICY seo_metrics_service_role ON seo_search_console_metrics
  FOR ALL
  USING (auth.role() = 'service_role');

-- 新規feature_registry エントリ（Phase 3 機能管理）
INSERT INTO feature_registry (feature_key, display_name, category, control_type, is_active) VALUES
('seo_gsc_integration', 'Google Search Console連携', 'integrations', 'on_off', true),
('ai_seo_correlation', 'AI × SEO 相関分析', 'analytics', 'on_off', true)
ON CONFLICT (feature_key) DO NOTHING;

-- plan_features 設定（Business以上のみ有効）
INSERT INTO plan_features (plan_type, feature_key, config_value) VALUES
-- Starter/Pro: Phase 3 機能無効
('starter', 'seo_gsc_integration', '{"enabled": false}'),
('starter', 'ai_seo_correlation', '{"enabled": false}'),
('pro', 'seo_gsc_integration', '{"enabled": false}'),
('pro', 'ai_seo_correlation', '{"enabled": false}'),
-- Business: Phase 3 機能有効
('business', 'seo_gsc_integration', '{"enabled": true}'),
('business', 'ai_seo_correlation', '{"enabled": true}')
ON CONFLICT (plan_type, feature_key) DO NOTHING;

-- コメント追加
COMMENT ON TABLE seo_search_console_metrics IS 'Google Search Console メトリクスデータ（Phase 3: AI×SEO相関分析用）';
COMMENT ON COLUMN seo_search_console_metrics.search_query IS 'NULL=ページレベル集計、値あり=クエリレベル集計';
COMMENT ON COLUMN seo_search_console_metrics.average_position IS 'Google検索結果での平均掲載順位';
COMMENT ON COLUMN seo_search_console_metrics.ctr IS 'クリック率（clicks/impressions）';