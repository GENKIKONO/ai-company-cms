-- Service Role 利用監査と最小化
-- 目的: セキュリティリスク軽減のため Service Role 利用を最小限に制限

-- 現在の RLS ポリシーで service_role を使用している箇所を特定
DO $$
DECLARE
  policy_record RECORD;
  table_record RECORD;
BEGIN
  RAISE NOTICE 'Service Role 利用箇所の監査を開始します';
  
  -- service_role を使用している RLS ポリシーを検索
  FOR policy_record IN 
    SELECT schemaname, tablename, policyname, cmd, qual 
    FROM pg_policies 
    WHERE qual LIKE '%service_role%' OR qual LIKE '%auth.role()%'
    ORDER BY schemaname, tablename, policyname
  LOOP
    RAISE NOTICE '発見: テーブル %.% - ポリシー % (%) - 条件: %', 
      policy_record.schemaname, policy_record.tablename, policy_record.policyname, 
      policy_record.cmd, policy_record.qual;
  END LOOP;
  
  -- RLS が有効なテーブル一覧を表示
  RAISE NOTICE '';
  RAISE NOTICE 'RLS 有効テーブル一覧:';
  FOR table_record IN
    SELECT schemaname, tablename, rowsecurity
    FROM pg_tables 
    WHERE schemaname = 'public' AND rowsecurity = true
    ORDER BY tablename
  LOOP
    RAISE NOTICE '- %.%', table_record.schemaname, table_record.tablename;
  END LOOP;
END $$;

-- app_users テーブルの service_role ポリシーを更新
-- トリガー実行専用に制限し、一般的な CRUD 操作は admin ロールに移行
DROP POLICY IF EXISTS "Service role can manage all profiles" ON app_users;

-- 更新されたポリシー: Service Role は INSERT のみ（トリガー用）
CREATE POLICY "service_role_insert_only" ON app_users
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Admin は完全なアクセス権を持つ
DROP POLICY IF EXISTS "admin_full_access_app_users" ON app_users;
CREATE POLICY "admin_full_access_app_users" ON app_users
  FOR ALL USING (is_admin());

-- ユーザー自身のプロフィールアクセス（既存のポリシーを確認・更新）
DROP POLICY IF EXISTS "Users can view own profile" ON app_users;
CREATE POLICY "users_view_own_profile" ON app_users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON app_users;  
CREATE POLICY "users_update_own_profile" ON app_users
  FOR UPDATE USING (auth.uid() = id);

-- Service Role の使用を監査するためのログ関数
CREATE OR REPLACE FUNCTION log_service_role_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Service Role を使用した操作をログに記録
  IF auth.role() = 'service_role' THEN
    INSERT INTO audit_logs (
      table_name, 
      operation, 
      user_id, 
      user_role,
      changed_data,
      timestamp
    ) VALUES (
      TG_TABLE_NAME,
      TG_OP,
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::UUID),
      'service_role',
      CASE 
        WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
        ELSE to_jsonb(NEW)
      END,
      NOW()
    );
  END IF;
  
  RETURN CASE TG_OP
    WHEN 'DELETE' THEN OLD
    ELSE NEW
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- audit_logs テーブルが存在しない場合は作成
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  user_id UUID,
  user_role TEXT,
  changed_data JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- audit_logs テーブルに RLS を適用
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Admin のみが監査ログを閲覧可能
CREATE POLICY "admin_view_audit_logs" ON audit_logs
  FOR SELECT USING (is_admin());

-- Service Role は監査ログの INSERT のみ可能
CREATE POLICY "service_role_insert_audit" ON audit_logs
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- app_users テーブルに Service Role 監査トリガーを追加
DROP TRIGGER IF EXISTS trigger_audit_service_role_app_users ON app_users;
CREATE TRIGGER trigger_audit_service_role_app_users
  AFTER INSERT OR UPDATE OR DELETE ON app_users
  FOR EACH ROW
  EXECUTE FUNCTION log_service_role_access();

-- Service Role 使用チェック関数
CREATE OR REPLACE FUNCTION check_service_role_necessity(
  operation TEXT,
  table_name TEXT,
  context TEXT DEFAULT ''
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Service Role が本当に必要かチェック
  -- トリガーからの呼び出し以外は警告を出す
  IF auth.role() = 'service_role' AND context != 'trigger' THEN
    RAISE WARNING 'Service Role 使用検出: % on % (context: %)', operation, table_name, context;
    
    -- 監査ログに記録
    INSERT INTO audit_logs (
      table_name, 
      operation, 
      user_id, 
      user_role,
      changed_data,
      timestamp
    ) VALUES (
      table_name,
      operation || '_service_role_check',
      auth.uid(),
      'service_role',
      jsonb_build_object('context', context, 'warning', 'unnecessary_service_role_usage'),
      NOW()
    );
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 既存の Service Role を使用している他のテーブルのポリシーを確認
-- organizations テーブル
DROP POLICY IF EXISTS "organizations_service_role" ON organizations;
-- Service Role ポリシーを削除し、admin ロールに統一

-- services テーブル  
DROP POLICY IF EXISTS "services_service_role" ON services;
-- Service Role ポリシーを削除し、admin ロールに統一

-- case_studies テーブル
DROP POLICY IF EXISTS "case_studies_service_role" ON case_studies;
-- Service Role ポリシーを削除し、admin ロールに統一

-- faqs テーブル
DROP POLICY IF EXISTS "faqs_service_role" ON faqs;
-- Service Role ポリシーを削除し、admin ロールに統一

-- posts テーブル
DROP POLICY IF EXISTS "posts_service_role" ON posts;
-- Service Role ポリシーを削除し、admin ロールに統一

-- organization_members テーブル
DROP POLICY IF EXISTS "organization_members_service_role" ON organization_members;
-- Service Role ポリシーを削除し、admin ロールに統一

-- partner_organizations テーブル
DROP POLICY IF EXISTS "partner_organizations_service_role" ON partner_organizations;
-- Service Role ポリシーを削除し、admin ロールに統一

-- Service Role 最小化完了メッセージ
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== Service Role 利用監査・最小化完了 ===';
  RAISE NOTICE '1. Service Role は app_users の INSERT（トリガー用）のみに制限';
  RAISE NOTICE '2. 他の操作は admin ロールまたはユーザー自身に移行';
  RAISE NOTICE '3. Service Role 使用時の監査ログ機能を追加';
  RAISE NOTICE '4. 既存の不要な Service Role ポリシーを削除';
  RAISE NOTICE '';
  RAISE NOTICE '今後の推奨事項:';
  RAISE NOTICE '- アプリケーションコードで service_role の使用箇所を確認';
  RAISE NOTICE '- 可能な限り admin ロールまたはユーザー認証に移行';
  RAISE NOTICE '- audit_logs テーブルで Service Role 使用を定期監査';
END $$;