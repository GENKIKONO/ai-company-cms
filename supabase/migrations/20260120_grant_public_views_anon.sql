-- Public Views: GRANT SELECT to anon role
-- This migration ensures anonymous users can access public views.
-- These views are used by /api/public/* endpoints for listing public content.
--
-- Applied to production via Supabase SQL Editor on 2026-01-20.
-- This file is for code management and environment reproducibility.
--
-- Root cause: VIEWs were created but GRANT to anon was never applied.
-- Symptom: "permission denied for view v_organizations_public" error

BEGIN;

-- Grant SELECT on public views to anonymous users
GRANT SELECT ON public.v_organizations_public TO anon;
GRANT SELECT ON public.v_services_public TO anon;
GRANT SELECT ON public.v_case_studies_public TO anon;
GRANT SELECT ON public.v_posts_public TO anon;
GRANT SELECT ON public.v_faqs_public TO anon;

COMMIT;
