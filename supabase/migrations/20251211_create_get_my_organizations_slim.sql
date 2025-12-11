-- Create get_my_organizations_slim RPC function
-- This function returns organization summaries for the current user
-- Used by /api/me endpoint

CREATE OR REPLACE FUNCTION get_my_organizations_slim(user_id UUID DEFAULT auth.uid())
RETURNS TABLE(
  user_id UUID,
  organization_id UUID,
  name TEXT,
  slug TEXT,
  plan TEXT,
  show_services BOOLEAN,
  show_posts BOOLEAN,
  show_case_studies BOOLEAN,
  show_faqs BOOLEAN,
  show_qa BOOLEAN,
  show_news BOOLEAN,
  show_partnership BOOLEAN,
  show_contact BOOLEAN,
  is_demo_guess BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    get_my_organizations_slim.user_id as user_id,
    o.id as organization_id,
    o.name,
    o.slug,
    COALESCE(o.plan, 'free') as plan,
    COALESCE(o.show_services, true) as show_services,
    COALESCE(o.show_posts, true) as show_posts,
    COALESCE(o.show_case_studies, true) as show_case_studies,
    COALESCE(o.show_faqs, true) as show_faqs,
    COALESCE(o.show_qa, true) as show_qa,
    COALESCE(o.show_news, true) as show_news,
    COALESCE(o.show_partnership, true) as show_partnership,
    COALESCE(o.show_contact, true) as show_contact,
    false as is_demo_guess -- For now, assume no demo organizations
  FROM organization_members om
  JOIN organizations o ON om.organization_id = o.id
  WHERE om.user_id = get_my_organizations_slim.user_id
  ORDER BY om.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_my_organizations_slim(UUID) TO authenticated;

-- Test the function with the E2E user
-- This should be run manually after migration
-- SELECT * FROM get_my_organizations_slim('64b23ce5-0304-4a80-8a91-c8a3c14ebce2');