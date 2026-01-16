-- Dashboard Secure Views: GRANT SELECT to authenticated role
-- This migration ensures authenticated users can access the secure dashboard views.
-- These views are used by /dashboard/* pages for listing content.
--
-- Already applied to production via Supabase Assistant on 2026-01-16.
-- This file is for code management and environment reproducibility.

BEGIN;

-- Grant SELECT on dashboard secure views to authenticated users
GRANT SELECT ON public.v_dashboard_posts_secure TO authenticated;
GRANT SELECT ON public.v_dashboard_services_secure TO authenticated;
GRANT SELECT ON public.v_dashboard_faqs_secure TO authenticated;
GRANT SELECT ON public.v_dashboard_case_studies_secure TO authenticated;

COMMIT;
