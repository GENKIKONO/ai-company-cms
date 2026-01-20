-- =====================================================
-- Fix: organizations テーブルのRLSポリシーを organization_members テーブルベースに修正
--
-- 問題: 20251112_security_hardening.sql で作成したRLSポリシーが
--       profiles.organization_id を使用していたが、実際のメンバーシップは
--       organization_members テーブルで管理されている
--
-- 症状: ログイン後「組織のメンバーシップは確認できていますが、
--       組織の詳細情報の取得中にエラーが発生しています」エラー
--
-- 影響: /api/dashboard/init の JOIN クエリで organizations データが
--       RLS により取得できない
-- =====================================================

BEGIN;

-- =====================================================
-- 1. 既存の問題のあるポリシーを削除
-- =====================================================

-- 20251112_security_hardening.sql で作成されたポリシー
DROP POLICY IF EXISTS "organizations_read_policy" ON public.organizations;
DROP POLICY IF EXISTS "organizations_update_policy" ON public.organizations;
DROP POLICY IF EXISTS "organizations_insert_policy" ON public.organizations;

-- その他の古いポリシー（重複防止）
DROP POLICY IF EXISTS "organizations_read" ON public.organizations;
DROP POLICY IF EXISTS "organizations_admin" ON public.organizations;
DROP POLICY IF EXISTS "Members can read their organization" ON public.organizations;
DROP POLICY IF EXISTS "Users can read own organization" ON public.organizations;

-- =====================================================
-- 2. organization_members テーブルベースの新しいRLSポリシー作成
-- =====================================================

-- 組織の読み取りポリシー（organization_members ベース）
CREATE POLICY "organizations_member_read" ON public.organizations
  FOR SELECT USING (
    -- organization_members テーブルでメンバーシップを確認
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.organization_id = organizations.id
      AND organization_members.user_id = auth.uid()
    )
    OR
    -- サイト管理者（profiles.role = 'admin'）は全組織アクセス可能
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    OR
    -- 公開組織は誰でも閲覧可能
    is_published = true
  );

COMMENT ON POLICY "organizations_member_read" ON public.organizations IS
  '組織メンバー、サイト管理者、または公開組織は閲覧可能';

-- 組織の更新ポリシー（organization_members ベース - owner/admin のみ）
CREATE POLICY "organizations_member_update" ON public.organizations
  FOR UPDATE USING (
    -- organization_members で owner または admin ロールを持つユーザー
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.organization_id = organizations.id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
    OR
    -- サイト管理者は全組織を更新可能
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

COMMENT ON POLICY "organizations_member_update" ON public.organizations IS
  '組織のオーナー/管理者、またはサイト管理者のみ更新可能';

-- 組織の挿入ポリシー（認証済みユーザーは新規組織作成可能）
CREATE POLICY "organizations_authenticated_insert" ON public.organizations
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  );

COMMENT ON POLICY "organizations_authenticated_insert" ON public.organizations IS
  '認証済みユーザーは新規組織を作成可能';

-- 組織の削除ポリシー（owner または サイト管理者のみ）
DROP POLICY IF EXISTS "organizations_member_delete" ON public.organizations;
CREATE POLICY "organizations_member_delete" ON public.organizations
  FOR DELETE USING (
    -- organization_members で owner ロールを持つユーザー
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.organization_id = organizations.id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'owner'
    )
    OR
    -- サイト管理者は全組織を削除可能
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

COMMENT ON POLICY "organizations_member_delete" ON public.organizations IS
  '組織のオーナーまたはサイト管理者のみ削除可能';

-- =====================================================
-- 3. qa_entries テーブルのRLSポリシーも修正
--    (20251112_security_hardening.sql で同様の問題あり)
-- =====================================================

-- 既存の問題のあるポリシーを削除
DROP POLICY IF EXISTS "qa_entries_read_policy" ON public.qa_entries;
DROP POLICY IF EXISTS "qa_entries_update_policy" ON public.qa_entries;
DROP POLICY IF EXISTS "qa_entries_read" ON public.qa_entries;
DROP POLICY IF EXISTS "qa_entries_update" ON public.qa_entries;

-- QAエントリ読み取りポリシー（organization_members ベース）
CREATE POLICY "qa_entries_member_read" ON public.qa_entries
  FOR SELECT USING (
    -- organization_members テーブルでメンバーシップを確認
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.organization_id = qa_entries.organization_id
      AND organization_members.user_id = auth.uid()
    )
    OR
    -- サイト管理者は全QAアクセス可能
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    OR
    -- 公開組織の公開QAは誰でも閲覧可能
    EXISTS (
      SELECT 1 FROM public.organizations
      WHERE organizations.id = qa_entries.organization_id
      AND organizations.is_published = true
    )
  );

COMMENT ON POLICY "qa_entries_member_read" ON public.qa_entries IS
  '組織メンバー、サイト管理者、または公開組織のQAは閲覧可能';

-- QAエントリ更新ポリシー（organization_members ベース）
CREATE POLICY "qa_entries_member_update" ON public.qa_entries
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.organization_id = qa_entries.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin', 'member')
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

COMMENT ON POLICY "qa_entries_member_update" ON public.qa_entries IS
  '組織メンバー（owner/admin/member）またはサイト管理者のみ更新可能';

-- QAエントリ挿入ポリシー
DROP POLICY IF EXISTS "qa_entries_member_insert" ON public.qa_entries;
CREATE POLICY "qa_entries_member_insert" ON public.qa_entries
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.organization_id = qa_entries.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin', 'member')
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

COMMENT ON POLICY "qa_entries_member_insert" ON public.qa_entries IS
  '組織メンバー（owner/admin/member）またはサイト管理者のみ挿入可能';

-- QAエントリ削除ポリシー
DROP POLICY IF EXISTS "qa_entries_member_delete" ON public.qa_entries;
CREATE POLICY "qa_entries_member_delete" ON public.qa_entries
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.organization_id = qa_entries.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

COMMENT ON POLICY "qa_entries_member_delete" ON public.qa_entries IS
  '組織のオーナー/管理者またはサイト管理者のみ削除可能';

COMMIT;

-- =====================================================
-- 検証クエリ（コメントアウト - 手動確認用）
-- =====================================================
-- SELECT tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE tablename IN ('organizations', 'qa_entries')
-- ORDER BY tablename, policyname;
