-- Create is_user_admin_of_org function
-- This function checks if the current user is an admin of the specified organization
-- Uses the existing has_organization_role function

CREATE OR REPLACE FUNCTION is_user_admin_of_org(p_org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN has_organization_role(p_org_id, 'admin', auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION is_user_admin_of_org(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_user_admin_of_org(UUID) TO anon;

-- Add comment
COMMENT ON FUNCTION is_user_admin_of_org IS 'Check if the current authenticated user is an admin of the specified organization';