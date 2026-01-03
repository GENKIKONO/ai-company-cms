-- ===================================================================
-- User Organizations テーブル作成マイグレーション  
-- 目的: ユーザーと組織の多対多リレーション管理
-- ===================================================================

-- テーブル作成（冪等性保証）
CREATE TABLE IF NOT EXISTS user_organizations (
    -- 複合主キー
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- ユーザーの組織内役割
    role VARCHAR(50) NOT NULL DEFAULT 'member', -- 'admin', 'member', 'viewer', 'owner' 等
    
    -- 招待・承認状態
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'pending', 'active', 'suspended', 'removed'
    
    -- 権限レベル（将来の拡張用）
    permissions JSONB DEFAULT '{}',
    
    -- タイムスタンプ
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 招待者情報（オプション）
    invited_by UUID REFERENCES auth.users(id),
    invited_at TIMESTAMPTZ,
    
    -- 主キー制約
    PRIMARY KEY (user_id, organization_id)
);

-- インデックス作成（パフォーマンス最適化）
CREATE INDEX IF NOT EXISTS user_organizations_user_id_idx ON user_organizations(user_id);
CREATE INDEX IF NOT EXISTS user_organizations_org_id_idx ON user_organizations(organization_id);
CREATE INDEX IF NOT EXISTS user_organizations_role_idx ON user_organizations(role);
CREATE INDEX IF NOT EXISTS user_organizations_status_idx ON user_organizations(status);

-- RLS (Row Level Security) 有効化
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;

-- RLSポリシー: ユーザーは自分のリレーションのみアクセス可能
CREATE POLICY IF NOT EXISTS "user_organizations_self_access" 
ON user_organizations FOR ALL 
TO authenticated
USING (user_id = auth.uid());

-- RLSポリシー: 組織管理者は組織のリレーションにアクセス可能
CREATE POLICY IF NOT EXISTS "user_organizations_org_admin_access"
ON user_organizations FOR ALL
TO authenticated
USING (
    organization_id IN (
        SELECT uo.organization_id 
        FROM user_organizations uo 
        WHERE uo.user_id = auth.uid() 
        AND uo.role IN ('admin', 'owner')
    )
);

-- RLSポリシー: システム管理者は全アクセス可能  
CREATE POLICY IF NOT EXISTS "user_organizations_system_admin_access"
ON user_organizations FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users u
        WHERE u.id = auth.uid() 
        AND u.raw_app_meta_data->>'role' = 'admin'
    )
);

-- 更新時刻自動更新トリガー
CREATE OR REPLACE FUNCTION update_user_organizations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS user_organizations_updated_at_trigger
    BEFORE UPDATE ON user_organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_user_organizations_updated_at();

-- 役割検証制約
ALTER TABLE user_organizations 
ADD CONSTRAINT IF NOT EXISTS user_organizations_role_check 
CHECK (role IN ('owner', 'admin', 'member', 'viewer', 'contractor', 'guest'));

-- ステータス検証制約  
ALTER TABLE user_organizations
ADD CONSTRAINT IF NOT EXISTS user_organizations_status_check
CHECK (status IN ('pending', 'active', 'suspended', 'removed'));

-- 組織あたり所有者は1人制約（将来実装時用）
-- CREATE UNIQUE INDEX IF NOT EXISTS user_organizations_single_owner_idx 
-- ON user_organizations(organization_id) WHERE role = 'owner';

-- コメント追加（ドキュメント）
COMMENT ON TABLE user_organizations IS 'ユーザーと組織の関係を管理するテーブル';
COMMENT ON COLUMN user_organizations.role IS '組織内での役割: owner, admin, member, viewer, contractor, guest';
COMMENT ON COLUMN user_organizations.status IS '関係の状態: pending, active, suspended, removed';
COMMENT ON COLUMN user_organizations.permissions IS 'カスタム権限設定（JSON形式）';

-- 初期データ挿入（テスト用） 
INSERT INTO user_organizations (user_id, organization_id, role, status) 
VALUES 
    ('7c78d789-0289-4e9f-b3ba-beeae4f3b27e', 'c53b7fae-1ae3-48f4-98c1-5c3217f9fbb3', 'member', 'active'),
    ('64b23ce5-0304-4a80-8a91-c8a3c14ebce2', 'c53b7fae-1ae3-48f4-98c1-5c3217f9fbb3', 'admin', 'active')
ON CONFLICT (user_id, organization_id) DO UPDATE SET
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    updated_at = NOW();

-- 完了メッセージ
SELECT 'User Organizations テーブル作成・初期データ投入完了！' as message;