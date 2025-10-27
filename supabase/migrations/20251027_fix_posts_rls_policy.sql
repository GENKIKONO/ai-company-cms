-- Fix Posts RLS policy to use correct organization ownership model
-- The original policy references non-existent 'owner_user_id' field

-- Drop existing problematic policy
DROP POLICY IF EXISTS "posts_owner_crud" ON posts;

-- Create corrected RLS policy for posts
-- Users can access posts if they:
-- 1. Created the post themselves
-- 2. Are members of the organization that owns the post
-- 3. Own the organization that the post belongs to
CREATE POLICY "posts_member_access" ON posts
  FOR ALL USING (
    -- Post creator has access
    created_by = auth.uid() OR
    -- Organization members have access
    org_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    ) OR
    -- Organization creator/owner has access
    org_id IN (
      SELECT id FROM organizations 
      WHERE created_by = auth.uid()
    )
  );

-- Ensure public read access for published posts remains
DROP POLICY IF EXISTS "posts_public_read" ON posts;
CREATE POLICY "posts_public_read" ON posts
  FOR SELECT USING (
    status = 'published' AND published_at IS NOT NULL
  );

-- Ensure admin access remains
DROP POLICY IF EXISTS "posts_admin_all" ON posts;
CREATE POLICY "posts_admin_all" ON posts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM app_users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Add function to check post access for better performance
CREATE OR REPLACE FUNCTION user_can_access_post(post_id UUID, user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
DECLARE
  post_org_id UUID;
  post_creator UUID;
BEGIN
  -- Get post details
  SELECT org_id, created_by INTO post_org_id, post_creator
  FROM posts WHERE id = post_id;
  
  -- Check if user is post creator
  IF post_creator = user_id THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user is organization member
  IF EXISTS (
    SELECT 1 FROM organization_members 
    WHERE organization_id = post_org_id AND organization_members.user_id = user_id
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user is organization owner
  IF EXISTS (
    SELECT 1 FROM organizations 
    WHERE id = post_org_id AND created_by = user_id
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user is admin
  IF EXISTS (
    SELECT 1 FROM app_users 
    WHERE id = user_id AND role = 'admin'
  ) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create optimized index for organization membership lookups
CREATE INDEX IF NOT EXISTS idx_organization_members_lookup 
ON organization_members(user_id, organization_id);

-- Create optimized index for organization ownership lookups
CREATE INDEX IF NOT EXISTS idx_organizations_created_by 
ON organizations(created_by);

-- Note: Cannot add CHECK constraint with subqueries in PostgreSQL
-- Access control is handled by RLS policies instead
-- This constraint would require a trigger-based approach if needed

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Posts RLS policy fix completed successfully';
END $$;