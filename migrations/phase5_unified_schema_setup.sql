-- ===================================================================
-- Phase 5 統合スキーマセットアップ SQL
-- Supabase Dashboard SQL Editor 用完全統合スクリプト
-- 
-- 目的: 
-- - user_organizations テーブル作成・設定
-- - activities テーブル作成・設定  
-- - テストユーザー関係データ挿入
-- - API テスト用データ準備
-- ===================================================================

-- トランザクション開始
BEGIN;

-- ===================================================================
-- 1. USER_ORGANIZATIONS テーブル作成・設定
-- ===================================================================

-- テーブル作成（冪等性保証）
CREATE TABLE IF NOT EXISTS user_organizations (
    -- 複合主キー
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- ユーザーの組織内役割
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    
    -- 招待・承認状態
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    
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

-- 既存ポリシー削除（冪等性保証）
DROP POLICY IF EXISTS "user_organizations_self_access" ON user_organizations;
DROP POLICY IF EXISTS "user_organizations_org_admin_access" ON user_organizations;
DROP POLICY IF EXISTS "user_organizations_system_admin_access" ON user_organizations;

-- RLSポリシー: ユーザーは自分のリレーションのみアクセス可能
CREATE POLICY "user_organizations_self_access" 
ON user_organizations FOR ALL 
TO authenticated
USING (user_id = auth.uid());

-- RLSポリシー: 組織管理者は組織のリレーションにアクセス可能
CREATE POLICY "user_organizations_org_admin_access"
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
CREATE POLICY "user_organizations_system_admin_access"
ON user_organizations FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users u
        WHERE u.id = auth.uid() 
        AND u.raw_app_meta_data->>'role' = 'admin'
    )
);

-- 更新時刻自動更新関数（冪等性保証）
CREATE OR REPLACE FUNCTION update_user_organizations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガー削除・再作成（冪等性保証）
DROP TRIGGER IF EXISTS user_organizations_updated_at_trigger ON user_organizations;
CREATE TRIGGER user_organizations_updated_at_trigger
    BEFORE UPDATE ON user_organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_user_organizations_updated_at();

-- 制約追加（冪等性保証）
ALTER TABLE user_organizations DROP CONSTRAINT IF EXISTS user_organizations_role_check;
ALTER TABLE user_organizations 
ADD CONSTRAINT user_organizations_role_check 
CHECK (role IN ('owner', 'admin', 'member', 'viewer', 'contractor', 'guest'));

ALTER TABLE user_organizations DROP CONSTRAINT IF EXISTS user_organizations_status_check;
ALTER TABLE user_organizations
ADD CONSTRAINT user_organizations_status_check
CHECK (status IN ('pending', 'active', 'suspended', 'removed'));

-- テーブルコメント
COMMENT ON TABLE user_organizations IS 'ユーザーと組織の関係を管理するテーブル';
COMMENT ON COLUMN user_organizations.role IS '組織内での役割: owner, admin, member, viewer, contractor, guest';
COMMENT ON COLUMN user_organizations.status IS '関係の状態: pending, active, suspended, removed';
COMMENT ON COLUMN user_organizations.permissions IS 'カスタム権限設定（JSON形式）';

-- ===================================================================
-- 2. ACTIVITIES テーブル作成・設定
-- ===================================================================

-- テーブル作成（冪等性保証）
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス作成（パフォーマンス最適化）
CREATE INDEX IF NOT EXISTS activities_organization_id_idx ON activities(organization_id);
CREATE INDEX IF NOT EXISTS activities_user_id_idx ON activities(user_id);
CREATE INDEX IF NOT EXISTS activities_created_at_idx ON activities(created_at DESC);
CREATE INDEX IF NOT EXISTS activities_action_idx ON activities(action);
CREATE INDEX IF NOT EXISTS activities_resource_type_idx ON activities(resource_type);

-- RLS有効化
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- 既存ポリシー削除（冪等性保証）
DROP POLICY IF EXISTS "activities_organization_access" ON activities;
DROP POLICY IF EXISTS "activities_system_admin_access" ON activities;

-- RLSポリシー: 組織メンバーは組織のアクティビティにアクセス可能
CREATE POLICY "activities_organization_access" 
ON activities FOR ALL TO authenticated
USING (
    organization_id IN (
        SELECT uo.organization_id 
        FROM user_organizations uo 
        WHERE uo.user_id = auth.uid()
    )
);

-- RLSポリシー: システム管理者は全アクセス可能
CREATE POLICY "activities_system_admin_access"
ON activities FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users u
        WHERE u.id = auth.uid() 
        AND u.raw_app_meta_data->>'role' = 'admin'
    )
);

-- 更新時刻自動更新関数（再利用可能）
CREATE OR REPLACE FUNCTION update_activities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガー削除・再作成（冪等性保証）
DROP TRIGGER IF EXISTS activities_updated_at_trigger ON activities;
CREATE TRIGGER activities_updated_at_trigger
    BEFORE UPDATE ON activities
    FOR EACH ROW
    EXECUTE FUNCTION update_activities_updated_at();

-- テーブルコメント
COMMENT ON TABLE activities IS 'システム内のユーザーアクティビティを記録するテーブル';
COMMENT ON COLUMN activities.action IS 'アクション種別: login, logout, create, update, delete, view など';
COMMENT ON COLUMN activities.resource_type IS 'リソース種別: user, organization, service, dashboard など';
COMMENT ON COLUMN activities.metadata IS '追加情報（JSON形式）';

-- ===================================================================
-- 3. テストデータ挿入
-- ===================================================================

-- テストユーザー・組織リレーション挿入
INSERT INTO user_organizations (user_id, organization_id, role, status, created_at) 
VALUES 
    -- メンバーユーザー
    ('7c78d789-0289-4e9f-b3ba-beeae4f3b27e', 'c53b7fae-1ae3-48f4-98c1-5c3217f9fbb3', 'member', 'active', NOW()),
    -- 管理者ユーザー
    ('64b23ce5-0304-4a80-8a91-c8a3c14ebce2', 'c53b7fae-1ae3-48f4-98c1-5c3217f9fbb3', 'admin', 'active', NOW())
ON CONFLICT (user_id, organization_id) DO UPDATE SET
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    updated_at = NOW();

-- テストアクティビティデータ挿入
INSERT INTO activities (organization_id, user_id, action, resource_type, resource_id, metadata, created_at) 
VALUES 
    -- メンバーユーザーのログイン
    ('c53b7fae-1ae3-48f4-98c1-5c3217f9fbb3', '7c78d789-0289-4e9f-b3ba-beeae4f3b27e', 'login', 'user', '7c78d789-0289-4e9f-b3ba-beeae4f3b27e', 
     '{"browser": "test", "source": "api_test", "ip": "127.0.0.1"}', NOW() - INTERVAL '1 hour'),
     
    -- 管理者ユーザーのサービス作成
    ('c53b7fae-1ae3-48f4-98c1-5c3217f9fbb3', '64b23ce5-0304-4a80-8a91-c8a3c14ebce2', 'create', 'service', NULL, 
     '{"name": "テストサービス", "type": "API", "description": "Phase 5 テスト用"}', NOW() - INTERVAL '30 minutes'),
     
    -- メンバーユーザーのダッシュボード閲覧
    ('c53b7fae-1ae3-48f4-98c1-5c3217f9fbb3', '7c78d789-0289-4e9f-b3ba-beeae4f3b27e', 'view', 'dashboard', NULL, 
     '{"section": "stats", "duration_ms": 2340, "widgets": ["overview", "activities"]}', NOW() - INTERVAL '15 minutes'),
     
    -- 管理者ユーザーの設定更新
    ('c53b7fae-1ae3-48f4-98c1-5c3217f9fbb3', '64b23ce5-0304-4a80-8a91-c8a3c14ebce2', 'update', 'organization', 'c53b7fae-1ae3-48f4-98c1-5c3217f9fbb3', 
     '{"field": "settings", "changes": ["notification_enabled"], "old_value": false, "new_value": true}', NOW() - INTERVAL '10 minutes'),
     
    -- メンバーユーザーのプロファイル更新
    ('c53b7fae-1ae3-48f4-98c1-5c3217f9fbb3', '7c78d789-0289-4e9f-b3ba-beeae4f3b27e', 'update', 'user', '7c78d789-0289-4e9f-b3ba-beeae4f3b27e', 
     '{"field": "profile", "changes": ["avatar"], "timestamp": "2024-11-20T12:00:00Z"}', NOW() - INTERVAL '5 minutes')
     
ON CONFLICT (id) DO NOTHING;

-- トランザクション確定
COMMIT;

-- ===================================================================
-- 4. 設定確認・検証
-- ===================================================================

-- 作成されたテーブルの確認
SELECT 
    'user_organizations' as table_name,
    COUNT(*) as record_count,
    MIN(created_at) as earliest_record,
    MAX(created_at) as latest_record
FROM user_organizations
WHERE organization_id = 'c53b7fae-1ae3-48f4-98c1-5c3217f9fbb3'

UNION ALL

SELECT 
    'activities' as table_name,
    COUNT(*) as record_count,
    MIN(created_at) as earliest_record,
    MAX(created_at) as latest_record
FROM activities
WHERE organization_id = 'c53b7fae-1ae3-48f4-98c1-5c3217f9fbb3';

-- ユーザー・組織関係の詳細確認
SELECT 
    uo.user_id,
    uo.role,
    uo.status,
    uo.created_at,
    uo.updated_at,
    CASE 
        WHEN uo.user_id = '7c78d789-0289-4e9f-b3ba-beeae4f3b27e' THEN 'Test Member User'
        WHEN uo.user_id = '64b23ce5-0304-4a80-8a91-c8a3c14ebce2' THEN 'Test Admin User'
        ELSE 'Unknown User'
    END as user_description
FROM user_organizations uo
WHERE uo.organization_id = 'c53b7fae-1ae3-48f4-98c1-5c3217f9fbb3'
ORDER BY uo.role DESC, uo.created_at;

-- アクティビティの確認
SELECT 
    a.action,
    a.resource_type,
    a.created_at,
    a.metadata,
    CASE 
        WHEN a.user_id = '7c78d789-0289-4e9f-b3ba-beeae4f3b27e' THEN 'Member'
        WHEN a.user_id = '64b23ce5-0304-4a80-8a91-c8a3c14ebce2' THEN 'Admin'
        ELSE 'System'
    END as user_role
FROM activities a
WHERE a.organization_id = 'c53b7fae-1ae3-48f4-98c1-5c3217f9fbb3'
ORDER BY a.created_at DESC
LIMIT 10;

-- RLS ポリシー確認
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('user_organizations', 'activities')
ORDER BY tablename, policyname;

-- ===================================================================
-- 完了メッセージ
-- ===================================================================

SELECT 
    '🎉 Phase 5 統合スキーマセットアップ完了！' as status,
    'user_organizations & activities テーブル作成・RLS設定・テストデータ挿入完了' as description,
    'API テスト(/api/my/*, /api/dashboard/activities)の準備完了' as next_step;