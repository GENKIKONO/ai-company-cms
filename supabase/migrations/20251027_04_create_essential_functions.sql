-- 必要な基本関数を先に作成
-- これにより他のマイグレーションファイルが参照する関数を確実に定義

-- 1. get_user_role 関数
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

-- 2. is_admin 関数
CREATE OR REPLACE FUNCTION is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_role(user_id) = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. is_partner 関数
CREATE OR REPLACE FUNCTION is_partner(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_role(user_id) = 'partner';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. is_owner 関数
CREATE OR REPLACE FUNCTION is_owner(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_role(user_id) = 'owner';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 完了メッセージ
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== 基本関数作成完了 ===';
  RAISE NOTICE '1. get_user_role() 関数を作成';
  RAISE NOTICE '2. is_admin() 関数を作成';
  RAISE NOTICE '3. is_partner() 関数を作成';
  RAISE NOTICE '4. is_owner() 関数を作成';
  RAISE NOTICE '';
  RAISE NOTICE '次のステップ: 20251027_unify_role_management.sql を再実行してください';
END $$;