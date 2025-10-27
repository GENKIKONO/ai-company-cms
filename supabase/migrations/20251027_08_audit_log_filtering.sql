-- 監査ログ機密情報フィルタリングシステムの実装
-- 個人情報や機密データを自動的に検出・マスキング・除外

-- 機密情報パターン設定テーブル
CREATE TABLE IF NOT EXISTS sensitive_data_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_name TEXT NOT NULL UNIQUE,
  regex_pattern TEXT NOT NULL,
  replacement_text TEXT DEFAULT '[REDACTED]',
  severity_level TEXT DEFAULT 'medium' CHECK (severity_level IN ('low', 'medium', 'high', 'critical')),
  is_active BOOLEAN DEFAULT TRUE,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_sensitive_patterns_active ON sensitive_data_patterns(is_active);
CREATE INDEX IF NOT EXISTS idx_sensitive_patterns_severity ON sensitive_data_patterns(severity_level);

-- RLS有効化（管理者のみアクセス可能）
ALTER TABLE sensitive_data_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_manage_sensitive_patterns" ON sensitive_data_patterns
  FOR ALL USING (is_admin());

-- デフォルトの機密情報パターンを挿入
INSERT INTO sensitive_data_patterns (pattern_name, regex_pattern, replacement_text, severity_level, description) VALUES
  ('email_addresses', '\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '[EMAIL]', 'medium', 'メールアドレスの検出'),
  ('phone_numbers_jp', '\b0\d{1,4}-\d{1,4}-\d{4}\b', '[PHONE]', 'medium', '日本の電話番号パターン'),
  ('phone_numbers_intl', '\b\+\d{1,3}[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}\b', '[PHONE]', 'medium', '国際電話番号パターン'),
  ('credit_card_numbers', '\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b', '[CARD]', 'high', 'クレジットカード番号パターン'),
  ('japanese_postal_codes', '\b\d{3}-\d{4}\b', '[POSTAL]', 'low', '日本の郵便番号'),
  ('ip_addresses', '\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b', '[IP]', 'medium', 'IPアドレス'),
  ('uuid_patterns', '\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b', '[UUID]', 'low', 'UUID識別子'),
  ('api_keys', '\b[A-Za-z0-9]{32,}\b', '[API_KEY]', 'critical', 'APIキーパターン'),
  ('jwt_tokens', '\beyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*\b', '[JWT]', 'critical', 'JWTトークン'),
  ('passwords_in_text', '(password|pwd|pass)\s*[:=]\s*\S+', '[PASSWORD]', 'critical', 'パスワード記述の検出')
ON CONFLICT (pattern_name) DO NOTHING;

-- 機密情報フィルタリング関数
CREATE OR REPLACE FUNCTION filter_sensitive_data(input_text TEXT)
RETURNS TEXT AS $$
DECLARE
  filtered_text TEXT;
  pattern_record RECORD;
BEGIN
  -- 入力が空またはNULLの場合はそのまま返す
  IF input_text IS NULL OR length(trim(input_text)) = 0 THEN
    RETURN input_text;
  END IF;
  
  filtered_text := input_text;
  
  -- アクティブなパターンを順次適用
  FOR pattern_record IN 
    SELECT regex_pattern, replacement_text, severity_level
    FROM sensitive_data_patterns 
    WHERE is_active = TRUE
    ORDER BY 
      CASE severity_level 
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
      END
  LOOP
    -- 正規表現でマッチした部分を置換
    filtered_text := regexp_replace(
      filtered_text, 
      pattern_record.regex_pattern, 
      pattern_record.replacement_text, 
      'gi'
    );
  END LOOP;
  
  RETURN filtered_text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- フィルタリング済み監査ログビュー
CREATE OR REPLACE VIEW filtered_audit_logs AS
SELECT 
  id,
  operation_type,
  table_name,
  function_name,
  user_id,
  session_id,
  request_ip,
  filter_sensitive_data(user_agent) as user_agent,
  filter_sensitive_data(query_text) as query_text,
  row_count,
  execution_time_ms,
  is_service_role,
  risk_level,
  created_at,
  -- additional_dataから機密情報をフィルタリング
  CASE 
    WHEN additional_data IS NOT NULL THEN
      jsonb_build_object(
        'filtered', true,
        'original_keys', jsonb_object_keys(additional_data),
        'safe_data', filter_sensitive_data(additional_data::TEXT)::jsonb
      )
    ELSE NULL
  END as additional_data
FROM service_role_audit;

-- フィルタリング済みビューのRLS
ALTER VIEW filtered_audit_logs SET (security_invoker = true);

-- 機密データ検出レポート関数
CREATE OR REPLACE FUNCTION generate_sensitive_data_report(
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '24 hours',
  end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS JSONB AS $$
DECLARE
  total_logs INTEGER;
  pattern_matches JSONB := '[]'::jsonb;
  pattern_record RECORD;
  match_count INTEGER;
  sample_matches TEXT[];
  result JSONB;
BEGIN
  -- 管理者のみ実行可能
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only administrators can generate sensitive data reports';
  END IF;
  
  -- 対象期間の総ログ数
  SELECT COUNT(*) INTO total_logs
  FROM service_role_audit
  WHERE created_at BETWEEN start_date AND end_date;
  
  -- パターン別マッチング統計
  FOR pattern_record IN 
    SELECT pattern_name, regex_pattern, severity_level, description
    FROM sensitive_data_patterns 
    WHERE is_active = TRUE
  LOOP
    -- マッチ数をカウント
    SELECT COUNT(*) INTO match_count
    FROM service_role_audit
    WHERE created_at BETWEEN start_date AND end_date
    AND (
      query_text ~ pattern_record.regex_pattern OR
      user_agent ~ pattern_record.regex_pattern OR
      additional_data::TEXT ~ pattern_record.regex_pattern
    );
    
    -- サンプルマッチを取得（最大3件）
    SELECT array_agg(matches.match_text) INTO sample_matches
    FROM (
      SELECT regexp_matches(
        COALESCE(query_text, '') || ' ' || COALESCE(user_agent, '') || ' ' || COALESCE(additional_data::TEXT, ''),
        pattern_record.regex_pattern,
        'gi'
      )[1] as match_text
      FROM service_role_audit
      WHERE created_at BETWEEN start_date AND end_date
      AND (
        query_text ~ pattern_record.regex_pattern OR
        user_agent ~ pattern_record.regex_pattern OR
        additional_data::TEXT ~ pattern_record.regex_pattern
      )
      LIMIT 3
    ) matches;
    
    -- マッチがあった場合のみ結果に追加
    IF match_count > 0 THEN
      pattern_matches := pattern_matches || jsonb_build_object(
        'pattern_name', pattern_record.pattern_name,
        'description', pattern_record.description,
        'severity_level', pattern_record.severity_level,
        'match_count', match_count,
        'sample_matches', COALESCE(sample_matches, ARRAY[]::TEXT[])
      );
    END IF;
  END LOOP;
  
  -- 結果を構築
  result := jsonb_build_object(
    'report_period', jsonb_build_object(
      'start_date', start_date,
      'end_date', end_date
    ),
    'summary', jsonb_build_object(
      'total_audit_logs', total_logs,
      'patterns_matched', jsonb_array_length(pattern_matches),
      'has_sensitive_data', jsonb_array_length(pattern_matches) > 0
    ),
    'pattern_matches', pattern_matches,
    'generated_at', NOW(),
    'generated_by', auth.uid()
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 自動フィルタリングトリガー関数
CREATE OR REPLACE FUNCTION auto_filter_audit_log()
RETURNS TRIGGER AS $$
DECLARE
  has_sensitive_data BOOLEAN := FALSE;
  pattern_record RECORD;
  original_query TEXT;
BEGIN
  -- 新しいレコードに対してのみ実行
  IF TG_OP = 'INSERT' THEN
    original_query := NEW.query_text;
    
    -- 機密データの存在チェック
    FOR pattern_record IN 
      SELECT pattern_name, regex_pattern, severity_level
      FROM sensitive_data_patterns 
      WHERE is_active = TRUE 
      AND severity_level IN ('high', 'critical')
    LOOP
      IF NEW.query_text ~ pattern_record.regex_pattern OR
         NEW.user_agent ~ pattern_record.regex_pattern THEN
        has_sensitive_data := TRUE;
        EXIT; -- 一つでも見つかったら終了
      END IF;
    END LOOP;
    
    -- 機密データが見つかった場合の処理
    IF has_sensitive_data THEN
      -- query_textをフィルタリング
      NEW.query_text := filter_sensitive_data(NEW.query_text);
      NEW.user_agent := filter_sensitive_data(NEW.user_agent);
      
      -- additional_dataにフィルタリング情報を追加
      NEW.additional_data := COALESCE(NEW.additional_data, '{}'::jsonb) || 
        jsonb_build_object(
          'filtered_sensitive_data', TRUE,
          'original_query_length', length(original_query),
          'filtered_at', NOW()
        );
      
      -- リスクレベルを上げる
      IF NEW.risk_level = 'low' THEN
        NEW.risk_level := 'medium';
      ELSIF NEW.risk_level = 'medium' THEN
        NEW.risk_level := 'high';
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 自動フィルタリングトリガーを監査ログテーブルに設定
DROP TRIGGER IF EXISTS trigger_auto_filter_sensitive_data ON service_role_audit;
CREATE TRIGGER trigger_auto_filter_sensitive_data
  BEFORE INSERT ON service_role_audit
  FOR EACH ROW
  EXECUTE FUNCTION auto_filter_audit_log();

-- 機密情報パターン管理関数
CREATE OR REPLACE FUNCTION manage_sensitive_pattern(
  action TEXT, -- 'add', 'update', 'delete', 'toggle'
  pattern_name_param TEXT,
  regex_pattern_param TEXT DEFAULT NULL,
  replacement_text_param TEXT DEFAULT '[REDACTED]',
  severity_level_param TEXT DEFAULT 'medium',
  description_param TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- 管理者のみ実行可能
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only administrators can manage sensitive data patterns';
  END IF;
  
  CASE action
    WHEN 'add' THEN
      INSERT INTO sensitive_data_patterns (
        pattern_name, regex_pattern, replacement_text, severity_level, description, created_by
      ) VALUES (
        pattern_name_param, regex_pattern_param, replacement_text_param, 
        severity_level_param, description_param, auth.uid()
      );
      
    WHEN 'update' THEN
      UPDATE sensitive_data_patterns 
      SET 
        regex_pattern = COALESCE(regex_pattern_param, regex_pattern),
        replacement_text = COALESCE(replacement_text_param, replacement_text),
        severity_level = COALESCE(severity_level_param, severity_level),
        description = COALESCE(description_param, description),
        updated_at = NOW()
      WHERE pattern_name = pattern_name_param;
      
    WHEN 'delete' THEN
      DELETE FROM sensitive_data_patterns 
      WHERE pattern_name = pattern_name_param;
      
    WHEN 'toggle' THEN
      UPDATE sensitive_data_patterns 
      SET is_active = NOT is_active, updated_at = NOW()
      WHERE pattern_name = pattern_name_param;
      
    ELSE
      RAISE EXCEPTION 'Invalid action: %. Valid actions are: add, update, delete, toggle', action;
  END CASE;
  
  -- 変更ログを記録
  INSERT INTO service_role_audit (
    operation_type,
    is_service_role,
    risk_level,
    additional_data
  ) VALUES (
    'PATTERN_MANAGEMENT',
    FALSE,
    'medium',
    jsonb_build_object(
      'action', action,
      'pattern_name', pattern_name_param,
      'severity_level', severity_level_param,
      'administrator', auth.uid()
    )
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- データ漏洩検出関数
CREATE OR REPLACE FUNCTION detect_data_leakage()
RETURNS JSONB AS $$
DECLARE
  potential_leaks JSONB := '[]'::jsonb;
  leak_record RECORD;
  high_risk_threshold INTEGER := 10;
BEGIN
  -- 管理者のみ実行可能
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only administrators can detect data leakage';
  END IF;
  
  -- 過去24時間の機密データ露出を検出
  FOR leak_record IN
    SELECT 
      date_trunc('hour', created_at) as leak_hour,
      table_name,
      COUNT(*) as leak_count,
      array_agg(DISTINCT risk_level) as risk_levels,
      COUNT(CASE WHEN additional_data ? 'filtered_sensitive_data' THEN 1 END) as filtered_count
    FROM service_role_audit
    WHERE created_at > NOW() - INTERVAL '24 hours'
    AND (
      additional_data ? 'filtered_sensitive_data' OR
      risk_level IN ('high', 'critical')
    )
    GROUP BY date_trunc('hour', created_at), table_name
    HAVING COUNT(*) >= high_risk_threshold
    ORDER BY leak_count DESC
  LOOP
    potential_leaks := potential_leaks || jsonb_build_object(
      'leak_hour', leak_record.leak_hour,
      'table_name', leak_record.table_name,
      'leak_count', leak_record.leak_count,
      'risk_levels', leak_record.risk_levels,
      'filtered_count', leak_record.filtered_count,
      'severity', CASE 
        WHEN leak_record.leak_count > 50 THEN 'critical'
        WHEN leak_record.leak_count > 25 THEN 'high'
        ELSE 'medium'
      END
    );
  END LOOP;
  
  RETURN jsonb_build_object(
    'scan_time', NOW(),
    'potential_leaks', potential_leaks,
    'leak_incidents', jsonb_array_length(potential_leaks),
    'requires_investigation', jsonb_array_length(potential_leaks) > 0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 完了メッセージ
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== 監査ログ機密情報フィルタリングシステム実装完了 ===';
  RAISE NOTICE '1. sensitive_data_patterns テーブルと初期パターン作成';
  RAISE NOTICE '2. filter_sensitive_data() フィルタリング関数';
  RAISE NOTICE '3. filtered_audit_logs ビュー（機密情報マスキング済み）';
  RAISE NOTICE '4. generate_sensitive_data_report() レポート関数';
  RAISE NOTICE '5. auto_filter_audit_log() 自動フィルタリングトリガー';
  RAISE NOTICE '6. manage_sensitive_pattern() パターン管理関数';
  RAISE NOTICE '7. detect_data_leakage() データ漏洩検出関数';
  RAISE NOTICE '';
  RAISE NOTICE '使用例:';
  RAISE NOTICE '- SELECT generate_sensitive_data_report();';
  RAISE NOTICE '- SELECT detect_data_leakage();';
  RAISE NOTICE '- SELECT * FROM filtered_audit_logs LIMIT 10;';
  RAISE NOTICE '';
  RAISE NOTICE '次のステップ: APIレート制限システムの実装';
END $$;