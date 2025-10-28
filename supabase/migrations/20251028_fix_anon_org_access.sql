-- Fix anonymous access to organizations table
-- This resolves the infinite recursion issue for public organization pages

-- Drop existing problematic policies first
DROP POLICY IF EXISTS "organizations_public_select" ON organizations;

-- Create a simple anonymous access policy for organizations
CREATE POLICY "anon_can_view_published_orgs" ON organizations
  FOR SELECT TO anon USING (
    status = 'published' AND is_published = true
  );

-- Ensure service role can access everything (for migrations and internal operations)
DROP POLICY IF EXISTS "service_role_full_access_orgs" ON organizations;
CREATE POLICY "service_role_full_access_orgs" ON organizations
  FOR ALL TO service_role USING (true);

-- Also fix related tables to avoid similar issues
DROP POLICY IF EXISTS "services_public_select" ON services;
CREATE POLICY "anon_can_view_published_services" ON services
  FOR SELECT TO anon USING (
    status = 'published'
  );

DROP POLICY IF EXISTS "case_studies_public_select" ON case_studies;
CREATE POLICY "anon_can_view_published_case_studies" ON case_studies
  FOR SELECT TO anon USING (
    status = 'published'
  );

DROP POLICY IF EXISTS "faqs_public_select" ON faqs;
CREATE POLICY "anon_can_view_published_faqs" ON faqs
  FOR SELECT TO anon USING (
    status = 'published'
  );

-- Fix posts table as well
DROP POLICY IF EXISTS "posts_read_public" ON posts;
CREATE POLICY "anon_can_view_published_posts" ON posts
  FOR SELECT TO anon USING (
    status = 'published'
  );

-- Grant explicit permissions to anon role
GRANT SELECT ON organizations TO anon;
GRANT SELECT ON services TO anon;
GRANT SELECT ON case_studies TO anon;
GRANT SELECT ON faqs TO anon;
GRANT SELECT ON posts TO anon;

-- Test notification
SELECT pg_notify('pgrst','reload schema');

DO $$
BEGIN
  RAISE NOTICE '✅ Anonymous access policies fixed';
  RAISE NOTICE '✅ Removed circular references in RLS policies';
  RAISE NOTICE '✅ Organization public pages should now work';
END $$;