/**
 * RLSポリシー冪等対応実装
 * エラーなし再実行可能 - if not exists 構文で安全性確保
 * 作成日: 2025/10/7
 */

-- === 安全な関数再作成 ===

-- ユーザーロール取得関数（冪等対応）
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT COALESCE(
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()),
    'user'
  ) INTO user_role;
  
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ユーザーの企業ID取得関数（冪等対応）
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
DECLARE
  org_id UUID;
BEGIN
  SELECT id FROM organizations 
  WHERE created_by = auth.uid() 
  LIMIT 1 INTO org_id;
  
  RETURN org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 管理者判定関数（冪等対応）
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_role() = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 企業オーナー判定関数（冪等対応）
CREATE OR REPLACE FUNCTION is_organization_owner(org_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  owner_id UUID;
BEGIN
  SELECT created_by FROM organizations WHERE id = org_id INTO owner_id;
  RETURN owner_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- === 冪等ポリシー作成マクロ ===

-- ポリシー存在チェック関数
CREATE OR REPLACE FUNCTION policy_exists(table_name text, policy_name text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = table_name 
    AND policyname = policy_name
  );
END;
$$ LANGUAGE plpgsql;

-- === ORGANIZATIONS テーブル RLS（冪等対応） ===

-- admin: 全権限
DO $$
BEGIN
  IF NOT policy_exists('organizations', 'organizations_admin_select') THEN
    CREATE POLICY "organizations_admin_select" ON organizations
    FOR SELECT USING (is_admin());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT policy_exists('organizations', 'organizations_admin_insert') THEN
    CREATE POLICY "organizations_admin_insert" ON organizations
    FOR INSERT WITH CHECK (is_admin());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT policy_exists('organizations', 'organizations_admin_update') THEN
    CREATE POLICY "organizations_admin_update" ON organizations
    FOR UPDATE USING (is_admin());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT policy_exists('organizations', 'organizations_admin_delete') THEN
    CREATE POLICY "organizations_admin_delete" ON organizations
    FOR DELETE USING (is_admin());
  END IF;
END $$;

-- org_owner: 自社Orgのみ
DO $$
BEGIN
  IF NOT policy_exists('organizations', 'organizations_owner_select') THEN
    CREATE POLICY "organizations_owner_select" ON organizations
    FOR SELECT USING (created_by = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT policy_exists('organizations', 'organizations_owner_insert') THEN
    CREATE POLICY "organizations_owner_insert" ON organizations
    FOR INSERT WITH CHECK (created_by = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT policy_exists('organizations', 'organizations_owner_update') THEN
    CREATE POLICY "organizations_owner_update" ON organizations
    FOR UPDATE USING (created_by = auth.uid());
  END IF;
END $$;

-- パブリック読み取り（公開済みのみ）
DO $$
BEGIN
  IF NOT policy_exists('organizations', 'organizations_public_select') THEN
    CREATE POLICY "organizations_public_select" ON organizations
    FOR SELECT USING (
      status = 'published' AND is_published = true
    );
  END IF;
END $$;

-- === SERVICES テーブル RLS（冪等対応） ===

-- admin: 全権限
DO $$
BEGIN
  IF NOT policy_exists('services', 'services_admin_select') THEN
    CREATE POLICY "services_admin_select" ON services
    FOR SELECT USING (is_admin());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT policy_exists('services', 'services_admin_insert') THEN
    CREATE POLICY "services_admin_insert" ON services
    FOR INSERT WITH CHECK (is_admin());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT policy_exists('services', 'services_admin_update') THEN
    CREATE POLICY "services_admin_update" ON services
    FOR UPDATE USING (is_admin());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT policy_exists('services', 'services_admin_delete') THEN
    CREATE POLICY "services_admin_delete" ON services
    FOR DELETE USING (is_admin());
  END IF;
END $$;

-- org_owner: 自社サービスのみ
DO $$
BEGIN
  IF NOT policy_exists('services', 'services_owner_select') THEN
    CREATE POLICY "services_owner_select" ON services
    FOR SELECT USING (
      organization_id IN (
        SELECT id FROM organizations WHERE created_by = auth.uid()
      )
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT policy_exists('services', 'services_owner_insert') THEN
    CREATE POLICY "services_owner_insert" ON services
    FOR INSERT WITH CHECK (
      organization_id IN (
        SELECT id FROM organizations WHERE created_by = auth.uid()
      )
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT policy_exists('services', 'services_owner_update') THEN
    CREATE POLICY "services_owner_update" ON services
    FOR UPDATE USING (
      organization_id IN (
        SELECT id FROM organizations WHERE created_by = auth.uid()
      )
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT policy_exists('services', 'services_owner_delete') THEN
    CREATE POLICY "services_owner_delete" ON services
    FOR DELETE USING (
      organization_id IN (
        SELECT id FROM organizations WHERE created_by = auth.uid()
      )
    );
  END IF;
END $$;

-- パブリック読み取り（公開済み企業のサービスのみ）
DO $$
BEGIN
  IF NOT policy_exists('services', 'services_public_select') THEN
    CREATE POLICY "services_public_select" ON services
    FOR SELECT USING (
      status = 'published' AND
      organization_id IN (
        SELECT id FROM organizations 
        WHERE status = 'published' AND is_published = true
      )
    );
  END IF;
END $$;

-- === CASE_STUDIES テーブル RLS（冪等対応） ===

-- admin: 全権限
DO $$
BEGIN
  IF NOT policy_exists('case_studies', 'case_studies_admin_select') THEN
    CREATE POLICY "case_studies_admin_select" ON case_studies
    FOR SELECT USING (is_admin());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT policy_exists('case_studies', 'case_studies_admin_insert') THEN
    CREATE POLICY "case_studies_admin_insert" ON case_studies
    FOR INSERT WITH CHECK (is_admin());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT policy_exists('case_studies', 'case_studies_admin_update') THEN
    CREATE POLICY "case_studies_admin_update" ON case_studies
    FOR UPDATE USING (is_admin());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT policy_exists('case_studies', 'case_studies_admin_delete') THEN
    CREATE POLICY "case_studies_admin_delete" ON case_studies
    FOR DELETE USING (is_admin());
  END IF;
END $$;

-- org_owner: 自社事例のみ
DO $$
BEGIN
  IF NOT policy_exists('case_studies', 'case_studies_owner_select') THEN
    CREATE POLICY "case_studies_owner_select" ON case_studies
    FOR SELECT USING (
      organization_id IN (
        SELECT id FROM organizations WHERE created_by = auth.uid()
      )
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT policy_exists('case_studies', 'case_studies_owner_insert') THEN
    CREATE POLICY "case_studies_owner_insert" ON case_studies
    FOR INSERT WITH CHECK (
      organization_id IN (
        SELECT id FROM organizations WHERE created_by = auth.uid()
      )
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT policy_exists('case_studies', 'case_studies_owner_update') THEN
    CREATE POLICY "case_studies_owner_update" ON case_studies
    FOR UPDATE USING (
      organization_id IN (
        SELECT id FROM organizations WHERE created_by = auth.uid()
      )
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT policy_exists('case_studies', 'case_studies_owner_delete') THEN
    CREATE POLICY "case_studies_owner_delete" ON case_studies
    FOR DELETE USING (
      organization_id IN (
        SELECT id FROM organizations WHERE created_by = auth.uid()
      )
    );
  END IF;
END $$;

-- パブリック読み取り（公開済み事例のみ）
DO $$
BEGIN
  IF NOT policy_exists('case_studies', 'case_studies_public_select') THEN
    CREATE POLICY "case_studies_public_select" ON case_studies
    FOR SELECT USING (
      status = 'published' AND
      organization_id IN (
        SELECT id FROM organizations 
        WHERE status = 'published' AND is_published = true
      )
    );
  END IF;
END $$;

-- === FAQS テーブル RLS（冪等対応） ===

-- admin: 全権限
DO $$
BEGIN
  IF NOT policy_exists('faqs', 'faqs_admin_select') THEN
    CREATE POLICY "faqs_admin_select" ON faqs
    FOR SELECT USING (is_admin());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT policy_exists('faqs', 'faqs_admin_insert') THEN
    CREATE POLICY "faqs_admin_insert" ON faqs
    FOR INSERT WITH CHECK (is_admin());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT policy_exists('faqs', 'faqs_admin_update') THEN
    CREATE POLICY "faqs_admin_update" ON faqs
    FOR UPDATE USING (is_admin());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT policy_exists('faqs', 'faqs_admin_delete') THEN
    CREATE POLICY "faqs_admin_delete" ON faqs
    FOR DELETE USING (is_admin());
  END IF;
END $$;

-- org_owner: 自社FAQのみ
DO $$
BEGIN
  IF NOT policy_exists('faqs', 'faqs_owner_select') THEN
    CREATE POLICY "faqs_owner_select" ON faqs
    FOR SELECT USING (
      organization_id IN (
        SELECT id FROM organizations WHERE created_by = auth.uid()
      )
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT policy_exists('faqs', 'faqs_owner_insert') THEN
    CREATE POLICY "faqs_owner_insert" ON faqs
    FOR INSERT WITH CHECK (
      organization_id IN (
        SELECT id FROM organizations WHERE created_by = auth.uid()
      )
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT policy_exists('faqs', 'faqs_owner_update') THEN
    CREATE POLICY "faqs_owner_update" ON faqs
    FOR UPDATE USING (
      organization_id IN (
        SELECT id FROM organizations WHERE created_by = auth.uid()
      )
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT policy_exists('faqs', 'faqs_owner_delete') THEN
    CREATE POLICY "faqs_owner_delete" ON faqs
    FOR DELETE USING (
      organization_id IN (
        SELECT id FROM organizations WHERE created_by = auth.uid()
      )
    );
  END IF;
END $$;

-- パブリック読み取り（公開済みFAQのみ）
DO $$
BEGIN
  IF NOT policy_exists('faqs', 'faqs_public_select') THEN
    CREATE POLICY "faqs_public_select" ON faqs
    FOR SELECT USING (
      status = 'published' AND
      organization_id IN (
        SELECT id FROM organizations 
        WHERE status = 'published' AND is_published = true
      )
    );
  END IF;
END $$;

-- === POSTS テーブル RLS（冪等対応） ===

-- 公開投稿の読み取り
DO $$
BEGIN
  IF NOT policy_exists('posts', 'posts_read_public') THEN
    CREATE POLICY "posts_read_public" ON posts
    FOR SELECT USING (status = 'published');
  END IF;
END $$;

-- 認証ユーザーの自分の投稿管理
DO $$
BEGIN
  IF NOT policy_exists('posts', 'posts_manage_own') THEN
    CREATE POLICY "posts_manage_own" ON posts
    FOR ALL USING (created_by = auth.uid());
  END IF;
END $$;

-- 管理者全権限
DO $$
BEGIN
  IF NOT policy_exists('posts', 'posts_admin_all') THEN
    CREATE POLICY "posts_admin_all" ON posts
    FOR ALL USING (is_admin());
  END IF;
END $$;

-- === 監査ログテーブル（冪等対応） ===

-- 監査ログテーブル作成（存在しない場合のみ）
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES auth.users(id),
  entity TEXT NOT NULL,
  entity_id UUID,
  action TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  diff JSONB,
  ip_address INET,
  user_agent TEXT
);

-- 監査ログ関数（冪等対応）
CREATE OR REPLACE FUNCTION log_audit()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    actor_user_id,
    entity,
    entity_id,
    action,
    diff
  ) VALUES (
    auth.uid(),
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE 
      WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
      WHEN TG_OP = 'INSERT' THEN to_jsonb(NEW)
      ELSE jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
    END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 監査トリガー（冪等対応）
DROP TRIGGER IF EXISTS organizations_audit_trigger ON organizations;
CREATE TRIGGER organizations_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON organizations
  FOR EACH ROW EXECUTE FUNCTION log_audit();

DROP TRIGGER IF EXISTS services_audit_trigger ON services;
CREATE TRIGGER services_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON services
  FOR EACH ROW EXECUTE FUNCTION log_audit();

DROP TRIGGER IF EXISTS case_studies_audit_trigger ON case_studies;
CREATE TRIGGER case_studies_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON case_studies
  FOR EACH ROW EXECUTE FUNCTION log_audit();

DROP TRIGGER IF EXISTS faqs_audit_trigger ON faqs;
CREATE TRIGGER faqs_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON faqs
  FOR EACH ROW EXECUTE FUNCTION log_audit();

-- RLS有効化（冪等対応）
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 監査ログのRLS（管理者のみ閲覧可能）
DO $$
BEGIN
  IF NOT policy_exists('audit_logs', 'audit_logs_admin_select') THEN
    CREATE POLICY "audit_logs_admin_select" ON audit_logs
    FOR SELECT USING (is_admin());
  END IF;
END $$;

-- クリーンアップ: ヘルパー関数削除
DROP FUNCTION IF EXISTS policy_exists(text, text);

-- PostgREST スキーマリロード
SELECT pg_notify('pgrst','reload schema');

-- 完了メッセージ
DO $$
BEGIN
  RAISE NOTICE '✅ RLS Policies Safe Implementation: SUCCESS';
  RAISE NOTICE '✅ Idempotent execution: All policies can be safely re-run';
  RAISE NOTICE '✅ Functions: get_user_role, is_admin, is_organization_owner, log_audit';
  RAISE NOTICE '✅ Tables with RLS: organizations, services, case_studies, faqs, posts, audit_logs';
  RAISE NOTICE '✅ Audit triggers: Enabled for all main tables';
  RAISE NOTICE '✅ Policy existence check: Implemented with IF NOT EXISTS pattern';
END
$$;