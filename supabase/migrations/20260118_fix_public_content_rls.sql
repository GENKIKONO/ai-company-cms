-- =====================================================
-- Fix: 公開コンテンツのRLSポリシー復元
--
-- 問題: 20251006_add_created_by_to_services_cases_faqs.sql で
--       公開読み取りポリシーが削除されたまま復元されていない
--
-- 影響: 匿名ユーザーが企業ページでservices, case_studies, faqsを閲覧できない
-- =====================================================

-- =====================================================
-- 1. services テーブル - 公開読み取りポリシー追加
-- =====================================================

-- 既存の同名ポリシーがあれば削除
DROP POLICY IF EXISTS "services_public_select" ON public.services;
DROP POLICY IF EXISTS "services_public_read" ON public.services;
DROP POLICY IF EXISTS "Anyone can view published services" ON public.services;

-- 公開読み取りポリシーを作成
CREATE POLICY "services_public_read" ON public.services
  FOR SELECT
  USING (
    is_published = true
    AND organization_id IN (
      SELECT id FROM public.organizations
      WHERE is_published = true
    )
  );

COMMENT ON POLICY "services_public_read" ON public.services IS
  '公開済みサービスは誰でも閲覧可能（企業も公開済みの場合）';

-- =====================================================
-- 2. case_studies テーブル - 公開読み取りポリシー追加
-- =====================================================

-- 既存の同名ポリシーがあれば削除
DROP POLICY IF EXISTS "case_studies_public_select" ON public.case_studies;
DROP POLICY IF EXISTS "case_studies_public_read" ON public.case_studies;
DROP POLICY IF EXISTS "Anyone can view published case studies" ON public.case_studies;

-- 公開読み取りポリシーを作成
CREATE POLICY "case_studies_public_read" ON public.case_studies
  FOR SELECT
  USING (
    is_published = true
    AND organization_id IN (
      SELECT id FROM public.organizations
      WHERE is_published = true
    )
  );

COMMENT ON POLICY "case_studies_public_read" ON public.case_studies IS
  '公開済み事例は誰でも閲覧可能（企業も公開済みの場合）';

-- =====================================================
-- 3. faqs テーブル - 公開読み取りポリシー追加
-- =====================================================

-- 既存の同名ポリシーがあれば削除
DROP POLICY IF EXISTS "faqs_public_select" ON public.faqs;
DROP POLICY IF EXISTS "faqs_public_read" ON public.faqs;
DROP POLICY IF EXISTS "Anyone can view published faqs" ON public.faqs;

-- 公開読み取りポリシーを作成
CREATE POLICY "faqs_public_read" ON public.faqs
  FOR SELECT
  USING (
    is_published = true
    AND organization_id IN (
      SELECT id FROM public.organizations
      WHERE is_published = true
    )
  );

COMMENT ON POLICY "faqs_public_read" ON public.faqs IS
  '公開済みFAQは誰でも閲覧可能（企業も公開済みの場合）';

-- =====================================================
-- 検証クエリ（コメントアウト - 手動確認用）
-- =====================================================
-- SELECT tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE tablename IN ('services', 'case_studies', 'faqs')
-- ORDER BY tablename, policyname;
