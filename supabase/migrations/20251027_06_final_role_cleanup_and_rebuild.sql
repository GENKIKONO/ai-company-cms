-- 最終的なロール管理システム統合
-- 全ての関数を完全にクリーンアップして再構築

-- Step 1: 全ての関数を完全削除
DO $$
DECLARE
  func_record RECORD;
BEGIN
  RAISE NOTICE '=== 全ての関数を削除中 ===';
  
  -- 全ての関数バリエーションを削除
  FOR func_record IN 
    SELECT p.proname, n.nspname, pg_get_function_identity_arguments(p.oid) as args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.proname IN ('is_admin', 'get_user_role', 'is_partner', 'is_owner', 
                      'has_any_role', 'update_user_role', 'sync_user_data',
                      'get_user_access_summary', 'validate_org_access', 'log_role_change')
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS %I.%I(%s) CASCADE', 
                   func_record.nspname, func_record.proname, func_record.args);
    RAISE NOTICE '削除: %(%)', func_record.proname, func_record.args;
  END LOOP;
  
  RAISE NOTICE '全ての関数削除完了';
END $$;

-- Step 2: app_users テーブルの制約確認・修正
DO $$
BEGIN
  -- 制約を削除して再追加
  ALTER TABLE app_users DROP CONSTRAINT IF EXISTS app_users_role_check;
  
  -- 無効なロールがあれば修正
  UPDATE app_users SET role = 'user' WHERE role IS NULL OR role NOT IN ('admin', 'partner', 'user', 'owner');
  
  -- 制約を再追加
  ALTER TABLE app_users ADD CONSTRAINT app_users_role_check 
  CHECK (role IN ('admin', 'partner', 'user', 'owner'));
  
  -- デフォルト値設定
  ALTER TABLE app_users ALTER COLUMN role SET DEFAULT 'user';
  ALTER TABLE app_users ALTER COLUMN role SET NOT NULL;
  
  RAISE NOTICE 'app_users テーブル制約設定完了';
END $$;

-- Step 3: インデックス作成
CREATE INDEX IF NOT EXISTS idx_app_users_role ON app_users(role);
CREATE INDEX IF NOT EXISTS idx_app_users_email ON app_users(email);

-- Step 4: 基本関数を新規作成
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID DEFAULT auth.uid())
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Always get role from app_users table (single source of truth)
  SELECT role FROM app_users WHERE id = user_id INTO user_role;
  
  -- Default to 'user' if no role found
  RETURN COALESCE(user_role, 'user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_role(user_id) = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_partner(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_role(user_id) = 'partner';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_owner(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_role(user_id) = 'owner';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: 追加機能関数作成
CREATE OR REPLACE FUNCTION has_any_role(roles TEXT[], user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_role(user_id) = ANY(roles);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
  
  -- Clear any conflicting role in auth.users metadata
  UPDATE auth.users 
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) - 'role'
  WHERE id = target_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- Step 6: 監査システム構築
CREATE TABLE IF NOT EXISTS role_change_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id UUID NOT NULL REFERENCES auth.users(id),
  changed_by UUID NOT NULL REFERENCES auth.users(id),
  old_role TEXT,
  new_role TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS有効化
ALTER TABLE role_change_audit ENABLE ROW LEVEL SECURITY;

-- 管理者のみ閲覧可能
DROP POLICY IF EXISTS "admin_view_role_audit" ON role_change_audit;
CREATE POLICY "admin_view_role_audit" ON role_change_audit
  FOR SELECT USING (is_admin());

-- ロール変更ログ関数
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

-- トリガー作成
DROP TRIGGER IF EXISTS trigger_log_role_change ON app_users;
CREATE TRIGGER trigger_log_role_change
  AFTER UPDATE ON app_users
  FOR EACH ROW
  EXECUTE FUNCTION log_role_change();

-- Step 7: ユーザー同期関数とトリガー
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

DROP TRIGGER IF EXISTS trigger_sync_user_data ON auth.users;
CREATE TRIGGER trigger_sync_user_data
  BEFORE INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_data();

-- Step 8: RLSポリシーの更新
-- Organizations
DROP POLICY IF EXISTS "organizations_admin_all" ON organizations;
CREATE POLICY "organizations_admin_all" ON organizations
  FOR ALL USING (is_admin());

-- Services
DROP POLICY IF EXISTS "services_admin_all" ON services;
CREATE POLICY "services_admin_all" ON services
  FOR ALL USING (is_admin());

-- Case studies
DROP POLICY IF EXISTS "case_studies_admin_all" ON case_studies;
CREATE POLICY "case_studies_admin_all" ON case_studies
  FOR ALL USING (is_admin());

-- FAQs
DROP POLICY IF EXISTS "faqs_admin_all" ON faqs;
CREATE POLICY "faqs_admin_all" ON faqs
  FOR ALL USING (is_admin());

-- Posts
DROP POLICY IF EXISTS "posts_admin_all" ON posts;
CREATE POLICY "posts_admin_all" ON posts
  FOR ALL USING (is_admin());

-- Organization members
DROP POLICY IF EXISTS "admin_full_access_members" ON organization_members;
CREATE POLICY "admin_full_access_members" ON organization_members
  FOR ALL USING (is_admin());

-- Partner organizations
DROP POLICY IF EXISTS "admin_full_access_partner_assignments" ON partner_organizations;
CREATE POLICY "admin_full_access_partner_assignments" ON partner_organizations
  FOR ALL USING (is_admin());

-- Step 9: メタデータクリーンアップ
DO $$
DECLARE
  user_record RECORD;
  meta_role TEXT;
  cleanup_count INTEGER := 0;
BEGIN
  RAISE NOTICE 'auth.users メタデータクリーンアップ開始';
  
  FOR user_record IN 
    SELECT id, email, raw_user_meta_data
    FROM auth.users 
    WHERE raw_user_meta_data ? 'role'
  LOOP
    meta_role := user_record.raw_user_meta_data->>'role';
    cleanup_count := cleanup_count + 1;
    
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
  
  RAISE NOTICE 'メタデータクリーンアップ完了: % ユーザー処理', cleanup_count;
END $$;

-- Step 10: 最終確認と完了メッセージ
DO $$
DECLARE
  func_count INTEGER;
  user_count INTEGER;
  admin_count INTEGER;
  partner_count INTEGER;
  owner_count INTEGER;
BEGIN
  -- 関数数確認
  SELECT COUNT(*) INTO func_count 
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' 
  AND p.proname IN ('is_admin', 'get_user_role', 'is_partner', 'is_owner', 
                    'has_any_role', 'update_user_role', 'validate_org_access',
                    'get_user_access_summary', 'sync_user_data', 'log_role_change');
  
  -- ユーザー数確認
  SELECT COUNT(*) INTO user_count FROM app_users;
  SELECT COUNT(*) INTO admin_count FROM app_users WHERE role = 'admin';
  SELECT COUNT(*) INTO partner_count FROM app_users WHERE role = 'partner';
  SELECT COUNT(*) INTO owner_count FROM app_users WHERE role = 'owner';
  
  RAISE NOTICE '';
  RAISE NOTICE '=== ロール管理システム統合完了 ===';
  RAISE NOTICE '作成された関数数: %', func_count;
  RAISE NOTICE '総ユーザー数: %', user_count;
  RAISE NOTICE '- 管理者: %', admin_count;
  RAISE NOTICE '- パートナー: %', partner_count;
  RAISE NOTICE '- オーナー: %', owner_count;
  RAISE NOTICE '- 一般ユーザー: %', (user_count - admin_count - partner_count - owner_count);
  RAISE NOTICE '';
  RAISE NOTICE '実装完了機能:';
  RAISE NOTICE '1. 統一ロール管理システム';
  RAISE NOTICE '2. RLSポリシー統合';
  RAISE NOTICE '3. 監査ログシステム';
  RAISE NOTICE '4. ユーザー同期システム';
  RAISE NOTICE '5. アクセス権限検証システム';
  RAISE NOTICE '';
  RAISE NOTICE '次のステップ: Service Role使用量監査の実装';
END $$;