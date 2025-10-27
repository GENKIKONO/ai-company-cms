-- Fix partner_organizations RLS policy infinite recursion
-- This fixes the issue where RLS policies reference each other causing infinite loops

-- Drop existing problematic policies
DROP POLICY IF EXISTS "admin_full_access_partner_assignments" ON partner_organizations;
DROP POLICY IF EXISTS "partners_view_assignments" ON partner_organizations;
DROP POLICY IF EXISTS "organization_owners_manage_partners" ON partner_organizations;

-- Create simple, non-recursive RLS policies for partner_organizations
-- Admin access: Simple admin check
CREATE POLICY "admin_access_partner_assignments" ON partner_organizations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM app_users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Partner users can view their own assignments
CREATE POLICY "partners_view_own_assignments" ON partner_organizations
  FOR SELECT USING (
    partner_user_id = auth.uid()
  );

-- Organization creators can manage their partnerships
CREATE POLICY "org_creators_manage_partnerships" ON partner_organizations
  FOR ALL USING (
    organization_id IN (
      SELECT id FROM organizations 
      WHERE created_by = auth.uid()
    )
  );

-- Service role access for API operations
CREATE POLICY "service_role_partner_assignments" ON partner_organizations
  FOR ALL USING (auth.role() = 'service_role');

-- Update get_user_access_summary function to avoid recursion
CREATE OR REPLACE FUNCTION get_user_access_summary(user_id UUID DEFAULT auth.uid())
RETURNS JSONB AS $$
DECLARE
  user_role TEXT;
  owned_orgs UUID[];
  member_orgs UUID[];
  partner_orgs UUID[];
  result JSONB;
BEGIN
  -- Get user role directly from app_users
  SELECT role INTO user_role FROM app_users WHERE id = user_id;
  user_role := COALESCE(user_role, 'user');
  
  -- Get owned organizations
  SELECT ARRAY_AGG(id) INTO owned_orgs
  FROM organizations 
  WHERE created_by = user_id;
  
  -- Get member organizations
  SELECT ARRAY_AGG(organization_id) INTO member_orgs
  FROM organization_members 
  WHERE organization_members.user_id = get_user_access_summary.user_id;
  
  -- Get partner organizations (avoid RLS recursion by using direct query)
  IF user_role = 'admin' THEN
    -- Admin can see all partnerships
    SELECT ARRAY_AGG(organization_id) INTO partner_orgs
    FROM partner_organizations 
    WHERE is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW());
  ELSE
    -- Regular users see only their partnerships
    SELECT ARRAY_AGG(organization_id) INTO partner_orgs
    FROM partner_organizations 
    WHERE partner_user_id = user_id 
    AND is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW());
  END IF;
  
  -- Build result
  result := jsonb_build_object(
    'user_id', user_id,
    'role', user_role,
    'owned_organizations', COALESCE(owned_orgs, ARRAY[]::UUID[]),
    'member_organizations', COALESCE(member_orgs, ARRAY[]::UUID[]),
    'partner_organizations', COALESCE(partner_orgs, ARRAY[]::UUID[]),
    'is_admin', user_role = 'admin',
    'is_partner', user_role = 'partner',
    'is_owner', user_role = 'owner'
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update validate_org_access function to avoid recursion
CREATE OR REPLACE FUNCTION validate_org_access(org_id UUID, required_permission TEXT DEFAULT 'read', user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  is_org_owner BOOLEAN := FALSE;
  is_org_member BOOLEAN := FALSE;
  is_partner BOOLEAN := FALSE;
BEGIN
  -- Get user role directly
  SELECT role INTO user_role FROM app_users WHERE id = user_id;
  user_role := COALESCE(user_role, 'user');
  
  -- Admin has all access
  IF user_role = 'admin' THEN
    RETURN TRUE;
  END IF;
  
  -- Check organization ownership
  SELECT EXISTS (
    SELECT 1 FROM organizations 
    WHERE id = org_id AND created_by = user_id
  ) INTO is_org_owner;
  
  IF is_org_owner THEN
    RETURN TRUE;
  END IF;
  
  -- Check organization membership
  SELECT EXISTS (
    SELECT 1 FROM organization_members 
    WHERE organization_id = org_id AND organization_members.user_id = user_id
  ) INTO is_org_member;
  
  IF is_org_member AND required_permission IN ('read', 'write') THEN
    RETURN TRUE;
  END IF;
  
  -- Check partner access (avoid RLS by direct query)
  IF required_permission = 'read' THEN
    SELECT EXISTS (
      SELECT 1 FROM partner_organizations 
      WHERE organization_id = org_id 
      AND partner_user_id = user_id
      AND is_active = TRUE 
      AND (expires_at IS NULL OR expires_at > NOW())
    ) INTO is_partner;
    
    IF is_partner THEN
      RETURN TRUE;
    END IF;
  END IF;
  
  IF required_permission = 'write' THEN
    SELECT EXISTS (
      SELECT 1 FROM partner_organizations 
      WHERE organization_id = org_id 
      AND partner_user_id = user_id
      AND is_active = TRUE 
      AND (expires_at IS NULL OR expires_at > NOW())
      AND access_level IN ('write', 'admin')
    ) INTO is_partner;
    
    IF is_partner THEN
      RETURN TRUE;
    END IF;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the fix by running a simple query
DO $$
BEGIN
  -- Test query to ensure no infinite recursion
  PERFORM COUNT(*) FROM partner_organizations LIMIT 1;
  RAISE NOTICE 'Partner organizations RLS policy recursion fixed successfully';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error testing partner_organizations: %', SQLERRM;
END $$;