-- =====================================================
-- LuxuCare AI企業CMS テストユーザー作成スクリプト
-- 注意: production_setup.sql 実行後に手動で実行してください
-- =====================================================

-- テストユーザーのためのユーザーレコード作成
-- 注意: これらのユーザーは Supabase Auth UI または認証フローで事前に作成されている必要があります

-- 1. Admin ユーザー (admin@luxucare.com)
-- ユーザーID: 適切なUUIDに置き換えてください
INSERT INTO public.users (id, email, role, name) VALUES
('00000000-0000-0000-0000-000000000001', 'admin@luxucare.com', 'admin', 'システム管理者')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  name = EXCLUDED.name;

-- 2. Editor ユーザー (editor@luxucare.com)  
INSERT INTO public.users (id, email, role, name) VALUES
('00000000-0000-0000-0000-000000000002', 'editor@luxucare.com', 'editor', '編集者')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  name = EXCLUDED.name;

-- 3. Viewer ユーザー (viewer@luxucare.com)
INSERT INTO public.users (id, email, role, name) VALUES
('00000000-0000-0000-0000-000000000003', 'viewer@luxucare.com', 'viewer', '閲覧者')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  name = EXCLUDED.name;

-- =====================================================
-- 手動作業が必要:
-- 1. Supabase Auth で上記のメールアドレスでユーザーを作成
-- 2. 各ユーザーのUUIDを確認
-- 3. 上記のクエリのUUIDを実際のものに置き換えて実行
-- =====================================================