-- 監査ログのセキュリティ強化と機密情報フィルタリング
-- 目的: 機密情報の漏洩防止と監査ログの安全な管理

-- 機密情報フィルタリング関数
CREATE OR REPLACE FUNCTION filter_sensitive_data(data JSONB)
RETURNS JSONB AS $$
DECLARE
  filtered_data JSONB;
  sensitive_fields TEXT[] := ARRAY[
    'password', 'password_hash', 'email', 'phone', 'phone_number', 
    'ssn', 'social_security_number', 'credit_card', 'card_number',
    'api_key', 'secret', 'token', 'auth_token', 'session_token',
    'private_key', 'access_token', 'refresh_token', 'raw_user_meta_data',
    'billing_address', 'address', 'birth_date', 'birthdate', 'dob'
  ];
  key TEXT;
BEGIN
  -- データが NULL の場合はそのまま返す
  IF data IS NULL THEN
    RETURN NULL;
  END IF;
  
  filtered_data := data;
  
  -- 機密フィールドをマスクまたは削除
  FOREACH key IN ARRAY sensitive_fields
  LOOP
    IF filtered_data ? key THEN
      -- 完全に削除するか、マスクする
      IF key IN ('password', 'password_hash', 'api_key', 'secret', 'token', 
                 'auth_token', 'session_token', 'private_key', 'access_token', 
                 'refresh_token') THEN
        -- 完全に削除
        filtered_data := filtered_data - key;
      ELSE
        -- 部分マスク
        filtered_data := jsonb_set(
          filtered_data, 
          ARRAY[key], 
          to_jsonb('[MASKED]'::TEXT),
          true
        );
      END IF;
    END IF;
  END LOOP;
  
  -- ネストされたオブジェクトも処理
  IF jsonb_typeof(filtered_data) = 'object' THEN
    FOR key IN SELECT jsonb_object_keys(filtered_data)
    LOOP
      IF jsonb_typeof(filtered_data->key) = 'object' THEN
        filtered_data := jsonb_set(
          filtered_data,
          ARRAY[key],
          filter_sensitive_data(filtered_data->key),
          true
        );
      END IF;
    END LOOP;
  END IF;
  
  RETURN filtered_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 安全な監査ログ作成関数
CREATE OR REPLACE FUNCTION create_secure_audit_log(
  p_table_name TEXT,
  p_operation TEXT,
  p_user_id UUID DEFAULT auth.uid(),
  p_user_role TEXT DEFAULT NULL,
  p_changed_data JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
  current_user_role TEXT;
  filtered_data JSONB;
  safe_metadata JSONB;
BEGIN
  -- ユーザーロールを取得（指定がない場合）
  IF p_user_role IS NULL THEN
    current_user_role := get_user_role(p_user_id);
  ELSE
    current_user_role := p_user_role;
  END IF;
  
  -- 機密データをフィルタリング
  filtered_data := filter_sensitive_data(p_changed_data);
  safe_metadata := filter_sensitive_data(p_metadata);
  
  -- IP アドレスや User-Agent などの安全なメタデータを追加
  safe_metadata := COALESCE(safe_metadata, '{}'::JSONB) || jsonb_build_object(
    'timestamp', NOW(),
    'session_id', COALESCE(
      current_setting('request.jwt.claims', true)::JSONB->>'sub',
      'unknown'
    ),
    'user_agent_hash', md5(COALESCE(
      current_setting('request.headers', true)::JSONB->>'user-agent',
      'unknown'
    ))
  );
  
  -- 監査ログを挿入
  INSERT INTO audit_logs (
    table_name,
    operation,
    user_id,
    user_role,
    changed_data,
    metadata,
    created_at
  ) VALUES (
    p_table_name,
    p_operation,
    p_user_id,
    current_user_role,
    filtered_data,
    safe_metadata,
    NOW()
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 既存の audit_logs テーブルを拡張
ALTER TABLE audit_logs 
ADD COLUMN IF NOT EXISTS metadata JSONB,
ADD COLUMN IF NOT EXISTS ip_address INET,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- timestamp を created_at にリネーム（既存データ保持）
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'audit_logs' 
    AND column_name = 'timestamp'
    AND table_schema = 'public'
  ) THEN
    -- 既存の timestamp データを created_at にコピー
    UPDATE audit_logs SET created_at = timestamp WHERE created_at IS NULL;
    -- timestamp カラムを削除
    ALTER TABLE audit_logs DROP COLUMN timestamp;
  END IF;
END $$;

-- 監査ログにインデックスを追加
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_operation ON audit_logs(table_name, operation);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_role ON audit_logs(user_role);

-- 監査ログの自動削除ポリシー（90日以上のログを削除）
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- 90日以上古いログを削除
  DELETE FROM audit_logs 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- クリーンアップログを記録
  INSERT INTO audit_logs (
    table_name,
    operation,
    user_id,
    user_role,
    changed_data,
    metadata
  ) VALUES (
    'audit_logs',
    'CLEANUP',
    '00000000-0000-0000-0000-000000000000'::UUID,
    'system',
    jsonb_build_object('deleted_count', deleted_count),
    jsonb_build_object(
      'cleanup_date', NOW(),
      'retention_days', 90
    )
  );
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 更新された監査ログ関数（セキュリティ強化版）
CREATE OR REPLACE FUNCTION log_secure_audit()
RETURNS TRIGGER AS $$
DECLARE
  operation_type TEXT;
  changed_data JSONB;
  old_data JSONB;
  new_data JSONB;
BEGIN
  -- 操作タイプを設定
  operation_type := TG_OP;
  
  -- 変更データを準備
  CASE TG_OP
    WHEN 'INSERT' THEN
      new_data := to_jsonb(NEW);
      changed_data := new_data;
    WHEN 'UPDATE' THEN
      old_data := to_jsonb(OLD);
      new_data := to_jsonb(NEW);
      -- 変更された項目のみを記録
      changed_data := jsonb_build_object(
        'before', old_data,
        'after', new_data,
        'changes', jsonb_diff(old_data, new_data)
      );
    WHEN 'DELETE' THEN
      old_data := to_jsonb(OLD);
      changed_data := old_data;
    ELSE
      changed_data := NULL;
  END CASE;
  
  -- 安全な監査ログを作成
  PERFORM create_secure_audit_log(
    TG_TABLE_NAME,
    operation_type,
    auth.uid(),
    auth.role(),
    changed_data,
    jsonb_build_object(
      'trigger_name', TG_NAME,
      'table_schema', TG_TABLE_SCHEMA,
      'when', TG_WHEN,
      'level', TG_LEVEL
    )
  );
  
  RETURN CASE TG_OP
    WHEN 'DELETE' THEN OLD
    ELSE NEW
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- JSONB の差分を計算するヘルパー関数
CREATE OR REPLACE FUNCTION jsonb_diff(old_data JSONB, new_data JSONB)
RETURNS JSONB AS $$
DECLARE
  result JSONB := '{}'::JSONB;
  key TEXT;
BEGIN
  -- 新しいデータのキーをチェック
  FOR key IN SELECT jsonb_object_keys(new_data)
  LOOP
    IF NOT (old_data ? key) OR old_data->key != new_data->key THEN
      result := result || jsonb_build_object(
        key, 
        jsonb_build_object(
          'old', old_data->key,
          'new', new_data->key
        )
      );
    END IF;
  END LOOP;
  
  -- 削除されたキーをチェック
  FOR key IN SELECT jsonb_object_keys(old_data)
  LOOP
    IF NOT (new_data ? key) THEN
      result := result || jsonb_build_object(
        key,
        jsonb_build_object(
          'old', old_data->key,
          'new', NULL
        )
      );
    END IF;
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 既存のトリガーを安全なバージョンに更新
DROP TRIGGER IF EXISTS trigger_audit_service_role_app_users ON app_users;
CREATE TRIGGER trigger_secure_audit_app_users
  AFTER INSERT OR UPDATE OR DELETE ON app_users
  FOR EACH ROW
  EXECUTE FUNCTION log_secure_audit();

-- 他の重要なテーブルにもセキュアな監査を適用
DROP TRIGGER IF EXISTS trigger_secure_audit_organizations ON organizations;
CREATE TRIGGER trigger_secure_audit_organizations
  AFTER INSERT OR UPDATE OR DELETE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION log_secure_audit();

DROP TRIGGER IF EXISTS trigger_secure_audit_organization_members ON organization_members;
CREATE TRIGGER trigger_secure_audit_organization_members
  AFTER INSERT OR UPDATE OR DELETE ON organization_members
  FOR EACH ROW
  EXECUTE FUNCTION log_secure_audit();

DROP TRIGGER IF EXISTS trigger_secure_audit_partner_organizations ON partner_organizations;
CREATE TRIGGER trigger_secure_audit_partner_organizations
  AFTER INSERT OR UPDATE OR DELETE ON partner_organizations
  FOR EACH ROW
  EXECUTE FUNCTION log_secure_audit();

DROP TRIGGER IF EXISTS trigger_secure_audit_role_changes ON role_change_audit;
CREATE TRIGGER trigger_secure_audit_role_changes
  AFTER INSERT OR UPDATE OR DELETE ON role_change_audit
  FOR EACH ROW
  EXECUTE FUNCTION log_secure_audit();

-- 監査ログ閲覧用の安全なビュー
CREATE OR REPLACE VIEW audit_logs_summary AS
SELECT 
  id,
  table_name,
  operation,
  user_id,
  user_role,
  -- 機密データを除外した概要のみ表示
  CASE 
    WHEN changed_data IS NOT NULL THEN 
      jsonb_build_object(
        'fields_changed', array_length(array(SELECT jsonb_object_keys(changed_data)), 1),
        'has_sensitive_data', (changed_data ? 'password' OR changed_data ? 'email' OR changed_data ? 'token')
      )
    ELSE NULL
  END AS change_summary,
  created_at
FROM audit_logs
WHERE 
  -- 管理者のみがアクセス可能
  is_admin() OR
  -- ユーザーは自分に関連するログのみ閲覧可能
  (user_id = auth.uid() AND operation NOT IN ('LOGIN', 'LOGOUT'));

-- RLS ポリシーの更新
DROP POLICY IF EXISTS "admin_view_audit_logs" ON audit_logs;
CREATE POLICY "admin_view_full_audit_logs" ON audit_logs
  FOR SELECT USING (is_admin());

-- ユーザーは自分の非機密ログのみ閲覧可能
CREATE POLICY "users_view_own_audit_logs" ON audit_logs
  FOR SELECT USING (
    user_id = auth.uid() 
    AND operation NOT IN ('LOGIN', 'LOGOUT', 'PASSWORD_CHANGE')
    AND table_name NOT IN ('audit_logs', 'role_change_audit')
  );

-- 定期的なクリーンアップのスケジュール設定用関数
CREATE OR REPLACE FUNCTION schedule_audit_cleanup()
RETURNS VOID AS $$
BEGIN
  -- pg_cron 拡張が利用可能な場合の設定例
  -- SELECT cron.schedule('audit-cleanup', '0 2 * * *', 'SELECT cleanup_old_audit_logs();');
  
  RAISE NOTICE '監査ログの定期クリーンアップが設定されました';
  RAISE NOTICE '手動実行: SELECT cleanup_old_audit_logs();';
END;
$$ LANGUAGE plpgsql;

-- 監査ログセキュリティ設定完了
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== 監査ログセキュリティ強化完了 ===';
  RAISE NOTICE '1. 機密情報フィルタリング機能を追加';
  RAISE NOTICE '2. 安全な監査ログ作成関数を実装';
  RAISE NOTICE '3. 自動クリーンアップ機能を追加（90日保持）';
  RAISE NOTICE '4. セキュアな監査トリガーを各テーブルに適用';
  RAISE NOTICE '5. RLS ポリシーを更新してアクセス制御を強化';
  RAISE NOTICE '6. 監査ログ概要ビューを作成';
  RAISE NOTICE '';
  RAISE NOTICE '運用時の推奨事項:';
  RAISE NOTICE '- 定期的に cleanup_old_audit_logs() を実行';
  RAISE NOTICE '- audit_logs_summary ビューで概要を確認';
  RAISE NOTICE '- 機密データの漏洩がないかを定期監査';
END $$;