
-- Fix organization_members RLS policies
-- This should be run directly in Supabase SQL editor

-- 1. Drop all existing policies
DROP POLICY IF EXISTS "members_view_own_membership" ON organization_members;
DROP POLICY IF EXISTS "owners_view_org_members" ON organization_members;  
DROP POLICY IF EXISTS "owners_add_members" ON organization_members;
DROP POLICY IF EXISTS "owners_update_members" ON organization_members;
DROP POLICY IF EXISTS "owners_remove_members" ON organization_members;
DROP POLICY IF EXISTS "admin_full_access_members" ON organization_members;

-- 2. Create simple working policies
-- Policy 1: Users can see their own memberships  
CREATE POLICY "user_own_membership" ON organization_members
  FOR SELECT USING (user_id = auth.uid());

-- Policy 2: Admin users have full access
CREATE POLICY "admin_full_access" ON organization_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM app_users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy 3: Organization owners can manage their organizations
CREATE POLICY "owner_manage_org" ON organization_members
  FOR ALL USING (
    organization_id IN (
      SELECT id FROM organizations WHERE created_by = auth.uid()
    )
  );

-- Policy 4: Service role bypass (for API operations)
CREATE POLICY "service_role_access" ON organization_members
  FOR ALL USING (auth.role() = 'service_role');

-- Test the policies
SELECT 'Policy test' as test, * FROM organization_members WHERE user_id = '64b23ce5-0304-4a80-8a91-c8a3c14ebce2';
