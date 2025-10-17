-- AI Visibility Guard System Tables
-- Created: 2025-10-17

-- 1. AI可視性監視ログテーブル
CREATE TABLE IF NOT EXISTS ai_visibility_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- 基本情報
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  url TEXT NOT NULL,
  user_agent TEXT NOT NULL,
  ip_address INET,
  
  -- 検証結果
  status_code INTEGER NOT NULL,
  response_time_ms NUMERIC(8,2),
  
  -- クロール許可状況
  robots_allowed BOOLEAN,
  robots_rule TEXT,
  meta_robots TEXT,
  canonical_url TEXT,
  
  -- 構造化データ
  jsonld_valid BOOLEAN,
  jsonld_schemas TEXT[], -- ["Organization", "Service", "FAQPage"]
  jsonld_signature TEXT, -- SHA256 hash
  
  -- 問題レベル
  severity_level TEXT CHECK (severity_level IN ('P0', 'P1', 'P2', 'OK')) NOT NULL,
  issues JSONB DEFAULT '[]',
  
  -- メタデータ
  environment TEXT DEFAULT 'production',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX (timestamp),
  INDEX (url),
  INDEX (user_agent),
  INDEX (severity_level),
  INDEX (created_at)
);

-- 2. ブロックIPテーブル
CREATE TABLE IF NOT EXISTS blocked_ips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  ip_address INET NOT NULL UNIQUE,
  reason TEXT NOT NULL,
  blocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  blocked_until TIMESTAMP WITH TIME ZONE, -- NULL = 永久ブロック
  
  -- 違反情報
  violation_count INTEGER DEFAULT 1,
  last_violation_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  violation_details JSONB DEFAULT '{}',
  
  -- 管理情報
  blocked_by TEXT, -- 'auto' or user_id
  unblocked_by TEXT,
  unblocked_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX (ip_address),
  INDEX (blocked_at),
  INDEX (is_active)
);

-- 3. レート制限ログテーブル
CREATE TABLE IF NOT EXISTS rate_limit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  ip_address INET NOT NULL,
  user_agent TEXT,
  path TEXT NOT NULL,
  method TEXT DEFAULT 'GET',
  
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  status_code INTEGER NOT NULL,
  
  -- レート制限情報
  requests_count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL,
  window_end TIMESTAMP WITH TIME ZONE NOT NULL,
  limit_exceeded BOOLEAN DEFAULT FALSE,
  
  -- 詳細情報
  referer TEXT,
  country_code CHAR(2),
  is_bot BOOLEAN DEFAULT FALSE,
  bot_type TEXT, -- 'search_engine', 'ai_crawler', 'scraper', 'unknown'
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX (ip_address, timestamp),
  INDEX (timestamp),
  INDEX (limit_exceeded),
  INDEX (bot_type)
);

-- 4. AI可視性設定テーブル
CREATE TABLE IF NOT EXISTS ai_visibility_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  config_key TEXT UNIQUE NOT NULL,
  config_value JSONB NOT NULL,
  description TEXT,
  
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX (config_key),
  INDEX (is_active)
);

-- 初期設定データ挿入
INSERT INTO ai_visibility_config (config_key, config_value, description) VALUES
('allowed_crawlers', 
 '{"search_engines": ["Googlebot", "Bingbot"], "ai_crawlers": ["GPTBot", "CCBot", "PerplexityBot"], "paths": {"/o/": ["GPTBot", "CCBot", "PerplexityBot"], "/": ["Googlebot", "Bingbot"]}}',
 'クローラーアクセス許可設定'),
 
('rate_limits', 
 '{"default": {"requests": 3, "window_seconds": 10}, "strict": {"requests": 1, "window_seconds": 5}, "ai_crawlers": {"requests": 5, "window_seconds": 60}}',
 'レート制限設定'),
 
('blocked_paths', 
 '["/dashboard", "/api/auth", "/billing", "/checkout", "/preview", "/webhooks", "/admin", "/management-console"]',
 '恒久的ブロックパス'),
 
('notification_settings', 
 '{"slack_webhook": "", "alert_thresholds": {"P0": 1, "P1": 5, "P2": 10}, "daily_summary": true}',
 '通知設定'),

('content_protection', 
 '{"jsonld_signing": true, "origin_tags": true, "signature_secret": "CHANGE_ME"}',
 'コンテンツ保護設定')

ON CONFLICT (config_key) DO NOTHING;

-- 5. RLS (Row Level Security) ポリシー設定
ALTER TABLE ai_visibility_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_visibility_config ENABLE ROW LEVEL SECURITY;

-- 管理者のみアクセス可能
CREATE POLICY "Admin access to ai_visibility_logs" ON ai_visibility_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email LIKE '%@luxucare.co.jp'
    )
  );

CREATE POLICY "Admin access to blocked_ips" ON blocked_ips
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email LIKE '%@luxucare.co.jp'
    )
  );

CREATE POLICY "Admin access to rate_limit_logs" ON rate_limit_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email LIKE '%@luxucare.co.jp'
    )
  );

CREATE POLICY "Admin access to ai_visibility_config" ON ai_visibility_config
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email LIKE '%@luxucare.co.jp'
    )
  );

-- 6. 便利なビューとファンクション
CREATE OR REPLACE VIEW ai_visibility_summary AS
SELECT 
  DATE(timestamp) as date,
  COUNT(*) as total_checks,
  COUNT(*) FILTER (WHERE severity_level = 'P0') as p0_issues,
  COUNT(*) FILTER (WHERE severity_level = 'P1') as p1_issues,
  COUNT(*) FILTER (WHERE severity_level = 'P2') as p2_issues,
  COUNT(*) FILTER (WHERE severity_level = 'OK') as ok_checks,
  AVG(response_time_ms) as avg_response_time,
  COUNT(DISTINCT user_agent) as unique_user_agents
FROM ai_visibility_logs 
GROUP BY DATE(timestamp)
ORDER BY date DESC;

-- IP自動ブロック関数
CREATE OR REPLACE FUNCTION auto_block_ip(
  target_ip INET,
  block_reason TEXT,
  block_duration_minutes INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  block_id UUID;
  block_until_time TIMESTAMP WITH TIME ZONE;
BEGIN
  -- 期限設定
  IF block_duration_minutes IS NOT NULL THEN
    block_until_time := NOW() + (block_duration_minutes || ' minutes')::INTERVAL;
  END IF;
  
  -- 既存ブロックの更新またはINSERT
  INSERT INTO blocked_ips (ip_address, reason, blocked_until, blocked_by)
  VALUES (target_ip, block_reason, block_until_time, 'auto')
  ON CONFLICT (ip_address) 
  DO UPDATE SET 
    violation_count = blocked_ips.violation_count + 1,
    last_violation_at = NOW(),
    blocked_until = COALESCE(EXCLUDED.blocked_until, blocked_ips.blocked_until),
    is_active = TRUE,
    updated_at = NOW()
  RETURNING id INTO block_id;
  
  RETURN block_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- データクリーンアップ関数（古いログ削除）
CREATE OR REPLACE FUNCTION cleanup_old_logs(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- 古いログを削除
  DELETE FROM ai_visibility_logs 
  WHERE timestamp < NOW() - (days_to_keep || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  DELETE FROM rate_limit_logs 
  WHERE timestamp < NOW() - (days_to_keep || ' days')::INTERVAL;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;