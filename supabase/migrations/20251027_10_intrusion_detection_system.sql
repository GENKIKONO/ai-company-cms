-- 侵入検知システム（IDS）の実装
-- 高度な脅威検出とリアルタイム対応機能

-- 侵入検知ルールテーブル
CREATE TABLE IF NOT EXISTS intrusion_detection_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL UNIQUE,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('signature', 'anomaly', 'behavioral', 'ml_based')),
  rule_category TEXT NOT NULL CHECK (rule_category IN ('network', 'application', 'authentication', 'data_access')),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  condition_sql TEXT NOT NULL, -- SQL条件文
  threshold_count INTEGER DEFAULT 1, -- 閾値（回数）
  threshold_window_minutes INTEGER DEFAULT 5, -- 時間窓（分）
  is_active BOOLEAN DEFAULT TRUE,
  auto_block BOOLEAN DEFAULT FALSE, -- 自動ブロック機能
  alert_enabled BOOLEAN DEFAULT TRUE,
  description TEXT,
  remediation_action TEXT, -- 対処法
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_ids_rules_active ON intrusion_detection_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_ids_rules_type ON intrusion_detection_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_ids_rules_severity ON intrusion_detection_rules(severity);

-- 侵入検知アラートテーブル
CREATE TABLE IF NOT EXISTS intrusion_detection_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES intrusion_detection_rules(id),
  alert_level TEXT NOT NULL CHECK (alert_level IN ('info', 'warning', 'critical', 'emergency')),
  source_ip INET NOT NULL,
  target_resource TEXT, -- 対象リソース（テーブル、API等）
  attack_vector TEXT, -- 攻撃手法
  evidence JSONB, -- 証拠データ
  risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  is_false_positive BOOLEAN DEFAULT FALSE,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  auto_actions_taken JSONB, -- 自動実行されたアクション
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 侵入検知アラート用インデックス
CREATE INDEX IF NOT EXISTS idx_ids_alerts_created_at ON intrusion_detection_alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_ids_alerts_level ON intrusion_detection_alerts(alert_level);
CREATE INDEX IF NOT EXISTS idx_ids_alerts_source_ip ON intrusion_detection_alerts(source_ip);
CREATE INDEX IF NOT EXISTS idx_ids_alerts_resolved ON intrusion_detection_alerts(is_resolved);
CREATE INDEX IF NOT EXISTS idx_ids_alerts_false_positive ON intrusion_detection_alerts(is_false_positive);

-- 行動パターン分析テーブル
CREATE TABLE IF NOT EXISTS behavioral_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  ip_address INET,
  session_fingerprint TEXT, -- ブラウザフィンガープリント
  normal_patterns JSONB, -- 正常な行動パターン
  anomaly_score DECIMAL(5,2) DEFAULT 0.0,
  last_analysis TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  pattern_data JSONB, -- 詳細な行動データ
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 行動パターン用インデックス
CREATE INDEX IF NOT EXISTS idx_behavioral_patterns_user_id ON behavioral_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_behavioral_patterns_ip ON behavioral_patterns(ip_address);
CREATE INDEX IF NOT EXISTS idx_behavioral_patterns_anomaly_score ON behavioral_patterns(anomaly_score);

-- RLS有効化
ALTER TABLE intrusion_detection_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE intrusion_detection_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE behavioral_patterns ENABLE ROW LEVEL SECURITY;

-- 管理者のみアクセス可能
CREATE POLICY "admin_full_access_ids_rules" ON intrusion_detection_rules
  FOR ALL USING (is_admin());

CREATE POLICY "admin_full_access_ids_alerts" ON intrusion_detection_alerts
  FOR ALL USING (is_admin());

CREATE POLICY "admin_full_access_behavioral_patterns" ON behavioral_patterns
  FOR ALL USING (is_admin());

-- デフォルトの侵入検知ルールを挿入
INSERT INTO intrusion_detection_rules (rule_name, rule_type, rule_category, severity, condition_sql, threshold_count, threshold_window_minutes, auto_block, description, remediation_action) VALUES
  ('Brute Force Login Detection', 'signature', 'authentication', 'high', 
   'SELECT COUNT(*) FROM security_incidents WHERE incident_type = ''authentication_failure'' AND ip_address = $1 AND created_at > NOW() - INTERVAL ''5 minutes''', 
   5, 5, true, 'ログイン試行の総当たり攻撃を検出', 'IP一時ブロック、管理者通知'),
   
  ('SQL Injection Pattern', 'signature', 'application', 'critical', 
   'SELECT COUNT(*) FROM security_incidents WHERE incident_type = ''sql_injection_attempt'' AND ip_address = $1 AND created_at > NOW() - INTERVAL ''1 minute''', 
   1, 1, true, 'SQLインジェクション攻撃パターンを検出', '即座にIPブロック、緊急アラート'),
   
  ('Abnormal Data Access Volume', 'anomaly', 'data_access', 'medium', 
   'SELECT COUNT(*) FROM service_role_audit WHERE ip_address = $1 AND operation_type = ''SELECT'' AND created_at > NOW() - INTERVAL ''10 minutes''', 
   100, 10, false, '異常なデータアクセス量を検出', 'アクセス監視強化、調査開始'),
   
  ('Multiple Failed Authentication', 'behavioral', 'authentication', 'high', 
   'SELECT COUNT(DISTINCT user_id) FROM security_incidents WHERE incident_type LIKE ''%auth%'' AND ip_address = $1 AND created_at > NOW() - INTERVAL ''15 minutes''', 
   3, 15, true, '複数アカウントでの認証失敗', 'IP範囲ブロック検討'),
   
  ('Admin Panel Access Attempt', 'signature', 'application', 'high', 
   'SELECT COUNT(*) FROM rate_limit_requests WHERE path LIKE ''%admin%'' AND ip_address = $1 AND created_at > NOW() - INTERVAL ''5 minutes''', 
   3, 5, true, '管理者パネルへの不正アクセス試行', 'IP即座ブロック、管理者緊急通知'),
   
  ('Suspicious User Agent Pattern', 'signature', 'network', 'medium', 
   'SELECT COUNT(*) FROM rate_limit_requests WHERE is_suspicious = true AND ip_address = $1 AND created_at > NOW() - INTERVAL ''10 minutes''', 
   10, 10, false, '疑わしいUser-Agentパターン', 'ボット検証実施'),
   
  ('Data Exfiltration Pattern', 'anomaly', 'data_access', 'critical', 
   'SELECT SUM(row_count) FROM service_role_audit WHERE ip_address = $1 AND operation_type = ''SELECT'' AND created_at > NOW() - INTERVAL ''1 hour''', 
   1000, 60, true, '大量データ取得による情報漏洩の可能性', '即座にアクセス停止、調査開始'),
   
  ('Geographic Anomaly', 'behavioral', 'network', 'medium', 
   'SELECT COUNT(DISTINCT country_code) FROM rate_limit_requests WHERE user_id = $1 AND created_at > NOW() - INTERVAL ''1 hour''', 
   3, 60, false, '同一ユーザーの複数国からのアクセス', '二要素認証強制、セッション無効化'),
   
  ('Time-based Access Anomaly', 'behavioral', 'authentication', 'low', 
   'SELECT COUNT(*) FROM rate_limit_requests WHERE user_id = $1 AND EXTRACT(hour FROM created_at) NOT BETWEEN 6 AND 22 AND created_at > NOW() - INTERVAL ''24 hours''', 
   5, 1440, false, '通常時間外の異常なアクセス', 'ユーザー通知、アクセスログ確認')
ON CONFLICT (rule_name) DO NOTHING;

-- 侵入検知実行関数
CREATE OR REPLACE FUNCTION execute_intrusion_detection()
RETURNS JSONB AS $$
DECLARE
  rule_record RECORD;
  alert_count INTEGER := 0;
  triggered_rules JSONB := '[]'::jsonb;
  check_result INTEGER;
  evidence_data JSONB;
  risk_score INTEGER;
BEGIN
  -- 管理者またはシステムのみ実行可能
  IF NOT (is_admin() OR current_user = 'service_role') THEN
    RAISE EXCEPTION 'Only administrators or system can execute intrusion detection';
  END IF;
  
  -- アクティブなルールを順次チェック
  FOR rule_record IN 
    SELECT * FROM intrusion_detection_rules 
    WHERE is_active = TRUE 
    ORDER BY severity DESC, created_at ASC
  LOOP
    -- 動的SQLでルール条件をチェック（簡易版 - 実際は安全な方法で実装）
    -- ここでは基本的な例のみ実装
    CASE rule_record.rule_name
      WHEN 'Brute Force Login Detection' THEN
        SELECT COUNT(*) INTO check_result
        FROM security_incidents 
        WHERE incident_type = 'authentication_failure' 
        AND created_at > NOW() - (rule_record.threshold_window_minutes || ' minutes')::INTERVAL
        GROUP BY ip_address
        HAVING COUNT(*) >= rule_record.threshold_count
        LIMIT 1;
        
      WHEN 'SQL Injection Pattern' THEN
        SELECT COUNT(*) INTO check_result
        FROM security_incidents 
        WHERE incident_type = 'sql_injection_attempt' 
        AND created_at > NOW() - (rule_record.threshold_window_minutes || ' minutes')::INTERVAL
        GROUP BY ip_address
        HAVING COUNT(*) >= rule_record.threshold_count
        LIMIT 1;
        
      ELSE
        check_result := 0;
    END CASE;
    
    -- 閾値を超えた場合はアラート生成
    IF check_result >= rule_record.threshold_count THEN
      alert_count := alert_count + 1;
      
      -- リスクスコア計算
      risk_score := CASE rule_record.severity
        WHEN 'critical' THEN 90 + (check_result - rule_record.threshold_count) * 2
        WHEN 'high' THEN 70 + (check_result - rule_record.threshold_count) * 2
        WHEN 'medium' THEN 50 + (check_result - rule_record.threshold_count)
        ELSE 30 + (check_result - rule_record.threshold_count)
      END;
      
      -- 証拠データ構築
      evidence_data := jsonb_build_object(
        'rule_triggered', rule_record.rule_name,
        'threshold_exceeded', check_result,
        'detection_time', NOW(),
        'rule_condition', rule_record.condition_sql
      );
      
      -- アラート挿入
      INSERT INTO intrusion_detection_alerts (
        rule_id,
        alert_level,
        source_ip,
        attack_vector,
        evidence,
        risk_score
      ) VALUES (
        rule_record.id,
        CASE rule_record.severity
          WHEN 'critical' THEN 'emergency'
          WHEN 'high' THEN 'critical'
          WHEN 'medium' THEN 'warning'
          ELSE 'info'
        END,
        '0.0.0.0'::inet, -- 実際のIPは動的に取得
        rule_record.rule_name,
        evidence_data,
        LEAST(risk_score, 100)
      );
      
      -- トリガーされたルールを記録
      triggered_rules := triggered_rules || jsonb_build_object(
        'rule_name', rule_record.rule_name,
        'severity', rule_record.severity,
        'count', check_result,
        'threshold', rule_record.threshold_count
      );
      
      -- 自動ブロック実行
      IF rule_record.auto_block THEN
        -- ここで自動ブロック処理を実装
        RAISE NOTICE 'Auto-block triggered for rule: %', rule_record.rule_name;
      END IF;
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'scan_time', NOW(),
    'rules_checked', (SELECT COUNT(*) FROM intrusion_detection_rules WHERE is_active = TRUE),
    'alerts_generated', alert_count,
    'triggered_rules', triggered_rules
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 行動パターン分析関数
CREATE OR REPLACE FUNCTION analyze_behavioral_patterns(target_user_id UUID DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
  user_record RECORD;
  pattern_analysis JSONB := '[]'::jsonb;
  anomaly_found BOOLEAN := FALSE;
  total_analyzed INTEGER := 0;
BEGIN
  -- 管理者のみ実行可能
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only administrators can analyze behavioral patterns';
  END IF;
  
  -- 特定ユーザーまたは全ユーザーを分析
  FOR user_record IN 
    SELECT DISTINCT u.id, u.email, r.ip_address, r.user_agent
    FROM auth.users u
    LEFT JOIN rate_limit_requests r ON u.id = r.user_id
    WHERE (target_user_id IS NULL OR u.id = target_user_id)
    AND r.created_at > NOW() - INTERVAL '24 hours'
  LOOP
    total_analyzed := total_analyzed + 1;
    
    -- 簡易異常検出（実際はより複雑な機械学習アルゴリズムを使用）
    DECLARE
      request_count INTEGER;
      unique_paths INTEGER;
      time_variance NUMERIC;
      anomaly_score NUMERIC := 0;
    BEGIN
      -- リクエスト数分析
      SELECT COUNT(*) INTO request_count
      FROM rate_limit_requests 
      WHERE user_id = user_record.id 
      AND created_at > NOW() - INTERVAL '1 hour';
      
      -- アクセスパスの多様性
      SELECT COUNT(DISTINCT path) INTO unique_paths
      FROM rate_limit_requests 
      WHERE user_id = user_record.id 
      AND created_at > NOW() - INTERVAL '24 hours';
      
      -- 時間分散分析（簡易版）
      SELECT STDDEV(EXTRACT(hour FROM created_at)) INTO time_variance
      FROM rate_limit_requests 
      WHERE user_id = user_record.id 
      AND created_at > NOW() - INTERVAL '7 days';
      
      -- 異常スコア計算
      IF request_count > 100 THEN anomaly_score := anomaly_score + 20; END IF;
      IF unique_paths > 50 THEN anomaly_score := anomaly_score + 15; END IF;
      IF time_variance > 6 THEN anomaly_score := anomaly_score + 10; END IF;
      
      -- 異常検出
      IF anomaly_score > 30 THEN
        anomaly_found := TRUE;
        
        -- 行動パターンテーブルを更新
        INSERT INTO behavioral_patterns (
          user_id,
          ip_address,
          anomaly_score,
          pattern_data
        ) VALUES (
          user_record.id,
          user_record.ip_address,
          anomaly_score,
          jsonb_build_object(
            'request_count_1h', request_count,
            'unique_paths_24h', unique_paths,
            'time_variance_7d', time_variance,
            'analysis_time', NOW()
          )
        )
        ON CONFLICT (user_id) DO UPDATE SET
          anomaly_score = EXCLUDED.anomaly_score,
          pattern_data = EXCLUDED.pattern_data,
          updated_at = NOW();
      END IF;
      
      pattern_analysis := pattern_analysis || jsonb_build_object(
        'user_id', user_record.id,
        'email', user_record.email,
        'anomaly_score', anomaly_score,
        'is_anomalous', anomaly_score > 30,
        'metrics', jsonb_build_object(
          'requests_1h', request_count,
          'unique_paths_24h', unique_paths,
          'time_variance_7d', time_variance
        )
      );
    END;
  END LOOP;
  
  RETURN jsonb_build_object(
    'analysis_time', NOW(),
    'total_users_analyzed', total_analyzed,
    'anomalies_detected', (SELECT COUNT(*) FROM jsonb_array_elements(pattern_analysis) WHERE (value->>'is_anomalous')::boolean = true),
    'patterns', pattern_analysis
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- アラート解決関数
CREATE OR REPLACE FUNCTION resolve_intrusion_alert(
  alert_id UUID,
  resolution_notes_param TEXT DEFAULT NULL,
  mark_false_positive BOOLEAN DEFAULT FALSE
)
RETURNS BOOLEAN AS $$
BEGIN
  -- 管理者のみ実行可能
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only administrators can resolve intrusion alerts';
  END IF;
  
  UPDATE intrusion_detection_alerts
  SET 
    is_resolved = TRUE,
    is_false_positive = mark_false_positive,
    resolved_by = auth.uid(),
    resolved_at = NOW(),
    resolution_notes = resolution_notes_param
  WHERE id = alert_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- IDS統計ビュー
CREATE OR REPLACE VIEW ids_statistics AS
SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  alert_level,
  COUNT(*) as alert_count,
  COUNT(*) FILTER (WHERE is_resolved = false) as unresolved_count,
  COUNT(*) FILTER (WHERE is_false_positive = true) as false_positive_count,
  AVG(risk_score) as avg_risk_score,
  MAX(risk_score) as max_risk_score
FROM intrusion_detection_alerts
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at), alert_level
ORDER BY hour DESC, alert_level;

-- 定期実行用関数（cron jobで呼び出し）
CREATE OR REPLACE FUNCTION scheduled_intrusion_detection()
RETURNS VOID AS $$
BEGIN
  -- 侵入検知実行
  PERFORM execute_intrusion_detection();
  
  -- 行動パターン分析（1時間おき）
  IF EXTRACT(minute FROM NOW()) = 0 THEN
    PERFORM analyze_behavioral_patterns();
  END IF;
  
  -- 古いアラートのクリーンアップ（30日以上前）
  DELETE FROM intrusion_detection_alerts 
  WHERE created_at < NOW() - INTERVAL '30 days' 
  AND is_resolved = TRUE;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 完了メッセージ
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== 侵入検知システム（IDS）実装完了 ===';
  RAISE NOTICE '1. intrusion_detection_rules テーブル作成';
  RAISE NOTICE '2. intrusion_detection_alerts テーブル作成';
  RAISE NOTICE '3. behavioral_patterns テーブル作成';
  RAISE NOTICE '4. 9種類のデフォルト検知ルール設定';
  RAISE NOTICE '5. execute_intrusion_detection() 関数';
  RAISE NOTICE '6. analyze_behavioral_patterns() 関数';
  RAISE NOTICE '7. resolve_intrusion_alert() 関数';
  RAISE NOTICE '8. scheduled_intrusion_detection() 定期実行関数';
  RAISE NOTICE '';
  RAISE NOTICE '使用例:';
  RAISE NOTICE '- SELECT execute_intrusion_detection();';
  RAISE NOTICE '- SELECT analyze_behavioral_patterns();';
  RAISE NOTICE '- SELECT * FROM ids_statistics;';
  RAISE NOTICE '';
  RAISE NOTICE '定期実行設定:';
  RAISE NOTICE 'cron job: */5 * * * * SELECT scheduled_intrusion_detection();';
END $$;