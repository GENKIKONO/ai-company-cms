-- Create organization_members table for multi-user organization support
-- This fixes the missing table referenced in Posts RLS policies

-- Create organization_members table
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  joined_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_org_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_role ON organization_members(role);

-- Enable RLS
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organization_members

-- 1. Members can view their own memberships
DROP POLICY IF EXISTS "members_view_own_membership" ON organization_members;
CREATE POLICY "members_view_own_membership" ON organization_members
  FOR SELECT USING (
    user_id = auth.uid()
  );

-- 2. Organization owners can view all members of their organizations
DROP POLICY IF EXISTS "owners_view_org_members" ON organization_members;
CREATE POLICY "owners_view_org_members" ON organization_members
  FOR SELECT USING (
    organization_id IN (
      SELECT id FROM organizations WHERE created_by = auth.uid()
    )
  );

-- 3. Organization owners can add members to their organizations
DROP POLICY IF EXISTS "owners_add_members" ON organization_members;
CREATE POLICY "owners_add_members" ON organization_members
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT id FROM organizations WHERE created_by = auth.uid()
    )
  );

-- 4. Organization owners can update member roles in their organizations
DROP POLICY IF EXISTS "owners_update_members" ON organization_members;
CREATE POLICY "owners_update_members" ON organization_members
  FOR UPDATE USING (
    organization_id IN (
      SELECT id FROM organizations WHERE created_by = auth.uid()
    )
  );

-- 5. Organization owners can remove members from their organizations
-- Members can also remove themselves
DROP POLICY IF EXISTS "owners_remove_members" ON organization_members;
CREATE POLICY "owners_remove_members" ON organization_members
  FOR DELETE USING (
    organization_id IN (
      SELECT id FROM organizations WHERE created_by = auth.uid()
    ) OR user_id = auth.uid()
  );

-- 6. Admins have full access to all organization memberships
DROP POLICY IF EXISTS "admin_full_access_members" ON organization_members;
CREATE POLICY "admin_full_access_members" ON organization_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM app_users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create function to automatically add organization creator as owner
CREATE OR REPLACE FUNCTION add_organization_owner()
RETURNS TRIGGER AS $$
BEGIN
  -- Add the creator as an owner member
  INSERT INTO organization_members (organization_id, user_id, role, joined_at)
  VALUES (NEW.id, NEW.created_by, 'owner', NOW())
  ON CONFLICT (organization_id, user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically add organization creator as owner
DROP TRIGGER IF EXISTS trigger_add_organization_owner ON organizations;
CREATE TRIGGER trigger_add_organization_owner
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION add_organization_owner();

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_organization_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_organization_members_updated_at ON organization_members;
CREATE TRIGGER trigger_update_organization_members_updated_at
  BEFORE UPDATE ON organization_members
  FOR EACH ROW
  EXECUTE FUNCTION update_organization_members_updated_at();

-- Insert existing organization creators as owners
INSERT INTO organization_members (organization_id, user_id, role, joined_at)
SELECT id, created_by, 'owner', created_at
FROM organizations
WHERE created_by IS NOT NULL
ON CONFLICT (organization_id, user_id) DO NOTHING;

-- Create helper functions for membership checks
CREATE OR REPLACE FUNCTION is_organization_member(org_id UUID, user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members 
    WHERE organization_id = org_id AND organization_members.user_id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_organizations(user_id UUID DEFAULT auth.uid())
RETURNS TABLE(organization_id UUID, role TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT om.organization_id, om.role
  FROM organization_members om
  WHERE om.user_id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user has specific role in organization
CREATE OR REPLACE FUNCTION has_organization_role(org_id UUID, required_role TEXT, user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members 
    WHERE organization_id = org_id 
    AND organization_members.user_id = user_id
    AND (
      role = required_role OR
      (required_role = 'member' AND role IN ('owner', 'admin', 'member')) OR
      (required_role = 'admin' AND role IN ('owner', 'admin')) OR
      (required_role = 'owner' AND role = 'owner')
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;