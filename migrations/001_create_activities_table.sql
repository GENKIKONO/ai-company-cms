-- ===================================================================
-- Activities テーブル作成マイグレーション
-- 目的: ユーザーアクティビティログ・ダッシュボード表示用
-- ===================================================================

-- テーブル作成（冪等性保証）
CREATE TABLE IF NOT EXISTS activities (
    -- 主キー
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 外部キー
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- アクティビティ詳細
    action VARCHAR(100) NOT NULL, -- 'create', 'update', 'delete', 'login', 'view' 等
    resource_type VARCHAR(50), -- 'service', 'faq', 'case_study', 'user', 'system' 等  
    resource_id UUID, -- 対象リソースのID
    
    -- メタデータ（JSON形式）
    metadata JSONB DEFAULT '{}',
    
    -- IP・ユーザーエージェント（セキュリティログ）
    ip_address INET,
    user_agent TEXT,
    
    -- タイムスタンプ
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス作成（パフォーマンス最適化）
CREATE INDEX IF NOT EXISTS activities_organization_id_idx ON activities(organization_id);
CREATE INDEX IF NOT EXISTS activities_user_id_idx ON activities(user_id);
CREATE INDEX IF NOT EXISTS activities_action_idx ON activities(action);
CREATE INDEX IF NOT EXISTS activities_created_at_idx ON activities(created_at DESC);
CREATE INDEX IF NOT EXISTS activities_resource_type_idx ON activities(resource_type);

-- 複合インデックス（ダッシュボードクエリ最適化）
CREATE INDEX IF NOT EXISTS activities_org_created_idx ON activities(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS activities_user_created_idx ON activities(user_id, created_at DESC);

-- RLS (Row Level Security) 有効化
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- RLSポリシー: 組織メンバーのみアクセス可能
CREATE POLICY IF NOT EXISTS "activities_organization_access" 
ON activities FOR ALL 
TO authenticated
USING (
    organization_id IN (
        SELECT uo.organization_id 
        FROM user_organizations uo 
        WHERE uo.user_id = auth.uid()
    )
);

-- RLSポリシー: 管理者は全アクセス可能
CREATE POLICY IF NOT EXISTS "activities_admin_access"
ON activities FOR ALL
TO authenticated  
USING (
    EXISTS (
        SELECT 1 FROM auth.users u
        WHERE u.id = auth.uid() 
        AND u.raw_app_meta_data->>'role' = 'admin'
    )
);

-- サンプルデータ挿入（テスト用）
INSERT INTO activities (organization_id, user_id, action, resource_type, resource_id, metadata) 
VALUES 
    ('c53b7fae-1ae3-48f4-98c1-5c3217f9fbb3', '7c78d789-0289-4e9f-b3ba-beeae4f3b27e', 'login', 'user', '7c78d789-0289-4e9f-b3ba-beeae4f3b27e', '{"browser": "test", "source": "api_test"}'),
    ('c53b7fae-1ae3-48f4-98c1-5c3217f9fbb3', '64b23ce5-0304-4a80-8a91-c8a3c14ebce2', 'create', 'service', null, '{"name": "テストサービス"}'),
    ('c53b7fae-1ae3-48f4-98c1-5c3217f9fbb3', '7c78d789-0289-4e9f-b3ba-beeae4f3b27e', 'view', 'dashboard', null, '{"section": "stats"}'),
    ('c53b7fae-1ae3-48f4-98c1-5c3217f9fbb3', '64b23ce5-0304-4a80-8a91-c8a3c14ebce2', 'update', 'organization', 'c53b7fae-1ae3-48f4-98c1-5c3217f9fbb3', '{"field": "description"}')
ON CONFLICT DO NOTHING;

-- 統計用ビュー作成（パフォーマンス向上）
CREATE OR REPLACE VIEW activity_summary AS
SELECT 
    organization_id,
    DATE(created_at) as activity_date,
    action,
    resource_type,
    COUNT(*) as count,
    COUNT(DISTINCT user_id) as unique_users
FROM activities
GROUP BY organization_id, DATE(created_at), action, resource_type;

-- コメント追加（ドキュメント）
COMMENT ON TABLE activities IS 'ユーザーアクティビティログテーブル - ダッシュボード表示・監査用';
COMMENT ON COLUMN activities.action IS 'アクション種別: create, update, delete, login, view, etc.';
COMMENT ON COLUMN activities.resource_type IS 'リソース種別: service, faq, case_study, user, system, etc.';
COMMENT ON COLUMN activities.metadata IS 'アクティビティの詳細情報（JSON形式）';

-- 完了メッセージ
SELECT 'Activities テーブル作成完了！' as message;