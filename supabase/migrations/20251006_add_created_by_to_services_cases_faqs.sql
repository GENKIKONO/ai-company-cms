-- Add created_by column to services, case_studies, faqs tables and update RLS policies
-- This migration ensures created_by is always set by the application (API Route)
-- identical to posts table security design

-- ================================
-- ADD CREATED_BY COLUMNS
-- ================================

-- Add created_by column to services table
ALTER TABLE public.services 
  ADD COLUMN IF NOT EXISTS created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add created_by column to case_studies table  
ALTER TABLE public.case_studies
  ADD COLUMN IF NOT EXISTS created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add created_by column to faqs table
ALTER TABLE public.faqs
  ADD COLUMN IF NOT EXISTS created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_services_created_by ON public.services(created_by);
CREATE INDEX IF NOT EXISTS idx_case_studies_created_by ON public.case_studies(created_by);
CREATE INDEX IF NOT EXISTS idx_faqs_created_by ON public.faqs(created_by);

-- ================================
-- UPDATE RLS POLICIES FOR SERVICES
-- ================================

-- Drop existing policies and create new ones with created_by checks
DROP POLICY IF EXISTS "Users can insert own org services" ON public.services;
DROP POLICY IF EXISTS "Users can view own org services" ON public.services;
DROP POLICY IF EXISTS "Users can update own org services" ON public.services;
DROP POLICY IF EXISTS "Users can delete own org services" ON public.services;

-- INSERT policy: user must own the organization AND created_by must be auth.uid()
CREATE POLICY "insert_own_org_services" ON public.services
  FOR INSERT WITH CHECK (
    -- User owns the organization
    organization_id IN (
      SELECT id FROM public.organizations WHERE created_by = auth.uid()
    )
    -- AND created_by must be the current user
    AND created_by = auth.uid()
  );

-- SELECT policy: users can view any service from their organization
CREATE POLICY "read_own_org_services" ON public.services
  FOR SELECT USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE created_by = auth.uid()
    )
  );

-- UPDATE policy: user must own organization AND be the creator
CREATE POLICY "Users can update own org services" ON public.services
  FOR UPDATE USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE created_by = auth.uid()
    )
    AND created_by = auth.uid()
  );

-- DELETE policy: user must own organization AND be the creator
CREATE POLICY "Users can delete own org services" ON public.services
  FOR DELETE USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE created_by = auth.uid()
    )
    AND created_by = auth.uid()
  );

-- ================================
-- UPDATE RLS POLICIES FOR CASE_STUDIES
-- ================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert own org case studies" ON public.case_studies;
DROP POLICY IF EXISTS "Users can view own org case studies" ON public.case_studies;
DROP POLICY IF EXISTS "Users can update own org case studies" ON public.case_studies;
DROP POLICY IF EXISTS "Users can delete own org case studies" ON public.case_studies;

-- INSERT policy: user must own the organization AND created_by must be auth.uid()
CREATE POLICY "insert_own_org_cases" ON public.case_studies
  FOR INSERT WITH CHECK (
    -- User owns the organization
    organization_id IN (
      SELECT id FROM public.organizations WHERE created_by = auth.uid()
    )
    -- AND created_by must be the current user
    AND created_by = auth.uid()
  );

-- SELECT policy: users can view any case study from their organization
CREATE POLICY "read_own_org_cases" ON public.case_studies
  FOR SELECT USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE created_by = auth.uid()
    )
  );

-- UPDATE policy: user must own organization AND be the creator
CREATE POLICY "Users can update own org case studies" ON public.case_studies
  FOR UPDATE USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE created_by = auth.uid()
    )
    AND created_by = auth.uid()
  );

-- DELETE policy: user must own organization AND be the creator
CREATE POLICY "Users can delete own org case studies" ON public.case_studies
  FOR DELETE USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE created_by = auth.uid()
    )
    AND created_by = auth.uid()
  );

-- ================================
-- UPDATE RLS POLICIES FOR FAQS
-- ================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert own org faqs" ON public.faqs;
DROP POLICY IF EXISTS "Users can view own org faqs" ON public.faqs;
DROP POLICY IF EXISTS "Users can update own org faqs" ON public.faqs;
DROP POLICY IF EXISTS "Users can delete own org faqs" ON public.faqs;

-- INSERT policy: user must own the organization AND created_by must be auth.uid()
CREATE POLICY "insert_own_org_faqs" ON public.faqs
  FOR INSERT WITH CHECK (
    -- User owns the organization
    organization_id IN (
      SELECT id FROM public.organizations WHERE created_by = auth.uid()
    )
    -- AND created_by must be the current user
    AND created_by = auth.uid()
  );

-- SELECT policy: users can view any FAQ from their organization
CREATE POLICY "read_own_org_faqs" ON public.faqs
  FOR SELECT USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE created_by = auth.uid()
    )
  );

-- UPDATE policy: user must own organization AND be the creator
CREATE POLICY "Users can update own org faqs" ON public.faqs
  FOR UPDATE USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE created_by = auth.uid()
    )
    AND created_by = auth.uid()
  );

-- DELETE policy: user must own organization AND be the creator
CREATE POLICY "Users can delete own org faqs" ON public.faqs
  FOR DELETE USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE created_by = auth.uid()
    )
    AND created_by = auth.uid()
  );

-- ================================
-- COMMENTS FOR DOCUMENTATION
-- ================================
COMMENT ON COLUMN public.services.created_by IS 'User who created this service - must be set by application, not database default';
COMMENT ON COLUMN public.case_studies.created_by IS 'User who created this case study - must be set by application, not database default';
COMMENT ON COLUMN public.faqs.created_by IS 'User who created this FAQ - must be set by application, not database default';

-- ================================
-- NOTIFY POSTGREST TO RELOAD SCHEMA
-- ================================
SELECT pg_notify('pgrst', 'reload schema');