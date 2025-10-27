-- app_users テーブルのロール制約違反を完全に修正

-- 1. 現在の無効なロールを確認
DO $$
DECLARE
  invalid_record RECORD;
  invalid_count INTEGER := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== app_users テーブルのロール確認 ===';
  
  -- 無効なロールのレコードを表示
  FOR invalid_record IN 
    SELECT id, email, role, created_at
    FROM app_users 
    WHERE role NOT IN ('admin', 'partner', 'user', 'owner')
    ORDER BY created_at DESC
    LIMIT 10
  LOOP
    invalid_count := invalid_count + 1;
    RAISE NOTICE '無効なロール発見: ID=%, Email=%, Role=%, Created=%', 
      invalid_record.id, 
      COALESCE(invalid_record.email, 'no-email'), 
      COALESCE(invalid_record.role, 'NULL'), 
      invalid_record.created_at;
  END LOOP;
  
  IF invalid_count = 0 THEN
    RAISE NOTICE 'すべてのロールが有効です。';
  ELSE
    RAISE NOTICE '合計 % 件の無効なロールが見つかりました。', invalid_count;
  END IF;
END $$;

-- 2. 制約を一時的に削除
ALTER TABLE app_users DROP CONSTRAINT IF EXISTS app_users_role_check;

-- 3. 無効なロールを修正
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- NULL ロールを 'user' に変更
  UPDATE app_users 
  SET role = 'user' 
  WHERE role IS NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  IF updated_count > 0 THEN
    RAISE NOTICE 'NULL ロールを % 件修正しました', updated_count;
  END IF;
  
  -- 無効なロールを 'user' に変更
  UPDATE app_users 
  SET role = 'user' 
  WHERE role NOT IN ('admin', 'partner', 'user', 'owner');
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  IF updated_count > 0 THEN
    RAISE NOTICE '無効なロールを % 件修正しました', updated_count;
  END IF;
END $$;

-- 4. デフォルト値を設定
ALTER TABLE app_users ALTER COLUMN role SET DEFAULT 'user';
ALTER TABLE app_users ALTER COLUMN role SET NOT NULL;

-- 5. 制約を再追加
ALTER TABLE app_users ADD CONSTRAINT app_users_role_check 
CHECK (role IN ('admin', 'partner', 'user', 'owner'));

-- 6. 修正後の確認
DO $$
DECLARE
  total_count INTEGER;
  admin_count INTEGER;
  partner_count INTEGER;
  user_count INTEGER;
  owner_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM app_users;
  SELECT COUNT(*) INTO admin_count FROM app_users WHERE role = 'admin';
  SELECT COUNT(*) INTO partner_count FROM app_users WHERE role = 'partner';
  SELECT COUNT(*) INTO user_count FROM app_users WHERE role = 'user';
  SELECT COUNT(*) INTO owner_count FROM app_users WHERE role = 'owner';
  
  RAISE NOTICE '';
  RAISE NOTICE '=== ロール分布確認 ===';
  RAISE NOTICE '総ユーザー数: %', total_count;
  RAISE NOTICE 'admin: % 件', admin_count;
  RAISE NOTICE 'partner: % 件', partner_count;
  RAISE NOTICE 'user: % 件', user_count;
  RAISE NOTICE 'owner: % 件', owner_count;
END $$;

-- 完了メッセージ
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== app_users ロール修正完了 ===';
  RAISE NOTICE '次のステップ: 20251027_unify_role_management.sql を再実行してください';
END $$;