-- API レート制限システムの実装
-- 目的: DoS攻撃防止、bot制御、システム安定性向上

-- rate_limit_logs テーブル（既存の場合は拡張）
CREATE TABLE IF NOT EXISTS rate_limit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL,
  user_agent TEXT,
  path TEXT NOT NULL,
  method TEXT NOT NULL DEFAULT 'GET',
  status_code INTEGER NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  window_start TIMESTAMP WITH TIME ZONE,
  window_end TIMESTAMP WITH TIME ZONE,
  limit_exceeded BOOLEAN DEFAULT FALSE,
  is_bot BOOLEAN DEFAULT FALSE,
  bot_type TEXT DEFAULT 'browser',
  response_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_ip_timestamp ON rate_limit_logs(ip_address, timestamp);
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_timestamp ON rate_limit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_path ON rate_limit_logs(path);
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_bot_type ON rate_limit_logs(bot_type);
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_limit_exceeded ON rate_limit_logs(limit_exceeded);

-- blocked_ips テーブル（IP ブロック管理）
CREATE TABLE IF NOT EXISTS blocked_ips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL UNIQUE,
  reason TEXT NOT NULL,
  blocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  blocked_until TIMESTAMP WITH TIME ZONE,
  blocked_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT TRUE,
  violation_count INTEGER DEFAULT 1,
  last_violation TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  auto_blocked BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_blocked_ips_ip_active ON blocked_ips(ip_address, is_active);
CREATE INDEX IF NOT EXISTS idx_blocked_ips_blocked_until ON blocked_ips(blocked_until);
CREATE INDEX IF NOT EXISTS idx_blocked_ips_auto_blocked ON blocked_ips(auto_blocked);

-- RLS 設定
ALTER TABLE rate_limit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_ips ENABLE ROW LEVEL SECURITY;

-- RLS ポリシー: rate_limit_logs
-- Service Role のみが INSERT/UPDATE 可能
CREATE POLICY "service_role_rate_limit_logs" ON rate_limit_logs
  FOR ALL USING (auth.role() = 'service_role');

-- Admin は全てのログを閲覧可能
CREATE POLICY "admin_view_rate_limit_logs" ON rate_limit_logs
  FOR SELECT USING (is_admin());

-- RLS ポリシー: blocked_ips
-- Service Role のみが操作可能
CREATE POLICY "service_role_blocked_ips" ON blocked_ips
  FOR ALL USING (auth.role() = 'service_role');

-- Admin は全ての IP ブロック情報を管理可能
CREATE POLICY "admin_manage_blocked_ips" ON blocked_ips
  FOR ALL USING (is_admin());

-- レート制限チェック関数
CREATE OR REPLACE FUNCTION check_rate_limit_violation(
  p_ip INET,
  p_window_seconds INTEGER DEFAULT 10,
  p_limit INTEGER DEFAULT 10
)
RETURNS BOOLEAN AS $$
DECLARE
  request_count INTEGER;
  window_start TIMESTAMP WITH TIME ZONE;
BEGIN
  window_start := NOW() - (p_window_seconds || ' seconds')::INTERVAL;
  
  SELECT COUNT(*) INTO request_count
  FROM rate_limit_logs
  WHERE ip_address = p_ip
    AND timestamp >= window_start;
  
  RETURN request_count >= p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- IP 自動ブロック関数
CREATE OR REPLACE FUNCTION auto_block_ip(
  target_ip INET,
  block_reason TEXT,
  block_duration_minutes INTEGER DEFAULT 60
)
RETURNS UUID AS $$
DECLARE
  block_id UUID;
  blocked_until TIMESTAMP WITH TIME ZONE;
BEGIN
  blocked_until := NOW() + (block_duration_minutes || ' minutes')::INTERVAL;
  
  INSERT INTO blocked_ips (
    ip_address,
    reason,
    blocked_until,
    auto_blocked,
    metadata
  ) VALUES (
    target_ip,
    block_reason,
    blocked_until,
    TRUE,
    jsonb_build_object(
      'auto_blocked_at', NOW(),
      'duration_minutes', block_duration_minutes,
      'system_generated', TRUE
    )
  )
  ON CONFLICT (ip_address) DO UPDATE SET
    reason = EXCLUDED.reason,
    blocked_until = EXCLUDED.blocked_until,
    violation_count = blocked_ips.violation_count + 1,
    last_violation = NOW(),
    is_active = TRUE,
    updated_at = NOW(),
    metadata = blocked_ips.metadata || EXCLUDED.metadata
  RETURNING id INTO block_id;
  
  RETURN block_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- IP ブロック解除関数
CREATE OR REPLACE FUNCTION unblock_ip(
  target_ip INET,
  unblock_reason TEXT DEFAULT 'Manual unblock'
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE blocked_ips 
  SET 
    is_active = FALSE,
    blocked_until = NOW(),
    updated_at = NOW(),
    metadata = metadata || jsonb_build_object(
      'unblocked_at', NOW(),
      'unblock_reason', unblock_reason
    )
  WHERE ip_address = target_ip AND is_active = TRUE;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- レート制限統計取得関数
CREATE OR REPLACE FUNCTION get_rate_limit_stats(
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '1 hour',
  end_time TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE(
  total_requests BIGINT,
  unique_ips BIGINT,
  blocked_requests BIGINT,
  bot_requests BIGINT,
  top_paths JSONB,
  top_user_agents JSONB,
  violation_summary JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT 
      COUNT(*) as total_requests,
      COUNT(DISTINCT ip_address) as unique_ips,
      COUNT(*) FILTER (WHERE limit_exceeded = TRUE) as blocked_requests,
      COUNT(*) FILTER (WHERE is_bot = TRUE) as bot_requests
    FROM rate_limit_logs
    WHERE timestamp BETWEEN start_time AND end_time
  ),
  top_paths AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'path', path,
        'count', cnt
      ) ORDER BY cnt DESC
    ) as paths
    FROM (
      SELECT path, COUNT(*) as cnt
      FROM rate_limit_logs
      WHERE timestamp BETWEEN start_time AND end_time
      GROUP BY path
      ORDER BY cnt DESC
      LIMIT 10
    ) t
  ),
  top_uas AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'user_agent', COALESCE(SUBSTRING(user_agent FROM 1 FOR 100), 'unknown'),
        'count', cnt,
        'bot_type', bot_type
      ) ORDER BY cnt DESC
    ) as user_agents
    FROM (
      SELECT user_agent, bot_type, COUNT(*) as cnt
      FROM rate_limit_logs
      WHERE timestamp BETWEEN start_time AND end_time
      GROUP BY user_agent, bot_type
      ORDER BY cnt DESC
      LIMIT 10
    ) t
  ),
  violations AS (
    SELECT jsonb_build_object(
      'total_violations', COUNT(*),
      'unique_violating_ips', COUNT(DISTINCT ip_address),
      'avg_violations_per_ip', ROUND(AVG(violation_count), 2),
      'auto_blocked_count', COUNT(*) FILTER (WHERE auto_blocked = TRUE)
    ) as summary
    FROM blocked_ips
    WHERE blocked_at BETWEEN start_time AND end_time
  )
  SELECT 
    s.total_requests,
    s.unique_ips,
    s.blocked_requests,
    s.bot_requests,
    tp.paths,
    tu.user_agents,
    v.summary
  FROM stats s, top_paths tp, top_uas tu, violations v;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 古いログの自動削除関数
CREATE OR REPLACE FUNCTION cleanup_rate_limit_logs(
  retention_days INTEGER DEFAULT 7
)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
  cutoff_time TIMESTAMP WITH TIME ZONE;
BEGIN
  cutoff_time := NOW() - (retention_days || ' days')::INTERVAL;
  
  -- 古いレート制限ログを削除
  DELETE FROM rate_limit_logs 
  WHERE timestamp < cutoff_time;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- 有効期限切れの IP ブロックを無効化
  UPDATE blocked_ips 
  SET is_active = FALSE, updated_at = NOW()
  WHERE blocked_until IS NOT NULL 
    AND blocked_until < NOW() 
    AND is_active = TRUE;
  
  -- クリーンアップログを記録
  INSERT INTO rate_limit_logs (
    ip_address,
    path,
    method,
    status_code,
    timestamp,
    user_agent,
    is_bot,
    bot_type
  ) VALUES (
    '127.0.0.1',
    '/system/cleanup',
    'SYSTEM',
    200,
    NOW(),
    'System Cleanup Job',
    FALSE,
    'system'
  );
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- パーティショニング設定（大量データ対応）
-- 月単位でパーティション分割
DO $$
BEGIN
  -- PostgreSQL 12+ でパーティショニングをサポートしている場合
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'create_range_partition'
  ) THEN
    -- 既存テーブルをパーティション化（将来対応）
    RAISE NOTICE 'パーティショニング機能は将来のバージョンで実装予定';
  END IF;
END $$;

-- レート制限設定テーブル
CREATE TABLE IF NOT EXISTS rate_limit_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL UNIQUE,
  path_pattern TEXT, -- パスのパターン（正規表現対応）
  method TEXT DEFAULT 'ALL',
  bot_type TEXT DEFAULT 'ALL',
  requests_per_window INTEGER NOT NULL DEFAULT 10,
  window_seconds INTEGER NOT NULL DEFAULT 10,
  block_duration_minutes INTEGER DEFAULT 60,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 設定
ALTER TABLE rate_limit_rules ENABLE ROW LEVEL SECURITY;

-- Admin のみがルールを管理可能
CREATE POLICY "admin_manage_rate_limit_rules" ON rate_limit_rules
  FOR ALL USING (is_admin());

-- Service Role は読み取りのみ可能
CREATE POLICY "service_role_read_rate_limit_rules" ON rate_limit_rules
  FOR SELECT USING (auth.role() = 'service_role');

-- デフォルトのレート制限ルールを挿入
INSERT INTO rate_limit_rules (rule_name, path_pattern, bot_type, requests_per_window, window_seconds) VALUES
('search_engine_general', '.*', 'search_engine', 60, 60),
('ai_crawler_restricted', '.*', 'ai_crawler', 30, 60),
('scraper_strict', '.*', 'scraper', 5, 60),
('suspicious_very_strict', '.*', 'suspicious', 3, 60),
('browser_normal', '.*', 'browser', 20, 10),
('api_endpoints', '^/api/.*', 'ALL', 30, 60),
('auth_endpoints', '^/auth/.*', 'ALL', 10, 60),
('dashboard_access', '^/dashboard.*', 'browser', 100, 60)
ON CONFLICT (rule_name) DO NOTHING;

-- updated_at トリガー
CREATE OR REPLACE FUNCTION update_rate_limit_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_rate_limit_rules_updated_at ON rate_limit_rules;
CREATE TRIGGER trigger_update_rate_limit_rules_updated_at
  BEFORE UPDATE ON rate_limit_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_rate_limit_rules_updated_at();

-- レート制限設定完了
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== API レート制限システム実装完了 ===';
  RAISE NOTICE '1. rate_limit_logs テーブル: アクセスログとレート制限監視';
  RAISE NOTICE '2. blocked_ips テーブル: IP ブロック管理';
  RAISE NOTICE '3. rate_limit_rules テーブル: 動的レート制限ルール設定';
  RAISE NOTICE '4. 自動ブロック機能: auto_block_ip()';
  RAISE NOTICE '5. 統計取得機能: get_rate_limit_stats()';
  RAISE NOTICE '6. 自動クリーンアップ: cleanup_rate_limit_logs()';
  RAISE NOTICE '';
  RAISE NOTICE '運用時の推奨事項:';
  RAISE NOTICE '- middleware.ts で既に実装済みのレート制限機能を活用';
  RAISE NOTICE '- 定期的に get_rate_limit_stats() で監視';
  RAISE NOTICE '- cleanup_rate_limit_logs() を cron で実行';
  RAISE NOTICE '- rate_limit_rules で動的にルール調整';
END $$;