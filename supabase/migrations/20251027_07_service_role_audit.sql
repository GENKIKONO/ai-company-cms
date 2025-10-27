-- Service Role使用量監査システムの実装
-- Supabaseのサービスロール使用を監視・制限してセキュリティを強化

-- Service Role監査ログテーブル作成
CREATE TABLE IF NOT EXISTS service_role_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_type TEXT NOT NULL, -- 'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'FUNCTION_CALL'
  table_name TEXT,
  function_name TEXT,
  user_id UUID, -- Service Roleの場合はNULL
  session_id TEXT,
  request_ip INET,
  user_agent TEXT,
  query_text TEXT,
  row_count INTEGER,
  execution_time_ms INTEGER,
  is_service_role BOOLEAN DEFAULT FALSE,
  risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  additional_data JSONB
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_service_role_audit_created_at ON service_role_audit(created_at);
CREATE INDEX IF NOT EXISTS idx_service_role_audit_service_role ON service_role_audit(is_service_role);
CREATE INDEX IF NOT EXISTS idx_service_role_audit_risk_level ON service_role_audit(risk_level);
CREATE INDEX IF NOT EXISTS idx_service_role_audit_table_name ON service_role_audit(table_name);
CREATE INDEX IF NOT EXISTS idx_service_role_audit_operation ON service_role_audit(operation_type);

-- RLS有効化（管理者のみ閲覧可能）
ALTER TABLE service_role_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_view_service_role_audit" ON service_role_audit
  FOR SELECT USING (is_admin());

-- Service Role使用検出関数
CREATE OR REPLACE FUNCTION detect_service_role_usage()
RETURNS TRIGGER AS $$
DECLARE
  current_role TEXT;
  risk_assessment TEXT := 'low';
  operation_type TEXT;
  affected_rows INTEGER := 0;
BEGIN
  -- 現在のロールを取得
  SELECT current_user INTO current_role;
  
  -- Service Roleかどうかを判定
  IF current_role = 'service_role' THEN
    
    -- 操作タイプを判定
    operation_type := TG_OP;
    
    -- 影響を受けた行数を取得
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
      affected_rows := 1;
    ELSIF TG_OP = 'DELETE' THEN
      affected_rows := 1;
    END IF;
    
    -- リスクレベルを評価
    IF TG_TABLE_NAME IN ('auth.users', 'app_users', 'role_change_audit') THEN
      risk_assessment := 'high';
    ELSIF TG_TABLE_NAME IN ('organizations', 'organization_members', 'partner_organizations') THEN
      risk_assessment := 'medium';
    ELSIF operation_type = 'DELETE' THEN
      risk_assessment := 'medium';
    END IF;
    
    -- 監査ログに記録
    INSERT INTO service_role_audit (
      operation_type,
      table_name,
      user_id,
      session_id,
      is_service_role,
      risk_level,
      row_count,
      additional_data
    ) VALUES (
      operation_type,
      TG_TABLE_NAME,
      NULL, -- Service Roleなのでuser_idはNULL
      (SELECT pg_backend_pid()::TEXT),
      TRUE,
      risk_assessment,
      affected_rows,
      jsonb_build_object(
        'trigger_name', TG_NAME,
        'trigger_event', TG_EVENT,
        'trigger_level', TG_LEVEL,
        'trigger_when', TG_WHEN
      )
    );
  END IF;
  
  -- 操作を続行
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 重要テーブルにService Role監査トリガーを設定
-- Organizations
DROP TRIGGER IF EXISTS trigger_audit_service_role_organizations ON organizations;
CREATE TRIGGER trigger_audit_service_role_organizations
  BEFORE INSERT OR UPDATE OR DELETE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION detect_service_role_usage();

-- App Users
DROP TRIGGER IF EXISTS trigger_audit_service_role_app_users ON app_users;
CREATE TRIGGER trigger_audit_service_role_app_users
  BEFORE INSERT OR UPDATE OR DELETE ON app_users
  FOR EACH ROW
  EXECUTE FUNCTION detect_service_role_usage();

-- Organization Members
DROP TRIGGER IF EXISTS trigger_audit_service_role_org_members ON organization_members;
CREATE TRIGGER trigger_audit_service_role_org_members
  BEFORE INSERT OR UPDATE OR DELETE ON organization_members
  FOR EACH ROW
  EXECUTE FUNCTION detect_service_role_usage();

-- Partner Organizations
DROP TRIGGER IF EXISTS trigger_audit_service_role_partner_orgs ON partner_organizations;
CREATE TRIGGER trigger_audit_service_role_partner_orgs
  BEFORE INSERT OR UPDATE OR DELETE ON partner_organizations
  FOR EACH ROW
  EXECUTE FUNCTION detect_service_role_usage();

-- Posts
DROP TRIGGER IF EXISTS trigger_audit_service_role_posts ON posts;
CREATE TRIGGER trigger_audit_service_role_posts
  BEFORE INSERT OR UPDATE OR DELETE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION detect_service_role_usage();

-- Services
DROP TRIGGER IF EXISTS trigger_audit_service_role_services ON services;
CREATE TRIGGER trigger_audit_service_role_services
  BEFORE INSERT OR UPDATE OR DELETE ON services
  FOR EACH ROW
  EXECUTE FUNCTION detect_service_role_usage();

-- Service Role使用統計取得関数
CREATE OR REPLACE FUNCTION get_service_role_usage_stats(
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '24 hours',
  end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS JSONB AS $$
DECLARE
  total_operations INTEGER;
  high_risk_operations INTEGER;
  operations_by_table JSONB;
  operations_by_type JSONB;
  recent_critical JSONB;
  result JSONB;
BEGIN
  -- 管理者のみ実行可能
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only administrators can view service role usage statistics';
  END IF;
  
  -- 総操作数
  SELECT COUNT(*) INTO total_operations
  FROM service_role_audit
  WHERE is_service_role = TRUE
  AND created_at BETWEEN start_date AND end_date;
  
  -- 高リスク操作数
  SELECT COUNT(*) INTO high_risk_operations
  FROM service_role_audit
  WHERE is_service_role = TRUE
  AND risk_level IN ('high', 'critical')
  AND created_at BETWEEN start_date AND end_date;
  
  -- テーブル別操作統計
  SELECT jsonb_object_agg(table_name, operation_count) INTO operations_by_table
  FROM (
    SELECT table_name, COUNT(*) as operation_count
    FROM service_role_audit
    WHERE is_service_role = TRUE
    AND created_at BETWEEN start_date AND end_date
    AND table_name IS NOT NULL
    GROUP BY table_name
    ORDER BY operation_count DESC
  ) t;
  
  -- 操作タイプ別統計
  SELECT jsonb_object_agg(operation_type, operation_count) INTO operations_by_type
  FROM (
    SELECT operation_type, COUNT(*) as operation_count
    FROM service_role_audit
    WHERE is_service_role = TRUE
    AND created_at BETWEEN start_date AND end_date
    GROUP BY operation_type
    ORDER BY operation_count DESC
  ) t;
  
  -- 最近の重要な操作
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'operation_type', operation_type,
      'table_name', table_name,
      'risk_level', risk_level,
      'created_at', created_at,
      'row_count', row_count
    )
  ) INTO recent_critical
  FROM (
    SELECT id, operation_type, table_name, risk_level, created_at, row_count
    FROM service_role_audit
    WHERE is_service_role = TRUE
    AND risk_level IN ('high', 'critical')
    AND created_at BETWEEN start_date AND end_date
    ORDER BY created_at DESC
    LIMIT 10
  ) t;
  
  -- 結果を構築
  result := jsonb_build_object(
    'period', jsonb_build_object(
      'start_date', start_date,
      'end_date', end_date
    ),
    'summary', jsonb_build_object(
      'total_operations', total_operations,
      'high_risk_operations', high_risk_operations,
      'risk_percentage', CASE 
        WHEN total_operations > 0 THEN ROUND((high_risk_operations::DECIMAL / total_operations * 100), 2)
        ELSE 0 
      END
    ),
    'operations_by_table', COALESCE(operations_by_table, '{}'::jsonb),
    'operations_by_type', COALESCE(operations_by_type, '{}'::jsonb),
    'recent_critical_operations', COALESCE(recent_critical, '[]'::jsonb)
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Service Role制限関数（緊急時用）
CREATE OR REPLACE FUNCTION restrict_service_role_operations(
  table_names TEXT[] DEFAULT NULL,
  operation_types TEXT[] DEFAULT NULL,
  enable_restriction BOOLEAN DEFAULT TRUE
)
RETURNS BOOLEAN AS $$
DECLARE
  restriction_record RECORD;
BEGIN
  -- 管理者のみ実行可能
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only administrators can modify service role restrictions';
  END IF;
  
  -- 制限設定テーブルが存在しない場合は作成
  CREATE TABLE IF NOT EXISTS service_role_restrictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT,
    operation_type TEXT,
    is_restricted BOOLEAN DEFAULT TRUE,
    restricted_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  -- 制限の有効化/無効化
  IF table_names IS NOT NULL THEN
    FOREACH restriction_record.table_name IN ARRAY table_names
    LOOP
      INSERT INTO service_role_restrictions (table_name, operation_type, is_restricted, restricted_by)
      VALUES (restriction_record.table_name, NULL, enable_restriction, auth.uid())
      ON CONFLICT (table_name, operation_type) DO UPDATE SET
        is_restricted = enable_restriction,
        updated_at = NOW();
    END LOOP;
  END IF;
  
  -- ログ記録
  INSERT INTO service_role_audit (
    operation_type,
    is_service_role,
    risk_level,
    additional_data
  ) VALUES (
    'RESTRICTION_CHANGE',
    FALSE,
    'medium',
    jsonb_build_object(
      'action', CASE WHEN enable_restriction THEN 'enable' ELSE 'disable' END,
      'tables', table_names,
      'operations', operation_types,
      'administrator', auth.uid()
    )
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Service Role異常検出関数
CREATE OR REPLACE FUNCTION detect_service_role_anomalies()
RETURNS JSONB AS $$
DECLARE
  anomalies JSONB := '[]'::jsonb;
  suspicious_activity RECORD;
  hourly_threshold INTEGER := 100; -- 1時間あたりの操作閾値
  bulk_operation_threshold INTEGER := 50; -- 一括操作の閾値
BEGIN
  -- 管理者のみ実行可能
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only administrators can detect service role anomalies';
  END IF;
  
  -- 1時間以内の大量操作を検出
  FOR suspicious_activity IN
    SELECT 
      date_trunc('hour', created_at) as hour_bucket,
      COUNT(*) as operation_count,
      array_agg(DISTINCT table_name) as affected_tables,
      array_agg(DISTINCT operation_type) as operation_types
    FROM service_role_audit
    WHERE is_service_role = TRUE
    AND created_at > NOW() - INTERVAL '24 hours'
    GROUP BY date_trunc('hour', created_at)
    HAVING COUNT(*) > hourly_threshold
    ORDER BY operation_count DESC
  LOOP
    anomalies := anomalies || jsonb_build_object(
      'type', 'high_volume_operations',
      'severity', 'medium',
      'hour', suspicious_activity.hour_bucket,
      'operation_count', suspicious_activity.operation_count,
      'affected_tables', suspicious_activity.affected_tables,
      'operation_types', suspicious_activity.operation_types,
      'threshold_exceeded', suspicious_activity.operation_count - hourly_threshold
    );
  END LOOP;
  
  -- 一括削除操作を検出
  FOR suspicious_activity IN
    SELECT 
      table_name,
      COUNT(*) as delete_count,
      MAX(created_at) as last_operation
    FROM service_role_audit
    WHERE is_service_role = TRUE
    AND operation_type = 'DELETE'
    AND created_at > NOW() - INTERVAL '1 hour'
    GROUP BY table_name
    HAVING COUNT(*) > 10
  LOOP
    anomalies := anomalies || jsonb_build_object(
      'type', 'bulk_delete_operations',
      'severity', 'high',
      'table_name', suspicious_activity.table_name,
      'delete_count', suspicious_activity.delete_count,
      'last_operation', suspicious_activity.last_operation
    );
  END LOOP;
  
  -- 権限系テーブルへの操作を検出
  FOR suspicious_activity IN
    SELECT 
      table_name,
      operation_type,
      COUNT(*) as operation_count,
      MAX(created_at) as last_operation
    FROM service_role_audit
    WHERE is_service_role = TRUE
    AND table_name IN ('app_users', 'role_change_audit', 'organization_members')
    AND created_at > NOW() - INTERVAL '1 hour'
    GROUP BY table_name, operation_type
    HAVING COUNT(*) > 5
  LOOP
    anomalies := anomalies || jsonb_build_object(
      'type', 'privilege_table_access',
      'severity', 'critical',
      'table_name', suspicious_activity.table_name,
      'operation_type', suspicious_activity.operation_type,
      'operation_count', suspicious_activity.operation_count,
      'last_operation', suspicious_activity.last_operation
    );
  END LOOP;
  
  RETURN jsonb_build_object(
    'scan_time', NOW(),
    'anomaly_count', jsonb_array_length(anomalies),
    'anomalies', anomalies
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 定期クリーンアップ関数（古い監査ログの削除）
CREATE OR REPLACE FUNCTION cleanup_service_role_audit(
  retention_days INTEGER DEFAULT 90
)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- 管理者のみ実行可能
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only administrators can cleanup audit logs';
  END IF;
  
  -- 古いレコードを削除
  DELETE FROM service_role_audit
  WHERE created_at < NOW() - (retention_days || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- クリーンアップログを記録
  INSERT INTO service_role_audit (
    operation_type,
    is_service_role,
    risk_level,
    row_count,
    additional_data
  ) VALUES (
    'CLEANUP',
    FALSE,
    'low',
    deleted_count,
    jsonb_build_object(
      'action', 'audit_log_cleanup',
      'retention_days', retention_days,
      'deleted_records', deleted_count,
      'administrator', auth.uid()
    )
  );
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 完了メッセージ
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== Service Role監査システム実装完了 ===';
  RAISE NOTICE '1. service_role_audit テーブル作成';
  RAISE NOTICE '2. Service Role検出トリガーを重要テーブルに設定';
  RAISE NOTICE '3. 使用統計取得関数 get_service_role_usage_stats()';
  RAISE NOTICE '4. 異常検出関数 detect_service_role_anomalies()';
  RAISE NOTICE '5. 制限機能 restrict_service_role_operations()';
  RAISE NOTICE '6. クリーンアップ関数 cleanup_service_role_audit()';
  RAISE NOTICE '';
  RAISE NOTICE '使用例:';
  RAISE NOTICE '- SELECT get_service_role_usage_stats();';
  RAISE NOTICE '- SELECT detect_service_role_anomalies();';
  RAISE NOTICE '';
  RAISE NOTICE '次のステップ: 監査ログ機密情報フィルタリングの実装';
END $$;