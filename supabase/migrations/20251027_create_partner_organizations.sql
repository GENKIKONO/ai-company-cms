-- Create partner organization management system
-- This implements complete partner access control for multi-tenant support

-- Create partner_organizations table
CREATE TABLE IF NOT EXISTS partner_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  access_level TEXT NOT NULL DEFAULT 'read' CHECK (access_level IN ('read', 'write', 'admin')),
  permissions JSONB DEFAULT '[]'::JSONB, -- Specific permissions array
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- Optional expiration
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(partner_user_id, organization_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_partner_organizations_partner_user ON partner_organizations(partner_user_id);
CREATE INDEX IF NOT EXISTS idx_partner_organizations_organization ON partner_organizations(organization_id);
CREATE INDEX IF NOT EXISTS idx_partner_organizations_access_level ON partner_organizations(access_level);
CREATE INDEX IF NOT EXISTS idx_partner_organizations_active ON partner_organizations(is_active);
CREATE INDEX IF NOT EXISTS idx_partner_organizations_expires ON partner_organizations(expires_at);

-- Enable RLS
ALTER TABLE partner_organizations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for partner_organizations

-- 1. Partners can view their own assignments
CREATE POLICY "partners_view_own_assignments" ON partner_organizations
  FOR SELECT USING (
    partner_user_id = auth.uid()
  );

-- 2. Organization owners can view partner assignments for their organizations
CREATE POLICY "owners_view_partner_assignments" ON partner_organizations
  FOR SELECT USING (
    organization_id IN (
      SELECT id FROM organizations WHERE created_by = auth.uid()
    )
  );

-- 3. Organization owners can assign partners to their organizations
CREATE POLICY "owners_assign_partners" ON partner_organizations
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT id FROM organizations WHERE created_by = auth.uid()
    )
  );

-- 4. Organization owners can update partner assignments
CREATE POLICY "owners_update_partner_assignments" ON partner_organizations
  FOR UPDATE USING (
    organization_id IN (
      SELECT id FROM organizations WHERE created_by = auth.uid()
    )
  );

-- 5. Organization owners can remove partner assignments
-- Partners can also remove themselves
CREATE POLICY "owners_remove_partner_assignments" ON partner_organizations
  FOR DELETE USING (
    organization_id IN (
      SELECT id FROM organizations WHERE created_by = auth.uid()
    ) OR partner_user_id = auth.uid()
  );

-- 6. Admins have full access
CREATE POLICY "admin_full_access_partner_assignments" ON partner_organizations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM app_users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_partner_organizations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_partner_organizations_updated_at ON partner_organizations;
CREATE TRIGGER trigger_update_partner_organizations_updated_at
  BEFORE UPDATE ON partner_organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_partner_organizations_updated_at();

-- Create helper functions for partner access checks

-- Check if user is partner with access to organization
CREATE OR REPLACE FUNCTION is_partner_with_access(org_id UUID, required_level TEXT DEFAULT 'read', user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM partner_organizations 
    WHERE organization_id = org_id 
    AND partner_user_id = user_id
    AND is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (
      (required_level = 'read' AND access_level IN ('read', 'write', 'admin')) OR
      (required_level = 'write' AND access_level IN ('write', 'admin')) OR
      (required_level = 'admin' AND access_level = 'admin')
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get partner organizations for user
CREATE OR REPLACE FUNCTION get_partner_organizations(user_id UUID DEFAULT auth.uid())
RETURNS TABLE(organization_id UUID, access_level TEXT, permissions JSONB) AS $$
BEGIN
  RETURN QUERY
  SELECT po.organization_id, po.access_level, po.permissions
  FROM partner_organizations po
  WHERE po.partner_user_id = user_id
  AND po.is_active = TRUE
  AND (po.expires_at IS NULL OR po.expires_at > NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user has specific permission for organization
CREATE OR REPLACE FUNCTION has_partner_permission(org_id UUID, permission TEXT, user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM partner_organizations 
    WHERE organization_id = org_id 
    AND partner_user_id = user_id
    AND is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (
      access_level = 'admin' OR
      permissions ? permission
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing RLS policies to include partner access

-- Update organizations RLS to include partner access
DROP POLICY IF EXISTS "organizations_partner_select" ON organizations;
CREATE POLICY "organizations_partner_select" ON organizations
  FOR SELECT USING (
    -- Partners with read access can view
    id IN (
      SELECT organization_id FROM partner_organizations 
      WHERE partner_user_id = auth.uid() 
      AND is_active = TRUE
      AND (expires_at IS NULL OR expires_at > NOW())
    )
  );

-- Update services RLS to include partner access  
DROP POLICY IF EXISTS "services_partner_access" ON services;
CREATE POLICY "services_partner_access" ON services
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM partner_organizations 
      WHERE partner_user_id = auth.uid() 
      AND is_active = TRUE
      AND (expires_at IS NULL OR expires_at > NOW())
      AND access_level IN ('write', 'admin')
    )
  );

DROP POLICY IF EXISTS "services_partner_read" ON services;
CREATE POLICY "services_partner_read" ON services
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM partner_organizations 
      WHERE partner_user_id = auth.uid() 
      AND is_active = TRUE
      AND (expires_at IS NULL OR expires_at > NOW())
    )
  );

-- Update case_studies RLS to include partner access
DROP POLICY IF EXISTS "case_studies_partner_access" ON case_studies;
CREATE POLICY "case_studies_partner_access" ON case_studies
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM partner_organizations 
      WHERE partner_user_id = auth.uid() 
      AND is_active = TRUE
      AND (expires_at IS NULL OR expires_at > NOW())
      AND access_level IN ('write', 'admin')
    )
  );

DROP POLICY IF EXISTS "case_studies_partner_read" ON case_studies;
CREATE POLICY "case_studies_partner_read" ON case_studies
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM partner_organizations 
      WHERE partner_user_id = auth.uid() 
      AND is_active = TRUE
      AND (expires_at IS NULL OR expires_at > NOW())
    )
  );

-- Update faqs RLS to include partner access
DROP POLICY IF EXISTS "faqs_partner_access" ON faqs;
CREATE POLICY "faqs_partner_access" ON faqs
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM partner_organizations 
      WHERE partner_user_id = auth.uid() 
      AND is_active = TRUE
      AND (expires_at IS NULL OR expires_at > NOW())
      AND access_level IN ('write', 'admin')
    )
  );

DROP POLICY IF EXISTS "faqs_partner_read" ON faqs;
CREATE POLICY "faqs_partner_read" ON faqs
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM partner_organizations 
      WHERE partner_user_id = auth.uid() 
      AND is_active = TRUE
      AND (expires_at IS NULL OR expires_at > NOW())
    )
  );

-- Update posts RLS to include partner access
DROP POLICY IF EXISTS "posts_partner_access" ON posts;
CREATE POLICY "posts_partner_access" ON posts
  FOR ALL USING (
    org_id IN (
      SELECT organization_id FROM partner_organizations 
      WHERE partner_user_id = auth.uid() 
      AND is_active = TRUE
      AND (expires_at IS NULL OR expires_at > NOW())
      AND access_level IN ('write', 'admin')
    )
  );

DROP POLICY IF EXISTS "posts_partner_read" ON posts;
CREATE POLICY "posts_partner_read" ON posts
  FOR SELECT USING (
    org_id IN (
      SELECT organization_id FROM partner_organizations 
      WHERE partner_user_id = auth.uid() 
      AND is_active = TRUE
      AND (expires_at IS NULL OR expires_at > NOW())
    )
  );

-- Create function to assign partner to organization
CREATE OR REPLACE FUNCTION assign_partner_to_organization(
  org_id UUID,
  partner_email TEXT,
  access_level TEXT DEFAULT 'read',
  permissions JSONB DEFAULT '[]'::JSONB,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  partner_user_id UUID;
  assignment_id UUID;
BEGIN
  -- Get partner user ID from email
  SELECT id INTO partner_user_id FROM auth.users WHERE email = partner_email;
  
  IF partner_user_id IS NULL THEN
    RAISE EXCEPTION 'Partner user not found: %', partner_email;
  END IF;
  
  -- Check if current user can assign partners to this organization
  IF NOT EXISTS (
    SELECT 1 FROM organizations WHERE id = org_id AND created_by = auth.uid()
  ) AND NOT EXISTS (
    SELECT 1 FROM app_users WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions to assign partner';
  END IF;
  
  -- Insert or update partner assignment
  INSERT INTO partner_organizations (
    organization_id, partner_user_id, access_level, permissions, 
    assigned_by, expires_at, is_active
  ) VALUES (
    org_id, partner_user_id, access_level, permissions,
    auth.uid(), expires_at, TRUE
  )
  ON CONFLICT (partner_user_id, organization_id) 
  DO UPDATE SET
    access_level = EXCLUDED.access_level,
    permissions = EXCLUDED.permissions,
    assigned_by = EXCLUDED.assigned_by,
    expires_at = EXCLUDED.expires_at,
    is_active = TRUE,
    updated_at = NOW()
  RETURNING id INTO assignment_id;
  
  RETURN assignment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Partner organizations system created successfully';
END $$;