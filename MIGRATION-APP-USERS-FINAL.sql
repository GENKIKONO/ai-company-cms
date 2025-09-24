-- =========================================
-- P0 Migration: app_users Table Creation
-- 安全に再実行可能（IF NOT EXISTS 保護）
-- Supabase SQL Editor で実行
-- =========================================

-- D-1) app_users テーブル作成
CREATE TABLE IF NOT EXISTS public.app_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'org_owner',
  partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- updated_at 自動更新関数（既存なら再作成）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 既存トリガー削除＆再作成（安全）
DROP TRIGGER IF EXISTS update_app_users_updated_at ON public.app_users;
CREATE TRIGGER update_app_users_updated_at
  BEFORE UPDATE ON public.app_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security 有効化
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

-- 既存ポリシー削除（安全なクリーンアップ）
DROP POLICY IF EXISTS "Users can view own app_user record" ON public.app_users;
DROP POLICY IF EXISTS "Users can insert own app_user record" ON public.app_users;
DROP POLICY IF EXISTS "Users can update own app_user record" ON public.app_users;

-- RLS ポリシー作成
-- ユーザーは自分のレコードのみ閲覧可能
CREATE POLICY "Users can view own app_user record" ON public.app_users
  FOR SELECT USING (auth.uid() = id);

-- ユーザーは自分のレコードを作成可能（サインアップ時）
CREATE POLICY "Users can insert own app_user record" ON public.app_users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ユーザーは自分のレコードを更新可能（将来の機能用）
CREATE POLICY "Users can update own app_user record" ON public.app_users
  FOR UPDATE USING (auth.uid() = id);

-- パフォーマンス向上用インデックス
CREATE INDEX IF NOT EXISTS app_users_role_idx ON public.app_users(role);
CREATE INDEX IF NOT EXISTS app_users_partner_id_idx ON public.app_users(partner_id);

-- テーブル・カラムの説明
COMMENT ON TABLE public.app_users IS 'P0 minimal user management table. Stores user roles and partner associations for AIO Hub.';
COMMENT ON COLUMN public.app_users.role IS 'User role: org_owner (default), admin, or member';
COMMENT ON COLUMN public.app_users.partner_id IS 'Optional reference to partner organization';

-- D-2) 適用済み検知・検証クエリ
-- 以下を実行してRLS有効化とインデックス作成を確認
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as "RLS Enabled",
  hasindexes as "Has Indexes"
FROM pg_tables 
WHERE tablename = 'app_users' AND schemaname = 'public';

-- ポリシー確認
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'app_users' AND schemaname = 'public';

-- トリガー確認
SELECT trigger_name, event_manipulation, trigger_schema, trigger_table
FROM information_schema.triggers 
WHERE trigger_table = 'app_users';

-- =========================================
-- 期待される結果：
-- 
-- RLS Enabled = t (true)
-- Has Indexes = t (true)  
-- Policies = 3件（SELECT, INSERT, UPDATE）
-- Triggers = 1件（update_app_users_updated_at）
--
-- 既に適用済みの場合：
-- "already exists" 系のエラーが出ますが、
-- IF NOT EXISTS により安全にスキップされます。
-- =========================================