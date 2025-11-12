-- AIOHub Database Security Hardening
-- 監査ログ、RLS強化、関数権限の実装

-- ====================================
-- 1. 監査ログ機能
-- ====================================

-- 監査ログテーブル作成
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id BIGSERIAL PRIMARY KEY,
    table_name TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    row_data JSONB,
    old_data JSONB,
    changed_fields TEXT[],
    user_id UUID,
    user_email TEXT,
    session_id TEXT,
    ip_address INET,
    user_agent TEXT,
    api_endpoint TEXT,
    request_method TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- パフォーマンス用インデックス
    CONSTRAINT valid_action CHECK (action IN ('INSERT', 'UPDATE', 'DELETE'))
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_action ON audit_logs(table_name, action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_address ON audit_logs(ip_address);

-- 監査ログの自動削除（90日経過後）
CREATE TABLE IF NOT EXISTS public.audit_log_retention (
    table_name TEXT PRIMARY KEY,
    retention_days INTEGER DEFAULT 90,
    last_cleanup TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 監査ログクリーンアップ関数
CREATE OR REPLACE FUNCTION cleanup_audit_logs()
RETURNS INTEGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
    deleted_count INTEGER := 0;
    cleanup_date TIMESTAMP WITH TIME ZONE;
BEGIN
    -- 90日より古い監査ログを削除
    cleanup_date := NOW() - INTERVAL '90 days';
    
    DELETE FROM audit_logs 
    WHERE created_at < cleanup_date;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- クリーンアップ記録を更新
    UPDATE audit_log_retention 
    SET last_cleanup = NOW()
    WHERE table_name = 'audit_logs';
    
    RETURN deleted_count;
END;
$$;

-- 監査ログ関数（汎用）
CREATE OR REPLACE FUNCTION log_audit_event(
    p_table_name TEXT,
    p_action TEXT,
    p_row_data JSONB DEFAULT NULL,
    p_old_data JSONB DEFAULT NULL,
    p_changed_fields TEXT[] DEFAULT NULL
)
RETURNS VOID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
    current_user_id UUID;
    current_user_email TEXT;
    current_session TEXT;
BEGIN
    -- 現在のユーザー情報を取得
    SELECT auth.uid() INTO current_user_id;
    SELECT auth.email() INTO current_user_email;
    SELECT current_setting('app.session_id', true) INTO current_session;
    
    -- 監査ログに記録
    INSERT INTO audit_logs (
        table_name,
        action,
        row_data,
        old_data,
        changed_fields,
        user_id,
        user_email,
        session_id,
        ip_address,
        user_agent,
        api_endpoint,
        request_method
    ) VALUES (
        p_table_name,
        p_action,
        p_row_data,
        p_old_data,
        p_changed_fields,
        current_user_id,
        current_user_email,
        current_session,
        COALESCE(current_setting('request.headers', true)::jsonb->>'x-real-ip', '127.0.0.1')::inet,
        current_setting('request.headers', true)::jsonb->>'user-agent',
        current_setting('request.path', true),
        current_setting('request.method', true)
    );
EXCEPTION
    WHEN OTHERS THEN
        -- エラーをログに記録するが、メイン処理は続行
        RAISE WARNING 'Failed to log audit event: %', SQLERRM;
END;
$$;

-- ====================================
-- 2. RLS（Row Level Security）強化
-- ====================================

-- profiles テーブルのRLS強化
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除して新しいポリシーを作成
DROP POLICY IF EXISTS "profiles_read_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_admin_all" ON profiles;

-- プロフィール読み取りポリシー（本人または管理者）
CREATE POLICY "profiles_read_policy" ON profiles
    FOR SELECT USING (
        auth.uid() = id 
        OR 
        EXISTS (
            SELECT 1 FROM profiles admin_profile 
            WHERE admin_profile.id = auth.uid() 
            AND admin_profile.role = 'admin'
        )
    );

-- プロフィール更新ポリシー（本人のみ、管理者は除外）
CREATE POLICY "profiles_update_policy" ON profiles
    FOR UPDATE USING (
        auth.uid() = id 
        AND 
        NOT EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    )
    WITH CHECK (auth.uid() = id);

-- プロフィール挿入ポリシー（認証済みユーザーは自分のプロフィールのみ作成可能）
CREATE POLICY "profiles_insert_policy" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- organizations テーブルのRLS強化
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "organizations_read" ON organizations;
DROP POLICY IF EXISTS "organizations_admin" ON organizations;

-- 組織の読み取りポリシー
CREATE POLICY "organizations_read_policy" ON organizations
    FOR SELECT USING (
        -- 組織メンバーまたは管理者
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid()
            AND (
                profiles.organization_id = organizations.id
                OR profiles.role = 'admin'
            )
        )
        OR
        -- パブリック組織の場合
        is_published = true
    );

-- 組織の更新ポリシー（組織オーナーまたは管理者）
CREATE POLICY "organizations_update_policy" ON organizations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid()
            AND (
                (profiles.organization_id = organizations.id AND profiles.role = 'owner')
                OR profiles.role = 'admin'
            )
        )
    );

-- 組織の挿入ポリシー（認証済みユーザー）
CREATE POLICY "organizations_insert_policy" ON organizations
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- billing_checkout_links テーブルのRLS（管理者専用）
ALTER TABLE billing_checkout_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "billing_links_admin_only" ON billing_checkout_links
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- qa_entries テーブルのRLS強化
ALTER TABLE qa_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "qa_entries_read" ON qa_entries;
DROP POLICY IF EXISTS "qa_entries_update" ON qa_entries;

-- QAエントリ読み取りポリシー
CREATE POLICY "qa_entries_read_policy" ON qa_entries
    FOR SELECT USING (
        -- 組織メンバー、管理者、またはパブリック
        EXISTS (
            SELECT 1 FROM organizations org
            JOIN profiles p ON p.organization_id = org.id
            WHERE qa_entries.organization_id = org.id
            AND (
                p.id = auth.uid()
                OR p.role = 'admin'
                OR org.is_published = true
            )
        )
    );

-- QAエントリ更新ポリシー（組織メンバーまたは管理者）
CREATE POLICY "qa_entries_update_policy" ON qa_entries
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid()
            AND (
                profiles.organization_id = qa_entries.organization_id
                OR profiles.role = 'admin'
            )
        )
    );

-- ====================================
-- 3. セキュリティ関数の作成
-- ====================================

-- IPホワイトリスト検証関数
CREATE OR REPLACE FUNCTION is_ip_whitelisted(
    ip_address INET,
    whitelist TEXT[] DEFAULT NULL
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
    -- ホワイトリストが空の場合は全て許可
    IF whitelist IS NULL OR array_length(whitelist, 1) IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- IPアドレスがホワイトリストに含まれているかチェック
    RETURN EXISTS (
        SELECT 1 FROM unnest(whitelist) AS allowed_ip
        WHERE ip_address <<= allowed_ip::cidr
    );
END;
$$;

-- API レート制限チェック関数
CREATE OR REPLACE FUNCTION check_rate_limit(
    identifier TEXT,
    max_requests INTEGER DEFAULT 100,
    time_window_seconds INTEGER DEFAULT 3600
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
    current_count INTEGER;
    window_start TIMESTAMP WITH TIME ZONE;
BEGIN
    window_start := NOW() - (time_window_seconds || ' seconds')::interval;
    
    -- 現在の時間枠でのリクエスト数を取得
    SELECT COUNT(*) INTO current_count
    FROM audit_logs
    WHERE user_email = identifier
    AND created_at >= window_start;
    
    -- レート制限チェック
    RETURN current_count < max_requests;
END;
$$;

-- 機密データマスキング関数
CREATE OR REPLACE FUNCTION mask_sensitive_data(
    data_text TEXT,
    mask_type TEXT DEFAULT 'email'
)
RETURNS TEXT
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
    CASE mask_type
        WHEN 'email' THEN
            -- email@example.com -> e***@example.com
            RETURN regexp_replace(data_text, '^(.)[^@]*(@.+)$', '\1***\2');
        WHEN 'phone' THEN
            -- 090-1234-5678 -> 090-****-5678
            RETURN regexp_replace(data_text, '^(.{3})-.{4}-(.{4})$', '\1-****-\2');
        WHEN 'credit_card' THEN
            -- 4111-1111-1111-1111 -> 4111-****-****-1111
            RETURN regexp_replace(data_text, '^(.{4})-\d{4}-\d{4}-(.{4})$', '\1-****-****-\2');
        ELSE
            -- デフォルトマスキング（最初と最後の2文字以外を*）
            RETURN CASE 
                WHEN length(data_text) <= 4 THEN '****'
                ELSE substring(data_text, 1, 2) || repeat('*', length(data_text) - 4) || substring(data_text, length(data_text) - 1)
            END;
    END CASE;
END;
$$;

-- ====================================
-- 4. セキュリティトリガー
-- ====================================

-- 組織変更の監査ログトリガー
CREATE OR REPLACE FUNCTION audit_organizations_changes()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM log_audit_event('organizations', 'INSERT', to_jsonb(NEW), NULL, NULL);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM log_audit_event(
            'organizations', 
            'UPDATE', 
            to_jsonb(NEW), 
            to_jsonb(OLD),
            array_agg(key) FROM jsonb_each(to_jsonb(NEW)) WHERE to_jsonb(NEW)->key != to_jsonb(OLD)->key
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM log_audit_event('organizations', 'DELETE', NULL, to_jsonb(OLD), NULL);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

-- プロフィール変更の監査ログトリガー
CREATE OR REPLACE FUNCTION audit_profiles_changes()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM log_audit_event('profiles', 'INSERT', to_jsonb(NEW), NULL, NULL);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM log_audit_event(
            'profiles', 
            'UPDATE', 
            to_jsonb(NEW), 
            to_jsonb(OLD),
            array_agg(key) FROM jsonb_each(to_jsonb(NEW)) WHERE to_jsonb(NEW)->key != to_jsonb(OLD)->key
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM log_audit_event('profiles', 'DELETE', NULL, to_jsonb(OLD), NULL);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

-- トリガー作成
DROP TRIGGER IF EXISTS audit_organizations_trigger ON organizations;
CREATE TRIGGER audit_organizations_trigger
    AFTER INSERT OR UPDATE OR DELETE ON organizations
    FOR EACH ROW EXECUTE FUNCTION audit_organizations_changes();

DROP TRIGGER IF EXISTS audit_profiles_trigger ON profiles;
CREATE TRIGGER audit_profiles_trigger
    AFTER INSERT OR UPDATE OR DELETE ON profiles
    FOR EACH ROW EXECUTE FUNCTION audit_profiles_changes();

-- ====================================
-- 5. 権限設定
-- ====================================

-- サービスロールユーザーに監査ログの読み書き権限を付与
GRANT SELECT, INSERT ON audit_logs TO service_role;
GRANT SELECT, UPDATE ON audit_log_retention TO service_role;
GRANT EXECUTE ON FUNCTION log_audit_event TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_audit_logs TO service_role;

-- 認証ユーザーには制限された権限のみ
GRANT SELECT ON audit_logs TO authenticated;
GRANT EXECUTE ON FUNCTION is_ip_whitelisted TO authenticated;
GRANT EXECUTE ON FUNCTION check_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION mask_sensitive_data TO authenticated;

-- 匿名ユーザーには権限なし（デフォルト）
REVOKE ALL ON audit_logs FROM anon;
REVOKE ALL ON audit_log_retention FROM anon;

-- ====================================
-- 6. セキュリティビュー
-- ====================================

-- 管理者用セキュリティダッシュボードビュー
CREATE OR REPLACE VIEW admin_security_dashboard AS
SELECT 
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as events_24h,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as events_7d,
    COUNT(DISTINCT user_id) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as unique_users_24h,
    COUNT(DISTINCT ip_address) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as unique_ips_24h,
    table_name,
    action,
    COUNT(*) as event_count
FROM audit_logs
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY table_name, action
ORDER BY event_count DESC;

-- 権限エラーのアクセス管理
GRANT SELECT ON admin_security_dashboard TO service_role;

-- 管理者のみアクセス可能なポリシーを設定
ALTER VIEW admin_security_dashboard SET (security_invoker = on);

-- ====================================
-- 7. 初期データ投入
-- ====================================

-- 監査ログ保持設定の初期データ
INSERT INTO audit_log_retention (table_name, retention_days) VALUES
    ('audit_logs', 90),
    ('organizations', 365),
    ('profiles', 365),
    ('billing_checkout_links', 1825) -- 5年
ON CONFLICT (table_name) DO NOTHING;

-- ====================================
-- 8. セキュリティ設定の確認
-- ====================================

-- RLS有効化確認
DO $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('profiles', 'organizations', 'billing_checkout_links', 'qa_entries')
    LOOP
        -- RLSが有効化されているかチェック
        IF NOT EXISTS (
            SELECT 1 FROM pg_class 
            WHERE relname = table_record.tablename 
            AND relrowsecurity = true
        ) THEN
            RAISE WARNING 'RLS not enabled for table: %', table_record.tablename;
        ELSE
            RAISE NOTICE 'RLS enabled for table: %', table_record.tablename;
        END IF;
    END LOOP;
END;
$$;

-- ====================================
-- COMMENT追加（ドキュメント化）
-- ====================================

COMMENT ON TABLE audit_logs IS 'セキュリティ監査ログ - 全てのデータ変更を記録';
COMMENT ON FUNCTION log_audit_event IS '監査ログ記録関数 - データ変更時に自動呼び出し';
COMMENT ON FUNCTION cleanup_audit_logs IS '監査ログクリーンアップ関数 - 古いログを自動削除';
COMMENT ON FUNCTION is_ip_whitelisted IS 'IPホワイトリスト検証関数';
COMMENT ON FUNCTION check_rate_limit IS 'APIレート制限チェック関数';
COMMENT ON FUNCTION mask_sensitive_data IS '機密データマスキング関数';
COMMENT ON VIEW admin_security_dashboard IS '管理者用セキュリティダッシュボード';

-- 完了メッセージ
DO $$
BEGIN
    RAISE NOTICE '=== AIOHub Security Hardening Complete ===';
    RAISE NOTICE 'Applied: Audit logging, Enhanced RLS, Security functions';
    RAISE NOTICE 'Tables secured: profiles, organizations, billing_checkout_links, qa_entries';
    RAISE NOTICE 'Security functions created: 4';
    RAISE NOTICE 'Audit triggers created: 2';
    RAISE NOTICE 'Retention policy: 90 days for audit_logs';
END;
$$;