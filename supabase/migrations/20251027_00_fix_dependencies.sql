-- 依存関係修正とデータクリーンアップ
-- 実行順序: 他のマイグレーションより先に実行する

-- 1. 既存のapp_usersテーブルの無効なロールを修正
DO $$
DECLARE
  invalid_count INTEGER;
BEGIN
  -- 無効なロールをチェック
  SELECT COUNT(*) INTO invalid_count
  FROM app_users 
  WHERE role NOT IN ('admin', 'partner', 'user', 'owner');
  
  IF invalid_count > 0 THEN
    RAISE NOTICE '無効なロールが % 件見つかりました。修正します。', invalid_count;
    
    -- 無効なロールを 'user' に変更
    UPDATE app_users 
    SET role = 'user' 
    WHERE role NOT IN ('admin', 'partner', 'user', 'owner');
    
    RAISE NOTICE '% 件のロールを "user" に修正しました。', invalid_count;
  ELSE
    RAISE NOTICE 'すべてのロールが有効です。';
  END IF;
END $$;

-- 2. posts テーブルで参照している不明なカラムを確認
DO $$
BEGIN
  -- posts テーブルに org_id カラムが存在するかチェック
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'posts' 
    AND column_name = 'org_id'
    AND table_schema = 'public'
  ) THEN
    RAISE NOTICE 'posts テーブルに org_id カラムが存在しません。';
    
    -- organization_id カラムが存在する場合は、それを org_id として使用
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'posts' 
      AND column_name = 'organization_id'
      AND table_schema = 'public'
    ) THEN
      RAISE NOTICE 'organization_id カラムを org_id にリネームします。';
      ALTER TABLE posts RENAME COLUMN organization_id TO org_id;
    ELSE
      RAISE NOTICE 'posts テーブルに organization 関連のカラムが存在しません。';
    END IF;
  ELSE
    RAISE NOTICE 'posts テーブルの org_id カラムは既に存在します。';
  END IF;
END $$;

-- 3. organizations テーブルの構造を確認
DO $$
BEGIN
  -- organizations テーブルに created_by カラムが存在するかチェック
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'organizations' 
    AND column_name = 'created_by'
    AND table_schema = 'public'
  ) THEN
    RAISE NOTICE 'organizations テーブルに created_by カラムが存在しません。';
    
    -- owner_user_id カラムが存在する場合は、それを created_by として使用
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'organizations' 
      AND column_name = 'owner_user_id'
      AND table_schema = 'public'
    ) THEN
      RAISE NOTICE 'owner_user_id カラムを created_by にリネームします。';
      ALTER TABLE organizations RENAME COLUMN owner_user_id TO created_by;
    ELSE
      RAISE NOTICE 'organizations テーブルに created_by カラムを追加します。';
      ALTER TABLE organizations ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;
  ELSE
    RAISE NOTICE 'organizations テーブルの created_by カラムは既に存在します。';
  END IF;
END $$;

-- 4. 必要なヘルパー関数が存在しない場合の仮実装
CREATE OR REPLACE FUNCTION is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  -- 仮実装: app_users テーブルからロールをチェック
  RETURN EXISTS (
    SELECT 1 FROM app_users 
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 完了ログ
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== 依存関係修正完了 ===';
  RAISE NOTICE '1. app_users の無効なロールを修正';
  RAISE NOTICE '2. posts テーブルの org_id カラムを確認/修正';
  RAISE NOTICE '3. organizations テーブルの created_by カラムを確認/修正';
  RAISE NOTICE '4. 基本的なヘルパー関数を実装';
  RAISE NOTICE '';
  RAISE NOTICE '次のステップ: 他のマイグレーションを順次実行してください';
END $$;