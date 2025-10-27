-- 既存の関数を完全にクリーンアップ
-- PostgreSQL の関数オーバーロードの問題を解決

-- すべての is_admin 関数のバリエーションを削除
DO $$
BEGIN
  -- パラメータなしの関数
  DROP FUNCTION IF EXISTS is_admin();
  -- UUID パラメータ付きの関数
  DROP FUNCTION IF EXISTS is_admin(UUID);
  -- その他のバリエーション
  DROP FUNCTION IF EXISTS is_admin(user_id UUID);
  
  RAISE NOTICE 'is_admin 関数のクリーンアップ完了';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'is_admin 関数のクリーンアップ中にエラー: %', SQLERRM;
END $$;

-- 他の関数も同様にクリーンアップ
DO $$
BEGIN
  DROP FUNCTION IF EXISTS get_user_role();
  DROP FUNCTION IF EXISTS get_user_role(UUID);
  DROP FUNCTION IF EXISTS is_partner();
  DROP FUNCTION IF EXISTS is_partner(UUID);
  DROP FUNCTION IF EXISTS is_owner();
  DROP FUNCTION IF EXISTS is_owner(UUID);
  DROP FUNCTION IF EXISTS has_any_role(TEXT[], UUID);
  DROP FUNCTION IF EXISTS update_user_role(UUID, TEXT);
  DROP FUNCTION IF EXISTS sync_user_data();
  DROP FUNCTION IF EXISTS get_user_access_summary(UUID);
  DROP FUNCTION IF EXISTS validate_org_access(UUID, TEXT, UUID);
  DROP FUNCTION IF EXISTS log_role_change();
  
  RAISE NOTICE '全ての関数のクリーンアップ完了';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '関数クリーンアップ中にエラー: %', SQLERRM;
END $$;

-- 簡単な確認
DO $$
DECLARE
  func_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO func_count 
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' 
  AND p.proname IN ('is_admin', 'get_user_role', 'is_partner', 'is_owner');
  
  RAISE NOTICE '残っている関数数: %', func_count;
END $$;

-- 完了メッセージ
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== 関数クリーンアップ完了 ===';
  RAISE NOTICE '次のステップ: 20251027_unify_role_management.sql を再実行してください';
END $$;