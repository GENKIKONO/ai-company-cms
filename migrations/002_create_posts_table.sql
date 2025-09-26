-- T2.1: Posts テーブル作成 (記事/投稿機能)
-- 実行タイミング: T2実装開始時

-- UUID extension確認
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- postsテーブル作成（冪等）
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text, -- Markdown対応
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at timestamptz,
  created_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS posts_org_id_idx ON posts(org_id);
CREATE INDEX IF NOT EXISTS posts_status_idx ON posts(status);
CREATE INDEX IF NOT EXISTS posts_published_at_idx ON posts(published_at);
CREATE INDEX IF NOT EXISTS posts_created_by_idx ON posts(created_by);

-- RLS有効化
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- RLSポリシー: 所有者・同組織メンバーのみCRUD可能
CREATE POLICY IF NOT EXISTS "posts_owner_crud" ON posts
  FOR ALL USING (
    created_by = auth.uid() OR
    org_id IN (
      SELECT id FROM organizations 
      WHERE owner_user_id = auth.uid() OR 
      id IN (
        SELECT org_id FROM organization_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- RLSポリシー: 公開記事は誰でも読み取り可能
CREATE POLICY IF NOT EXISTS "posts_public_read" ON posts
  FOR SELECT USING (status = 'published');

-- RLSポリシー: admin全権
CREATE POLICY IF NOT EXISTS "posts_admin_all" ON posts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM app_users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- updated_at自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER IF NOT EXISTS update_posts_updated_at 
  BEFORE UPDATE ON posts 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 作成完了ログ
DO $$
BEGIN
  RAISE NOTICE 'Posts table migration completed successfully';
END $$;