-- APIレート制限システム用のデータベーステーブル作成

-- レート制限リクエスト記録テーブル
CREATE TABLE IF NOT EXISTS rate_limit_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL, -- レート制限キー（IP+パスなど）
  ip_address INET NOT NULL,
  user_agent TEXT,
  path TEXT NOT NULL,
  method TEXT NOT NULL DEFAULT 'GET',
  is_bot BOOLEAN DEFAULT FALSE,
  is_suspicious BOOLEAN DEFAULT FALSE,
  bot_type TEXT, -- 'googlebot', 'bingbot', 'crawler', 'unknown'
  risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  user_id UUID REFERENCES auth.users(id), -- ログイン済みユーザーの場合
  session_id TEXT,
  country_code TEXT, -- 2文字の国コード
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_rate_limit_key_time ON rate_limit_requests(key, created_at);
CREATE INDEX IF NOT EXISTS idx_rate_limit_ip_time ON rate_limit_requests(ip_address, created_at);
CREATE INDEX IF NOT EXISTS idx_rate_limit_created_at ON rate_limit_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_rate_limit_risk_level ON rate_limit_requests(risk_level);
CREATE INDEX IF NOT EXISTS idx_rate_limit_is_bot ON rate_limit_requests(is_bot);
CREATE INDEX IF NOT EXISTS idx_rate_limit_is_suspicious ON rate_limit_requests(is_suspicious);

-- セキュリティインシデント記録テーブル
CREATE TABLE IF NOT EXISTS security_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL,
  user_agent TEXT,
  path TEXT NOT NULL,
  method TEXT NOT NULL DEFAULT 'GET',
  incident_type TEXT NOT NULL, -- 'sql_injection_attempt', 'xss_attempt', 'path_traversal_attempt', etc.
  risk_level TEXT DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  blocked BOOLEAN DEFAULT TRUE, -- リクエストがブロックされたか
  user_id UUID REFERENCES auth.users(id),
  country_code TEXT,
  details JSONB, -- 追加の詳細情報
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- セキュリティインシデント用インデックス
CREATE INDEX IF NOT EXISTS idx_security_incidents_ip_time ON security_incidents(ip_address, created_at);
CREATE INDEX IF NOT EXISTS idx_security_incidents_type ON security_incidents(incident_type);
CREATE INDEX IF NOT EXISTS idx_security_incidents_risk ON security_incidents(risk_level);
CREATE INDEX IF NOT EXISTS idx_security_incidents_created_at ON security_incidents(created_at);
CREATE INDEX IF NOT EXISTS idx_security_incidents_blocked ON security_incidents(blocked);

-- IP ブロックリストテーブル
CREATE TABLE IF NOT EXISTS ip_blocklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL UNIQUE,
  cidr_range CIDR, -- CIDR記法での範囲指定
  reason TEXT NOT NULL,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  is_permanent BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- IPブロックリスト用インデックス
CREATE INDEX IF NOT EXISTS idx_ip_blocklist_ip ON ip_blocklist(ip_address);
CREATE INDEX IF NOT EXISTS idx_ip_blocklist_cidr ON ip_blocklist(cidr_range);
CREATE INDEX IF NOT EXISTS idx_ip_blocklist_expires ON ip_blocklist(expires_at);
CREATE INDEX IF NOT EXISTS idx_ip_blocklist_severity ON ip_blocklist(severity);

-- レート制限設定テーブル
CREATE TABLE IF NOT EXISTS rate_limit_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE, -- 'auth', 'api', 'search', 'upload', etc.
  path_pattern TEXT, -- 対象パスのパターン（正規表現）
  window_ms INTEGER NOT NULL DEFAULT 900000, -- 時間窓（ミリ秒）
  max_requests INTEGER NOT NULL DEFAULT 100, -- 最大リクエスト数
  is_active BOOLEAN DEFAULT TRUE,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- レート制限設定用インデックス
CREATE INDEX IF NOT EXISTS idx_rate_limit_configs_name ON rate_limit_configs(name);
CREATE INDEX IF NOT EXISTS idx_rate_limit_configs_active ON rate_limit_configs(is_active);

-- RLS（Row Level Security）の設定
ALTER TABLE rate_limit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ip_blocklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_configs ENABLE ROW LEVEL SECURITY;

-- 管理者のみがすべてのデータにアクセス可能
CREATE POLICY "admin_full_access_rate_limit_requests" ON rate_limit_requests
  FOR ALL USING (is_admin());

CREATE POLICY "admin_full_access_security_incidents" ON security_incidents
  FOR ALL USING (is_admin());

CREATE POLICY "admin_full_access_ip_blocklist" ON ip_blocklist
  FOR ALL USING (is_admin());

CREATE POLICY "admin_full_access_rate_limit_configs" ON rate_limit_configs
  FOR ALL USING (is_admin());

-- デフォルトのレート制限設定を挿入
INSERT INTO rate_limit_configs (name, path_pattern, window_ms, max_requests, description, created_by) VALUES
  ('default', '.*', 900000, 100, 'デフォルトのレート制限（15分間で100リクエスト）', (SELECT id FROM auth.users WHERE email LIKE '%@%' LIMIT 1)),
  ('auth', '/api/auth/.*', 900000, 5, '認証エンドポイントの制限（15分間で5リクエスト）', (SELECT id FROM auth.users WHERE email LIKE '%@%' LIMIT 1)),
  ('api', '/api/.*', 60000, 60, 'API エンドポイントの制限（1分間で60リクエスト）', (SELECT id FROM auth.users WHERE email LIKE '%@%' LIMIT 1)),
  ('search', '/api/search/.*', 60000, 30, '検索エンドポイントの制限（1分間で30リクエスト）', (SELECT id FROM auth.users WHERE email LIKE '%@%' LIMIT 1)),
  ('upload', '/api/upload/.*', 60000, 10, 'アップロードエンドポイントの制限（1分間で10リクエスト）', (SELECT id FROM auth.users WHERE email LIKE '%@%' LIMIT 1))
ON CONFLICT (name) DO NOTHING;

-- レート制限統計ビュー
CREATE OR REPLACE VIEW rate_limit_statistics AS
SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) as total_requests,
  COUNT(*) FILTER (WHERE is_bot = true) as bot_requests,
  COUNT(*) FILTER (WHERE is_suspicious = true) as suspicious_requests,
  COUNT(*) FILTER (WHERE risk_level = 'high') as high_risk_requests,
  COUNT(*) FILTER (WHERE risk_level = 'critical') as critical_requests,
  COUNT(DISTINCT ip_address) as unique_ips,
  COUNT(DISTINCT user_agent) as unique_user_agents
FROM rate_limit_requests
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour DESC;

-- セキュリティインシデント統計ビュー
CREATE OR REPLACE VIEW security_incident_statistics AS
SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  incident_type,
  COUNT(*) as incident_count,
  COUNT(DISTINCT ip_address) as unique_ips,
  COUNT(*) FILTER (WHERE blocked = true) as blocked_count,
  COUNT(*) FILTER (WHERE risk_level = 'critical') as critical_count
FROM security_incidents
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at), incident_type
ORDER BY hour DESC, incident_count DESC;

-- レート制限チェック関数
CREATE OR REPLACE FUNCTION check_rate_limit_db(
  limit_key TEXT,
  window_seconds INTEGER DEFAULT 900,
  max_requests INTEGER DEFAULT 100
)
RETURNS JSONB AS $$
DECLARE
  request_count INTEGER;
  window_start TIMESTAMP WITH TIME ZONE;
BEGIN
  window_start := NOW() - (window_seconds || ' seconds')::INTERVAL;
  
  -- 指定された時間窓内のリクエスト数を取得
  SELECT COUNT(*) INTO request_count
  FROM rate_limit_requests
  WHERE key = limit_key
  AND created_at >= window_start;
  
  RETURN jsonb_build_object(
    'key', limit_key,
    'current_requests', request_count,
    'max_requests', max_requests,
    'remaining', GREATEST(0, max_requests - request_count),
    'allowed', request_count < max_requests,
    'reset_time', EXTRACT(EPOCH FROM (NOW() + (window_seconds || ' seconds')::INTERVAL))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- IPブロック確認関数
CREATE OR REPLACE FUNCTION is_ip_blocked(check_ip INET)
RETURNS BOOLEAN AS $$
DECLARE
  blocked_count INTEGER;
BEGIN
  -- 直接IPまたはCIDR範囲でブロックされているかチェック
  SELECT COUNT(*) INTO blocked_count
  FROM ip_blocklist
  WHERE (
    ip_address = check_ip OR
    (cidr_range IS NOT NULL AND check_ip << cidr_range)
  )
  AND (is_permanent = true OR expires_at IS NULL OR expires_at > NOW());
  
  RETURN blocked_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 自動IPブロック関数（異常な活動を検出した場合）
CREATE OR REPLACE FUNCTION auto_block_malicious_ip(
  target_ip INET,
  reason TEXT DEFAULT 'automated_detection',
  duration_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN AS $$
BEGIN
  -- 管理者または自動システムのみ実行可能
  IF NOT (is_admin() OR current_user = 'service_role') THEN
    RAISE EXCEPTION 'Only administrators or automated systems can block IPs';
  END IF;
  
  -- IPをブロックリストに追加
  INSERT INTO ip_blocklist (
    ip_address,
    reason,
    severity,
    is_permanent,
    expires_at,
    created_by
  ) VALUES (
    target_ip,
    reason,
    'high',
    false,
    NOW() + (duration_minutes || ' minutes')::INTERVAL,
    auth.uid()
  )
  ON CONFLICT (ip_address) DO UPDATE SET
    expires_at = EXCLUDED.expires_at,
    reason = EXCLUDED.reason,
    updated_at = NOW();
  
  -- セキュリティインシデントとして記録
  INSERT INTO security_incidents (
    ip_address,
    path,
    incident_type,
    risk_level,
    blocked,
    details
  ) VALUES (
    target_ip,
    '/auto-block',
    'automated_ip_block',
    'high',
    true,
    jsonb_build_object(
      'reason', reason,
      'duration_minutes', duration_minutes,
      'blocked_by_system', true
    )
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 異常検出とアラート関数
CREATE OR REPLACE FUNCTION detect_rate_limit_anomalies()
RETURNS JSONB AS $$
DECLARE
  anomalies JSONB := '[]'::jsonb;
  anomaly_record RECORD;
  threshold_requests INTEGER := 1000; -- 1時間あたりの異常閾値
  threshold_incidents INTEGER := 50; -- 1時間あたりのインシデント閾値
BEGIN
  -- 管理者のみ実行可能
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only administrators can detect rate limit anomalies';
  END IF;
  
  -- 過去1時間の異常に多いリクエストを検出
  FOR anomaly_record IN
    SELECT 
      ip_address,
      COUNT(*) as request_count,
      COUNT(*) FILTER (WHERE is_suspicious = true) as suspicious_count,
      array_agg(DISTINCT path) as paths,
      MAX(created_at) as last_request
    FROM rate_limit_requests
    WHERE created_at > NOW() - INTERVAL '1 hour'
    GROUP BY ip_address
    HAVING COUNT(*) > threshold_requests
    ORDER BY request_count DESC
    LIMIT 10
  LOOP
    anomalies := anomalies || jsonb_build_object(
      'type', 'high_request_volume',
      'ip_address', anomaly_record.ip_address,
      'request_count', anomaly_record.request_count,
      'suspicious_count', anomaly_record.suspicious_count,
      'paths', anomaly_record.paths,
      'last_request', anomaly_record.last_request,
      'severity', 'high'
    );
  END LOOP;
  
  -- セキュリティインシデントの多いIPを検出
  FOR anomaly_record IN
    SELECT 
      ip_address,
      COUNT(*) as incident_count,
      array_agg(DISTINCT incident_type) as incident_types,
      MAX(created_at) as last_incident
    FROM security_incidents
    WHERE created_at > NOW() - INTERVAL '1 hour'
    GROUP BY ip_address
    HAVING COUNT(*) > threshold_incidents
    ORDER BY incident_count DESC
    LIMIT 10
  LOOP
    anomalies := anomalies || jsonb_build_object(
      'type', 'high_incident_count',
      'ip_address', anomaly_record.ip_address,
      'incident_count', anomaly_record.incident_count,
      'incident_types', anomaly_record.incident_types,
      'last_incident', anomaly_record.last_incident,
      'severity', 'critical'
    );
  END LOOP;
  
  RETURN jsonb_build_object(
    'scan_time', NOW(),
    'anomaly_count', jsonb_array_length(anomalies),
    'anomalies', anomalies,
    'thresholds', jsonb_build_object(
      'requests_per_hour', threshold_requests,
      'incidents_per_hour', threshold_incidents
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 古いレコードのクリーンアップ関数
CREATE OR REPLACE FUNCTION cleanup_rate_limit_data(
  retention_hours INTEGER DEFAULT 168 -- デフォルト7日間
)
RETURNS INTEGER AS $$
DECLARE
  deleted_requests INTEGER;
  deleted_incidents INTEGER;
  total_deleted INTEGER;
BEGIN
  -- 管理者のみ実行可能
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only administrators can cleanup rate limit data';
  END IF;
  
  -- 古いレート制限リクエストを削除
  DELETE FROM rate_limit_requests
  WHERE created_at < NOW() - (retention_hours || ' hours')::INTERVAL;
  GET DIAGNOSTICS deleted_requests = ROW_COUNT;
  
  -- 古いセキュリティインシデント（低〜中リスクのみ）を削除
  DELETE FROM security_incidents
  WHERE created_at < NOW() - (retention_hours || ' hours')::INTERVAL
  AND risk_level IN ('low', 'medium');
  GET DIAGNOSTICS deleted_incidents = ROW_COUNT;
  
  total_deleted := deleted_requests + deleted_incidents;
  
  -- クリーンアップログを記録
  INSERT INTO service_role_audit (
    operation_type,
    is_service_role,
    risk_level,
    row_count,
    additional_data
  ) VALUES (
    'RATE_LIMIT_CLEANUP',
    FALSE,
    'low',
    total_deleted,
    jsonb_build_object(
      'deleted_requests', deleted_requests,
      'deleted_incidents', deleted_incidents,
      'retention_hours', retention_hours,
      'administrator', auth.uid()
    )
  );
  
  RETURN total_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 完了メッセージ
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== APIレート制限システム データベース実装完了 ===';
  RAISE NOTICE '1. rate_limit_requests テーブル作成';
  RAISE NOTICE '2. security_incidents テーブル作成';
  RAISE NOTICE '3. ip_blocklist テーブル作成';
  RAISE NOTICE '4. rate_limit_configs テーブル作成';
  RAISE NOTICE '5. 統計ビュー作成';
  RAISE NOTICE '6. レート制限チェック関数 check_rate_limit_db()';
  RAISE NOTICE '7. IPブロック確認関数 is_ip_blocked()';
  RAISE NOTICE '8. 自動IPブロック関数 auto_block_malicious_ip()';
  RAISE NOTICE '9. 異常検出関数 detect_rate_limit_anomalies()';
  RAISE NOTICE '10. クリーンアップ関数 cleanup_rate_limit_data()';
  RAISE NOTICE '';
  RAISE NOTICE '使用例:';
  RAISE NOTICE '- SELECT check_rate_limit_db(''192.168.1.1:/api'', 900, 100);';
  RAISE NOTICE '- SELECT is_ip_blocked(''192.168.1.1'');';
  RAISE NOTICE '- SELECT detect_rate_limit_anomalies();';
  RAISE NOTICE '';
  RAISE NOTICE '次のステップ: middleware.ts でレート制限ミドルウェアを統合';
END $$;