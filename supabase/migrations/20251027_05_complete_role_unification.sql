-- Complete role management unification (Part 2)
-- This script builds upon the basic functions created in 20251027_04_create_essential_functions.sql
-- It implements triggers, audit tables, policy updates, and metadata cleanup

-- Ensure app_users table has all necessary constraints
ALTER TABLE app_users DROP CONSTRAINT IF EXISTS app_users_role_check;
ALTER TABLE app_users ADD CONSTRAINT app_users_role_check 
CHECK (role IN ('admin', 'partner', 'user', 'owner'));

-- Create index for faster role lookups
CREATE INDEX IF NOT EXISTS idx_app_users_role ON app_users(role);
CREATE INDEX IF NOT EXISTS idx_app_users_email ON app_users(email);

-- Create function to check if user has any of the specified roles
DROP FUNCTION IF EXISTS has_any_role(TEXT[], UUID);
CREATE OR REPLACE FUNCTION has_any_role(roles TEXT[], user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_role(user_id) = ANY(roles);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to safely update user role (admin only)
DROP FUNCTION IF EXISTS update_user_role(UUID, TEXT);
CREATE OR REPLACE FUNCTION update_user_role(target_user_id UUID, new_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Only admins can update roles
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only administrators can update user roles';
  END IF;
  
  -- Validate role
  IF new_role NOT IN ('admin', 'partner', 'user', 'owner') THEN
    RAISE EXCEPTION 'Invalid role: %', new_role;
  END IF;
  
  -- Update role in app_users table
  UPDATE app_users 
  SET role = new_role, updated_at = NOW()
  WHERE id = target_user_id;
  
  -- Clear any conflicting role in auth.users metadata (if exists)
  -- This ensures app_users is the single source of truth
  UPDATE auth.users 
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) - 'role'
  WHERE id = target_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to sync user data between auth.users and app_users
DROP FUNCTION IF EXISTS sync_user_data();
CREATE OR REPLACE FUNCTION sync_user_data()
RETURNS TRIGGER AS $$
BEGIN
  -- On user creation in auth.users, ensure they exist in app_users
  INSERT INTO app_users (id, email, role, created_at, updated_at)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    NEW.created_at,
    NEW.updated_at
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
  
  -- Clear role from auth metadata to avoid confusion
  NEW.raw_user_meta_data = COALESCE(NEW.raw_user_meta_data, '{}'::jsonb) - 'role';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to sync user data
DROP TRIGGER IF EXISTS trigger_sync_user_data ON auth.users;
CREATE TRIGGER trigger_sync_user_data
  BEFORE INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_data();

-- Update all existing RLS policies to use unified role functions

-- Organizations policies update
DROP POLICY IF EXISTS "organizations_admin_all" ON organizations;
CREATE POLICY "organizations_admin_all" ON organizations
  FOR ALL USING (is_admin());

-- Services policies update  
DROP POLICY IF EXISTS "services_admin_all" ON services;
CREATE POLICY "services_admin_all" ON services
  FOR ALL USING (is_admin());

-- Case studies policies update
DROP POLICY IF EXISTS "case_studies_admin_all" ON case_studies;
CREATE POLICY "case_studies_admin_all" ON case_studies
  FOR ALL USING (is_admin());

-- FAQs policies update
DROP POLICY IF EXISTS "faqs_admin_all" ON faqs;
CREATE POLICY "faqs_admin_all" ON faqs
  FOR ALL USING (is_admin());

-- Posts policies update
DROP POLICY IF EXISTS "posts_admin_all" ON posts;
CREATE POLICY "posts_admin_all" ON posts
  FOR ALL USING (is_admin());

-- Organization members policies update
DROP POLICY IF EXISTS "admin_full_access_members" ON organization_members;
CREATE POLICY "admin_full_access_members" ON organization_members
  FOR ALL USING (is_admin());

-- Partner organizations policies update
DROP POLICY IF EXISTS "admin_full_access_partner_assignments" ON partner_organizations;
CREATE POLICY "admin_full_access_partner_assignments" ON partner_organizations
  FOR ALL USING (is_admin());

-- Create function to get user access summary
DROP FUNCTION IF EXISTS get_user_access_summary(UUID);
CREATE OR REPLACE FUNCTION get_user_access_summary(user_id UUID DEFAULT auth.uid())
RETURNS JSONB AS $$
DECLARE
  user_role TEXT;
  owned_orgs UUID[];
  member_orgs UUID[];
  partner_orgs UUID[];
  result JSONB;
BEGIN
  -- Get user role
  user_role := get_user_role(user_id);
  
  -- Get owned organizations
  SELECT ARRAY_AGG(id) INTO owned_orgs
  FROM organizations 
  WHERE created_by = user_id;
  
  -- Get member organizations
  SELECT ARRAY_AGG(organization_id) INTO member_orgs
  FROM organization_members 
  WHERE organization_members.user_id = get_user_access_summary.user_id;
  
  -- Get partner organizations
  SELECT ARRAY_AGG(organization_id) INTO partner_orgs
  FROM partner_organizations 
  WHERE partner_user_id = user_id AND is_active = TRUE
  AND (expires_at IS NULL OR expires_at > NOW());
  
  -- Build result
  result := jsonb_build_object(
    'user_id', user_id,
    'role', user_role,
    'owned_organizations', COALESCE(owned_orgs, ARRAY[]::UUID[]),
    'member_organizations', COALESCE(member_orgs, ARRAY[]::UUID[]),
    'partner_organizations', COALESCE(partner_orgs, ARRAY[]::UUID[]),
    'is_admin', user_role = 'admin',
    'is_partner', user_role = 'partner',
    'is_owner', user_role = 'owner'
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to validate user permissions for organization
DROP FUNCTION IF EXISTS validate_org_access(UUID, TEXT, UUID);
CREATE OR REPLACE FUNCTION validate_org_access(org_id UUID, required_permission TEXT DEFAULT 'read', user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  user_role := get_user_role(user_id);
  
  -- Admin has all access
  IF user_role = 'admin' THEN
    RETURN TRUE;
  END IF;
  
  -- Check organization ownership
  IF EXISTS (SELECT 1 FROM organizations WHERE id = org_id AND created_by = user_id) THEN
    RETURN TRUE;
  END IF;
  
  -- Check organization membership
  IF required_permission IN ('read', 'write') AND EXISTS (
    SELECT 1 FROM organization_members 
    WHERE organization_id = org_id AND organization_members.user_id = user_id
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Check partner access
  IF required_permission = 'read' AND EXISTS (
    SELECT 1 FROM partner_organizations 
    WHERE organization_id = org_id AND partner_user_id = user_id
    AND is_active = TRUE AND (expires_at IS NULL OR expires_at > NOW())
  ) THEN
    RETURN TRUE;
  END IF;
  
  IF required_permission = 'write' AND EXISTS (
    SELECT 1 FROM partner_organizations 
    WHERE organization_id = org_id AND partner_user_id = user_id
    AND is_active = TRUE AND (expires_at IS NULL OR expires_at > NOW())
    AND access_level IN ('write', 'admin')
  ) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit log for role changes
CREATE TABLE IF NOT EXISTS role_change_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id UUID NOT NULL REFERENCES auth.users(id),
  changed_by UUID NOT NULL REFERENCES auth.users(id),
  old_role TEXT,
  new_role TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on role change audit
ALTER TABLE role_change_audit ENABLE ROW LEVEL SECURITY;

-- Only admins can view role change audit
CREATE POLICY "admin_view_role_audit" ON role_change_audit
  FOR SELECT USING (is_admin());

-- Create trigger to log role changes
DROP FUNCTION IF EXISTS log_role_change();
CREATE OR REPLACE FUNCTION log_role_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Log role changes in app_users table
  IF TG_OP = 'UPDATE' AND OLD.role != NEW.role THEN
    INSERT INTO role_change_audit (target_user_id, changed_by, old_role, new_role)
    VALUES (NEW.id, auth.uid(), OLD.role, NEW.role);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_log_role_change ON app_users;
CREATE TRIGGER trigger_log_role_change
  AFTER UPDATE ON app_users
  FOR EACH ROW
  EXECUTE FUNCTION log_role_change();

-- Clean up any existing role inconsistencies
-- Move any roles from auth.users metadata to app_users table
DO $$
DECLARE
  user_record RECORD;
  meta_role TEXT;
BEGIN
  FOR user_record IN 
    SELECT id, email, raw_user_meta_data
    FROM auth.users 
    WHERE raw_user_meta_data ? 'role'
  LOOP
    meta_role := user_record.raw_user_meta_data->>'role';
    
    -- Update app_users with the role from metadata
    INSERT INTO app_users (id, email, role, created_at, updated_at)
    VALUES (user_record.id, user_record.email, meta_role, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      role = CASE 
        WHEN app_users.role = 'user' THEN meta_role 
        ELSE app_users.role 
      END,
      updated_at = NOW();
    
    -- Clear the role from metadata
    UPDATE auth.users 
    SET raw_user_meta_data = raw_user_meta_data - 'role'
    WHERE id = user_record.id;
  END LOOP;
END $$;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== ロール管理システム統合完了 ===';
  RAISE NOTICE '1. 基本関数が既に作成済み (get_user_role, is_admin, is_partner, is_owner)';
  RAISE NOTICE '2. 追加関数を作成 (has_any_role, update_user_role, validate_org_access)';
  RAISE NOTICE '3. 監査テーブルとトリガーを設定';
  RAISE NOTICE '4. RLSポリシーを統合関数で更新';
  RAISE NOTICE '5. auth.usersメタデータのクリーンアップ完了';
  RAISE NOTICE '';
  RAISE NOTICE '次のステップ: Service Role使用量監査の実装';
END $$;