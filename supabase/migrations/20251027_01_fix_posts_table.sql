-- Posts テーブルの構造修正
-- org_id カラムが存在しない問題を解決

-- 1. posts テーブルの現在の構造を確認し、必要に応じて修正
DO $$
DECLARE
  has_org_id BOOLEAN := FALSE;
  has_organization_id BOOLEAN := FALSE;
BEGIN
  -- org_id カラムの存在チェック
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'posts' 
    AND column_name = 'org_id'
    AND table_schema = 'public'
  ) INTO has_org_id;
  
  -- organization_id カラムの存在チェック
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'posts' 
    AND column_name = 'organization_id'
    AND table_schema = 'public'
  ) INTO has_organization_id;
  
  RAISE NOTICE 'Posts table structure check:';
  RAISE NOTICE '- org_id column exists: %', has_org_id;
  RAISE NOTICE '- organization_id column exists: %', has_organization_id;
  
  IF NOT has_org_id AND NOT has_organization_id THEN
    RAISE NOTICE 'Adding org_id column to posts table';
    ALTER TABLE posts ADD COLUMN org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS posts_org_id_idx ON posts(org_id);
  ELSIF has_organization_id AND NOT has_org_id THEN
    RAISE NOTICE 'Renaming organization_id to org_id';
    ALTER TABLE posts RENAME COLUMN organization_id TO org_id;
  ELSE
    RAISE NOTICE 'Posts table structure is correct';
  END IF;
END $$;

-- 2. posts テーブルの全カラムを表示（デバッグ用）
DO $$
DECLARE
  col_record RECORD;
BEGIN
  RAISE NOTICE 'Posts table columns:';
  FOR col_record IN 
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns 
    WHERE table_name = 'posts' 
    AND table_schema = 'public'
    ORDER BY ordinal_position
  LOOP
    RAISE NOTICE '- %: % (nullable: %, default: %)', 
      col_record.column_name, 
      col_record.data_type, 
      col_record.is_nullable, 
      COALESCE(col_record.column_default, 'none');
  END LOOP;
END $$;

-- 完了メッセージ
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== Posts テーブル構造修正完了 ===';
  RAISE NOTICE 'posts テーブルに org_id カラムが追加または確認されました';
  RAISE NOTICE '次のステップ: 20251027_fix_posts_rls_policy.sql を再実行してください';
END $$;