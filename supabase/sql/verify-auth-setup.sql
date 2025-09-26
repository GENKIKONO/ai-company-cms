-- ========================================
-- 商用レベル認証システム設定検証SQL
-- ========================================
-- 用途: auth-trigger-setup.sql 実行後の包括的な確認
-- 実行場所: Supabase Dashboard → SQL Editor
-- 期待結果: 各セクションで想定通りの結果が得られること

-- ===========================================
-- 1. テーブル構造確認
-- ===========================================
-- app_usersテーブルの存在と列構成を確認

SELECT 'app_users テーブル構造確認' as check_category;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'app_users'
ORDER BY ordinal_position;

-- 期待結果: 6列 (id, email, role, partner_id, created_at, updated_at)
-- id: uuid, not null
-- email: text, not null  
-- role: text, not null, default 'org_owner'

-- ===========================================
-- 2. トリガー存在確認
-- ===========================================
-- プロフィール自動作成トリガーの確認

SELECT 'トリガー存在確認' as check_category;

SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    tgenabled as enabled,
    tgfoid::regproc as function_name
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- 期待結果: 1件
-- trigger_name: on_auth_user_created
-- table_name: auth.users
-- enabled: O (enabled)
-- function_name: handle_new_user()

-- ===========================================
-- 3. RLS設定確認
-- ===========================================
-- Row Level Security の有効化確認

SELECT 'RLS設定確認' as check_category;

SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'app_users';

-- 期待結果: rowsecurity = true

-- ===========================================
-- 4. RLSポリシー確認
-- ===========================================
-- 定義されたポリシーの確認

SELECT 'RLSポリシー一覧' as check_category;

SELECT 
    policyname,
    roles,
    cmd as command_type,
    qual as condition
FROM pg_policies 
WHERE tablename = 'app_users'
ORDER BY policyname;

-- 期待結果: 3件のポリシー
-- 1. "Service role can manage all profiles" - ALL - service_role
-- 2. "Users can update own profile" - UPDATE - 自分のIDのみ
-- 3. "Users can view own profile" - SELECT - 自分のIDのみ

-- ===========================================
-- 5. インデックス確認
-- ===========================================
-- パフォーマンス最適化用インデックスの確認

SELECT 'インデックス確認' as check_category;

SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'app_users'
ORDER BY indexname;

-- 期待結果: 5つ以上のインデックス
-- - app_users_pkey (PRIMARY KEY)
-- - app_users_email_idx
-- - app_users_role_idx  
-- - app_users_partner_id_idx
-- - app_users_created_at_idx

-- ===========================================
-- 6. 関数定義確認
-- ===========================================
-- handle_new_user() 関数の存在確認

SELECT '関数定義確認' as check_category;

SELECT 
    proname as function_name,
    pronargs as argument_count,
    prorettype::regtype as return_type,
    prosecdef as security_definer
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- 期待結果: 1件
-- function_name: handle_new_user
-- return_type: trigger
-- security_definer: true (SECURITY DEFINER)

-- ===========================================
-- 7. 外部キー制約確認
-- ===========================================
-- app_users.id → auth.users.id の参照制約

SELECT '外部キー制約確認' as check_category;

SELECT 
    conname as constraint_name,
    conrelid::regclass as table_name,
    confrelid::regclass as referenced_table,
    confdeltype as on_delete_action
FROM pg_constraint 
WHERE contype = 'f' 
  AND conrelid = 'public.app_users'::regclass;

-- 期待結果: 1-2件
-- app_users → auth.users (CASCADE)
-- app_users → partners (オプション)

-- ===========================================
-- 8. 権限確認
-- ===========================================
-- テーブルアクセス権限の確認

SELECT 'テーブル権限確認' as check_category;

SELECT 
    grantee,
    table_name,
    privilege_type
FROM information_schema.table_privileges 
WHERE table_name = 'app_users'
ORDER BY grantee, privilege_type;

-- 期待結果: 適切な権限設定
-- postgres (所有者): ALL
-- authenticated role: SELECT, UPDATE (RLS経由)

-- ===========================================
-- 9. 統合テスト（安全な範囲）
-- ===========================================
-- 実際のデータでテストしない、構造のみの確認

SELECT '統合テスト準備確認' as check_category;

-- auth.users テーブルアクセス可能性確認（件数のみ）
SELECT 
    'auth.users' as table_name,
    COUNT(*) as record_count
FROM auth.users;

-- app_users テーブルアクセス可能性確認（件数のみ）
SELECT 
    'app_users' as table_name,
    COUNT(*) as record_count  
FROM app_users;

-- JOIN可能性確認（件数のみ）
SELECT 
    'auth.users <-> app_users' as join_test,
    COUNT(*) as matched_records
FROM auth.users u
JOIN app_users au ON u.id = au.id;

-- ===========================================
-- 10. 設定値サマリー
-- ===========================================
-- 全体設定の要約

SELECT '設定サマリー' as check_category;

SELECT 
    'テーブル' as item,
    CASE WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='app_users') 
         THEN '✓ app_users存在' 
         ELSE '✗ app_users不存在' END as status
UNION ALL
SELECT 
    'トリガー' as item,
    CASE WHEN EXISTS(SELECT 1 FROM pg_trigger WHERE tgname='on_auth_user_created') 
         THEN '✓ on_auth_user_created存在' 
         ELSE '✗ トリガー不存在' END as status
UNION ALL
SELECT 
    'RLS' as item,
    CASE WHEN EXISTS(SELECT 1 FROM pg_tables WHERE tablename='app_users' AND rowsecurity=true) 
         THEN '✓ RLS有効' 
         ELSE '✗ RLS無効' END as status
UNION ALL
SELECT 
    'ポリシー' as item,
    CASE WHEN (SELECT COUNT(*) FROM pg_policies WHERE tablename='app_users') >= 3 
         THEN '✓ ポリシー3件以上' 
         ELSE '✗ ポリシー不足' END as status
UNION ALL
SELECT 
    'インデックス' as item,
    CASE WHEN (SELECT COUNT(*) FROM pg_indexes WHERE tablename='app_users') >= 5 
         THEN '✓ インデックス最適化済み' 
         ELSE '✗ インデックス不足' END as status;

-- ===========================================
-- 完了メッセージ
-- ===========================================

DO $$
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE '商用レベル認証システム設定検証完了';
  RAISE NOTICE '===========================================';
  RAISE NOTICE '✓ 上記の各セクションで期待結果と一致していれば設定完了';
  RAISE NOTICE '✓ 異常値がある場合は auth-trigger-setup.sql を再実行';
  RAISE NOTICE '✓ 次のステップ: Vercel環境変数設定とクリーンデプロイ';
  RAISE NOTICE '===========================================';
END $$;