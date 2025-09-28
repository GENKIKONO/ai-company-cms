/**
 * RLSポリシー完全実装
 * 要件定義準拠: admin/partner/org_owner の権限分離完全対応
 */

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Enable read access for all users" ON organizations;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON organizations;
DROP POLICY IF EXISTS "Enable update for users based on created_by" ON organizations;
DROP POLICY IF EXISTS "Enable delete for users based on created_by" ON organizations;

-- サービス用ポリシー削除
DROP POLICY IF EXISTS "services_select_policy" ON services;
DROP POLICY IF EXISTS "services_insert_policy" ON services;
DROP POLICY IF EXISTS "services_update_policy" ON services;
DROP POLICY IF EXISTS "services_delete_policy" ON services;

-- ケーススタディ用ポリシー削除
DROP POLICY IF EXISTS "case_studies_select_policy" ON case_studies;
DROP POLICY IF EXISTS "case_studies_insert_policy" ON case_studies;
DROP POLICY IF EXISTS "case_studies_update_policy" ON case_studies;
DROP POLICY IF EXISTS "case_studies_delete_policy" ON case_studies;

-- FAQ用ポリシー削除
DROP POLICY IF EXISTS "faqs_select_policy" ON faqs;
DROP POLICY IF EXISTS "faqs_insert_policy" ON faqs;
DROP POLICY IF EXISTS "faqs_update_policy" ON faqs;
DROP POLICY IF EXISTS "faqs_delete_policy" ON faqs;

-- 既存のユーザー情報取得関数を更新
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT COALESCE(
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()),
    'user'
  ) INTO user_role;
  
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ユーザーの企業ID取得関数
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
DECLARE
  org_id UUID;
BEGIN
  SELECT id FROM organizations 
  WHERE created_by = auth.uid() 
  LIMIT 1 INTO org_id;
  
  RETURN org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 管理者判定関数
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_role() = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 企業オーナー判定関数
CREATE OR REPLACE FUNCTION is_organization_owner(org_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  owner_id UUID;
BEGIN
  SELECT created_by FROM organizations WHERE id = org_id INTO owner_id;
  RETURN owner_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- === ORGANIZATIONS テーブル RLS ===

-- admin: 全権限
CREATE POLICY "organizations_admin_select" ON organizations
FOR SELECT USING (is_admin());

CREATE POLICY "organizations_admin_insert" ON organizations
FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "organizations_admin_update" ON organizations
FOR UPDATE USING (is_admin());

CREATE POLICY "organizations_admin_delete" ON organizations
FOR DELETE USING (is_admin());

-- org_owner: 自社Orgのみ
CREATE POLICY "organizations_owner_select" ON organizations
FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "organizations_owner_insert" ON organizations
FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "organizations_owner_update" ON organizations
FOR UPDATE USING (created_by = auth.uid());

-- パブリック読み取り（公開済みのみ）
CREATE POLICY "organizations_public_select" ON organizations
FOR SELECT USING (
  status = 'published' AND is_published = true
);

-- === SERVICES テーブル RLS ===

-- admin: 全権限
CREATE POLICY "services_admin_select" ON services
FOR SELECT USING (is_admin());

CREATE POLICY "services_admin_insert" ON services
FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "services_admin_update" ON services
FOR UPDATE USING (is_admin());

CREATE POLICY "services_admin_delete" ON services
FOR DELETE USING (is_admin());

-- org_owner: 自社サービスのみ
CREATE POLICY "services_owner_select" ON services
FOR SELECT USING (
  organization_id IN (
    SELECT id FROM organizations WHERE created_by = auth.uid()
  )
);

CREATE POLICY "services_owner_insert" ON services
FOR INSERT WITH CHECK (
  organization_id IN (
    SELECT id FROM organizations WHERE created_by = auth.uid()
  )
);

CREATE POLICY "services_owner_update" ON services
FOR UPDATE USING (
  organization_id IN (
    SELECT id FROM organizations WHERE created_by = auth.uid()
  )
);

CREATE POLICY "services_owner_delete" ON services
FOR DELETE USING (
  organization_id IN (
    SELECT id FROM organizations WHERE created_by = auth.uid()
  )
);

-- パブリック読み取り（公開済み企業のサービスのみ）
CREATE POLICY "services_public_select" ON services
FOR SELECT USING (
  status = 'published' AND
  organization_id IN (
    SELECT id FROM organizations 
    WHERE status = 'published' AND is_published = true
  )
);

-- === CASE_STUDIES テーブル RLS ===

-- admin: 全権限
CREATE POLICY "case_studies_admin_select" ON case_studies
FOR SELECT USING (is_admin());

CREATE POLICY "case_studies_admin_insert" ON case_studies
FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "case_studies_admin_update" ON case_studies
FOR UPDATE USING (is_admin());

CREATE POLICY "case_studies_admin_delete" ON case_studies
FOR DELETE USING (is_admin());

-- org_owner: 自社事例のみ
CREATE POLICY "case_studies_owner_select" ON case_studies
FOR SELECT USING (
  organization_id IN (
    SELECT id FROM organizations WHERE created_by = auth.uid()
  )
);

CREATE POLICY "case_studies_owner_insert" ON case_studies
FOR INSERT WITH CHECK (
  organization_id IN (
    SELECT id FROM organizations WHERE created_by = auth.uid()
  )
);

CREATE POLICY "case_studies_owner_update" ON case_studies
FOR UPDATE USING (
  organization_id IN (
    SELECT id FROM organizations WHERE created_by = auth.uid()
  )
);

CREATE POLICY "case_studies_owner_delete" ON case_studies
FOR DELETE USING (
  organization_id IN (
    SELECT id FROM organizations WHERE created_by = auth.uid()
  )
);

-- パブリック読み取り（公開済み事例のみ）
CREATE POLICY "case_studies_public_select" ON case_studies
FOR SELECT USING (
  status = 'published' AND
  organization_id IN (
    SELECT id FROM organizations 
    WHERE status = 'published' AND is_published = true
  )
);

-- === FAQS テーブル RLS ===

-- admin: 全権限
CREATE POLICY "faqs_admin_select" ON faqs
FOR SELECT USING (is_admin());

CREATE POLICY "faqs_admin_insert" ON faqs
FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "faqs_admin_update" ON faqs
FOR UPDATE USING (is_admin());

CREATE POLICY "faqs_admin_delete" ON faqs
FOR DELETE USING (is_admin());

-- org_owner: 自社FAQのみ
CREATE POLICY "faqs_owner_select" ON faqs
FOR SELECT USING (
  organization_id IN (
    SELECT id FROM organizations WHERE created_by = auth.uid()
  )
);

CREATE POLICY "faqs_owner_insert" ON faqs
FOR INSERT WITH CHECK (
  organization_id IN (
    SELECT id FROM organizations WHERE created_by = auth.uid()
  )
);

CREATE POLICY "faqs_owner_update" ON faqs
FOR UPDATE USING (
  organization_id IN (
    SELECT id FROM organizations WHERE created_by = auth.uid()
  )
);

CREATE POLICY "faqs_owner_delete" ON faqs
FOR DELETE USING (
  organization_id IN (
    SELECT id FROM organizations WHERE created_by = auth.uid()
  )
);

-- パブリック読み取り（公開済みFAQのみ）
CREATE POLICY "faqs_public_select" ON faqs
FOR SELECT USING (
  status = 'published' AND
  organization_id IN (
    SELECT id FROM organizations 
    WHERE status = 'published' AND is_published = true
  )
);

-- === SITE_SETTINGS テーブル RLS (管理者専用) ===

-- 管理者のみ全権限
CREATE POLICY "site_settings_admin_select" ON site_settings
FOR SELECT USING (is_admin());

CREATE POLICY "site_settings_admin_insert" ON site_settings
FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "site_settings_admin_update" ON site_settings
FOR UPDATE USING (is_admin());

CREATE POLICY "site_settings_admin_delete" ON site_settings
FOR DELETE USING (is_admin());

-- パブリック読み取り（設定値の表示用）
CREATE POLICY "site_settings_public_select" ON site_settings
FOR SELECT USING (true);

-- === 監査ログ用のトリガー設定 ===

-- 監査ログテーブルが存在しない場合は作成
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES auth.users(id),
  entity TEXT NOT NULL,
  entity_id UUID,
  action TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  diff JSONB,
  ip_address INET,
  user_agent TEXT
);

-- 監査ログ関数
CREATE OR REPLACE FUNCTION log_audit()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    actor_user_id,
    entity,
    entity_id,
    action,
    diff
  ) VALUES (
    auth.uid(),
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE 
      WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
      WHEN TG_OP = 'INSERT' THEN to_jsonb(NEW)
      ELSE jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
    END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 監査トリガーの設定
DROP TRIGGER IF EXISTS organizations_audit_trigger ON organizations;
CREATE TRIGGER organizations_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON organizations
  FOR EACH ROW EXECUTE FUNCTION log_audit();

DROP TRIGGER IF EXISTS services_audit_trigger ON services;
CREATE TRIGGER services_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON services
  FOR EACH ROW EXECUTE FUNCTION log_audit();

DROP TRIGGER IF EXISTS case_studies_audit_trigger ON case_studies;
CREATE TRIGGER case_studies_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON case_studies
  FOR EACH ROW EXECUTE FUNCTION log_audit();

DROP TRIGGER IF EXISTS faqs_audit_trigger ON faqs;
CREATE TRIGGER faqs_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON faqs
  FOR EACH ROW EXECUTE FUNCTION log_audit();

-- RLS有効化
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 監査ログのRLS（管理者のみ閲覧可能）
CREATE POLICY "audit_logs_admin_select" ON audit_logs
FOR SELECT USING (is_admin());

-- コメント追加
COMMENT ON FUNCTION get_user_role() IS '認証ユーザーのロールを取得（admin/user）';
COMMENT ON FUNCTION get_user_organization_id() IS '認証ユーザーの企業IDを取得';
COMMENT ON FUNCTION is_admin() IS '管理者判定';
COMMENT ON FUNCTION is_organization_owner(UUID) IS '企業オーナー判定';
COMMENT ON FUNCTION log_audit() IS '監査ログ記録関数';

-- 完了メッセージ
DO $$
BEGIN
  RAISE NOTICE 'RLS Policy Complete Implementation: SUCCESS';
  RAISE NOTICE 'Functions: get_user_role, is_admin, is_organization_owner, log_audit';
  RAISE NOTICE 'Tables with RLS: organizations, services, case_studies, faqs, site_settings, audit_logs';
  RAISE NOTICE 'Audit triggers: Enabled for all main tables';
END
$$;