-- ========================================
-- 商用レベル統合版: 完全版DBトリガー + RLS
-- ========================================
-- 目的: auth.users → app_users 自動同期（email含む）+ 商用レベルRLSポリシー

-- 1. app_usersテーブル存在確認（冪等性対応）
-- 既存テーブルがない場合のみ作成
CREATE TABLE IF NOT EXISTS public.app_users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  role text not null default 'org_owner',
  partner_id uuid references public.partners(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 2. プロフィール自動作成トリガー関数（商用レベル版）
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- auth.usersに新規ユーザー作成時、app_usersに自動挿入
  INSERT INTO public.app_users (id, email, role, created_at, updated_at)
  VALUES (
    NEW.id, 
    NEW.email, 
    'org_owner',  -- デフォルトロール
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = NEW.email,
    updated_at = NOW();
  
  -- ログ出力（デバッグ用）
  RAISE LOG 'Auto-created app_user profile for user_id: %, email: %', NEW.id, NEW.email;
  
  RETURN NEW;
END;
$$;

-- 3. 既存トリガーの安全な削除・再作成
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. RLSポリシー設定（商用レベルセキュリティ）
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

-- 既存ポリシーの安全な削除
DROP POLICY IF EXISTS "Users can view own profile" ON public.app_users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.app_users;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.app_users;

-- ユーザーは自分のプロフィールのみ参照可能
CREATE POLICY "Users can view own profile"
  ON public.app_users
  FOR SELECT
  USING (auth.uid() = id);

-- ユーザーは自分のプロフィールのみ更新可能
CREATE POLICY "Users can update own profile" 
  ON public.app_users
  FOR UPDATE
  USING (auth.uid() = id);

-- サービスロールは全アクセス可（トリガー実行・管理用）
CREATE POLICY "Service role can manage all profiles"
  ON public.app_users
  FOR ALL
  USING (auth.role() = 'service_role');

-- 5. インデックス作成（パフォーマンス最適化）
CREATE INDEX IF NOT EXISTS app_users_email_idx ON public.app_users(email);
CREATE INDEX IF NOT EXISTS app_users_role_idx ON public.app_users(role);
CREATE INDEX IF NOT EXISTS app_users_partner_id_idx ON public.app_users(partner_id);
CREATE INDEX IF NOT EXISTS app_users_created_at_idx ON public.app_users(created_at);

-- 6. 確認用クエリ（実行後に以下をコメントアウト解除して検証）

-- トリガー存在確認
-- SELECT tgname, tgrelid::regclass, tgfoid::regproc 
-- FROM pg_trigger 
-- WHERE tgname = 'on_auth_user_created';
-- 期待結果: 1件

-- RLSポリシー確認
-- SELECT schemaname, tablename, policyname, roles, cmd 
-- FROM pg_policies 
-- WHERE tablename = 'app_users';
-- 期待結果: 3件のポリシー

-- テーブル構造確認
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'app_users'
-- ORDER BY ordinal_position;

-- 7. テスト用サンプル（実行しない - 参考用）
-- テスト実行時は以下をコメントアウト解除
-- INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at)
-- VALUES (gen_random_uuid(), 'test@example.com', NOW(), NOW(), NOW());
-- 
-- SELECT au.id, au.email, au.role, au.created_at
-- FROM auth.users u
-- JOIN app_users au ON u.id = au.id
-- WHERE u.email = 'test@example.com';

-- ========================================
-- 完了メッセージ
-- ========================================
DO $$
BEGIN
  RAISE NOTICE '商用レベルDBトリガー設定完了:';
  RAISE NOTICE '- プロフィール自動作成トリガー: on_auth_user_created';
  RAISE NOTICE '- RLSポリシー: 3件作成';
  RAISE NOTICE '- インデックス: 4件作成';
  RAISE NOTICE '- 上記確認クエリを実行して動作検証してください';
END $$;