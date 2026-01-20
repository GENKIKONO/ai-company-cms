-- ============================================
-- Create Public Views for Safe Data Exposure
-- ============================================
-- Purpose: Create secure VIEWs that expose only public-safe columns
-- Date: 2026-01-20
-- Contract: src/lib/db/public-view-contracts.ts
--
-- IMPORTANT: When modifying these VIEWs, also update:
--   1. src/lib/db/public-view-contracts.ts (column definitions)
--   2. Run NOTIFY pgrst, 'reload schema'; after changes
-- ============================================

-- ============================================
-- 0. Ensure required columns exist on organizations table
-- ============================================
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS show_services BOOLEAN DEFAULT true;

ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS show_posts BOOLEAN DEFAULT true;

ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS show_case_studies BOOLEAN DEFAULT true;

ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS show_faqs BOOLEAN DEFAULT true;

ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS show_qa BOOLEAN DEFAULT true;

ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS show_news BOOLEAN DEFAULT true;

ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS show_partnership BOOLEAN DEFAULT true;

ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS show_contact BOOLEAN DEFAULT true;

ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Ensure posts has summary column
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS summary TEXT;

-- Ensure case_studies has slug, summary, published_at columns
ALTER TABLE public.case_studies
ADD COLUMN IF NOT EXISTS slug TEXT;

ALTER TABLE public.case_studies
ADD COLUMN IF NOT EXISTS summary TEXT;

ALTER TABLE public.case_studies
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- Ensure faqs has published_at column
ALTER TABLE public.faqs
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- Ensure services has required columns (may be missing if only 20250927 migration ran)
ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS price_range TEXT;

ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS url TEXT;

ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS logo_url TEXT;

ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS screenshots TEXT[];

ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS categories TEXT[];

-- ============================================
-- 1. v_organizations_public VIEW
-- ============================================
-- Drop existing VIEW if exists
DROP VIEW IF EXISTS public.v_organizations_public;

-- Create VIEW with only public-safe columns
-- NOTE: This VIEW ONLY returns published organizations
CREATE VIEW public.v_organizations_public AS
SELECT
  id,
  name,
  slug,
  description,
  email,
  email_public,
  telephone,
  logo_url,
  url AS website_url,  -- Alias for backwards compatibility
  url,
  meta_title,
  meta_description,
  meta_keywords,
  industries,
  same_as,
  status,
  is_published,
  COALESCE(verified, false) AS verified,
  COALESCE(show_services, true) AS show_services,
  COALESCE(show_posts, true) AS show_posts,
  COALESCE(show_case_studies, true) AS show_case_studies,
  COALESCE(show_faqs, true) AS show_faqs,
  COALESCE(show_qa, true) AS show_qa,
  COALESCE(show_news, true) AS show_news,
  COALESCE(show_partnership, true) AS show_partnership,
  COALESCE(show_contact, true) AS show_contact,
  address_region,
  address_locality,
  address_street,
  address_postal_code,
  created_at,
  updated_at
FROM public.organizations
WHERE
  is_published = true
  AND status = 'published'
  AND (deleted_at IS NULL);

-- ============================================
-- 2. v_services_public VIEW
-- ============================================
DROP VIEW IF EXISTS public.v_services_public;

CREATE VIEW public.v_services_public AS
SELECT
  s.id,
  s.organization_id,
  s.name,
  s.description,
  s.price_range,
  s.url,
  s.logo_url,
  s.screenshots,
  s.categories,
  s.created_at,
  s.updated_at,
  o.slug AS organization_slug,
  o.name AS organization_name
FROM public.services s
INNER JOIN public.organizations o ON s.organization_id = o.id
WHERE
  s.is_published = true
  AND o.is_published = true
  AND o.status = 'published'
  AND (o.deleted_at IS NULL);

-- ============================================
-- 3. v_posts_public VIEW
-- ============================================
DROP VIEW IF EXISTS public.v_posts_public;

CREATE VIEW public.v_posts_public AS
SELECT
  p.id,
  p.organization_id,
  p.title,
  p.slug,
  p.summary,
  p.published_at,
  p.created_at,
  p.updated_at,
  o.slug AS organization_slug,
  o.name AS organization_name
FROM public.posts p
INNER JOIN public.organizations o ON p.organization_id = o.id
WHERE
  p.is_published = true
  AND p.status = 'published'
  AND o.is_published = true
  AND o.status = 'published'
  AND (o.deleted_at IS NULL);

-- ============================================
-- 4. v_case_studies_public VIEW
-- ============================================
DROP VIEW IF EXISTS public.v_case_studies_public;

CREATE VIEW public.v_case_studies_public AS
SELECT
  cs.id,
  cs.organization_id,
  cs.title,
  cs.slug,
  cs.summary,
  cs.published_at,
  cs.created_at,
  cs.updated_at,
  o.slug AS organization_slug,
  o.name AS organization_name
FROM public.case_studies cs
INNER JOIN public.organizations o ON cs.organization_id = o.id
WHERE
  cs.is_published = true
  AND o.is_published = true
  AND o.status = 'published'
  AND (o.deleted_at IS NULL);

-- ============================================
-- 5. v_faqs_public VIEW
-- ============================================
DROP VIEW IF EXISTS public.v_faqs_public;

CREATE VIEW public.v_faqs_public AS
SELECT
  f.id,
  f.organization_id,
  f.question,
  f.answer,
  f.published_at,
  f.created_at,
  f.updated_at,
  o.slug AS organization_slug,
  o.name AS organization_name
FROM public.faqs f
INNER JOIN public.organizations o ON f.organization_id = o.id
WHERE
  f.is_published = true
  AND o.is_published = true
  AND o.status = 'published'
  AND (o.deleted_at IS NULL);

-- ============================================
-- 6. Grant SELECT permissions to anon role
-- ============================================
GRANT SELECT ON public.v_organizations_public TO anon;
GRANT SELECT ON public.v_services_public TO anon;
GRANT SELECT ON public.v_posts_public TO anon;
GRANT SELECT ON public.v_case_studies_public TO anon;
GRANT SELECT ON public.v_faqs_public TO anon;

-- Also grant to authenticated role
GRANT SELECT ON public.v_organizations_public TO authenticated;
GRANT SELECT ON public.v_services_public TO authenticated;
GRANT SELECT ON public.v_posts_public TO authenticated;
GRANT SELECT ON public.v_case_studies_public TO authenticated;
GRANT SELECT ON public.v_faqs_public TO authenticated;

-- ============================================
-- 7. Reload PostgREST schema cache
-- ============================================
NOTIFY pgrst, 'reload schema';

-- ============================================
-- 8. Verification comments
-- ============================================
COMMENT ON VIEW public.v_organizations_public IS 'Public-safe organization data view. Contract: src/lib/db/public-view-contracts.ts';
COMMENT ON VIEW public.v_services_public IS 'Public-safe services data view. Contract: src/lib/db/public-view-contracts.ts';
COMMENT ON VIEW public.v_posts_public IS 'Public-safe posts data view. Contract: src/lib/db/public-view-contracts.ts';
COMMENT ON VIEW public.v_case_studies_public IS 'Public-safe case studies data view. Contract: src/lib/db/public-view-contracts.ts';
COMMENT ON VIEW public.v_faqs_public IS 'Public-safe FAQs data view. Contract: src/lib/db/public-view-contracts.ts';
