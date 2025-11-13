-- Organization Groups Migration
-- Creates tables for enterprise group functionality with RLS and audit triggers

-- organization_groups: Main group entity
CREATE TABLE organization_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL CHECK (length(name) >= 2 AND length(name) <= 100),
    owner_org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    description TEXT CHECK (length(description) <= 500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_group_name_per_owner UNIQUE (owner_org_id, name)
);

-- org_group_members: Members of groups
CREATE TABLE org_group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES organization_groups(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
    added_by UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_group_member UNIQUE (group_id, org_id)
);

-- org_group_invites: Invite codes for groups
CREATE TABLE org_group_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES organization_groups(id) ON DELETE CASCADE,
    code TEXT NOT NULL UNIQUE CHECK (length(code) >= 8 AND length(code) <= 32),
    issued_by UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    max_uses INTEGER NOT NULL DEFAULT 1 CHECK (max_uses > 0),
    used_count INTEGER NOT NULL DEFAULT 0 CHECK (used_count >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_usage CHECK (used_count <= max_uses),
    CONSTRAINT future_expiry CHECK (expires_at > NOW())
);

-- org_group_join_requests: Join requests using codes
CREATE TABLE org_group_join_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES organization_groups(id) ON DELETE CASCADE,
    applicant_org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    decided_at TIMESTAMP WITH TIME ZONE,
    decided_by UUID REFERENCES organizations(id),
    message TEXT CHECK (length(message) <= 1000),
    
    -- Constraints
    CONSTRAINT unique_pending_request UNIQUE (group_id, applicant_org_id, status) DEFERRABLE INITIALLY DEFERRED,
    CONSTRAINT decided_when_not_pending CHECK (
        (status = 'pending' AND decided_at IS NULL AND decided_by IS NULL) OR
        (status != 'pending' AND decided_at IS NOT NULL AND decided_by IS NOT NULL)
    )
);

-- Indexes for performance
CREATE INDEX idx_org_groups_owner ON organization_groups(owner_org_id);
CREATE INDEX idx_org_groups_name ON organization_groups(name);
CREATE INDEX idx_group_members_group ON org_group_members(group_id);
CREATE INDEX idx_group_members_org ON org_group_members(org_id);
CREATE INDEX idx_group_invites_code ON org_group_invites(code);
CREATE INDEX idx_group_invites_expires ON org_group_invites(expires_at);
CREATE INDEX idx_join_requests_group ON org_group_join_requests(group_id);
CREATE INDEX idx_join_requests_status ON org_group_join_requests(status);
CREATE INDEX idx_join_requests_applicant ON org_group_join_requests(applicant_org_id);

-- Updated at trigger function (reuse existing)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger
CREATE TRIGGER update_organization_groups_updated_at
    BEFORE UPDATE ON organization_groups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- organization_groups RLS
ALTER TABLE organization_groups ENABLE ROW LEVEL SECURITY;

-- Groups: Owners can manage, members can read
CREATE POLICY "Groups: owners full access" ON organization_groups
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_organizations uo
            JOIN profiles p ON p.id = uo.user_id
            WHERE p.id = auth.uid() 
            AND uo.organization_id = owner_org_id
            AND uo.role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Groups: members read access" ON organization_groups
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM org_group_members ogm
            JOIN user_organizations uo ON uo.organization_id = ogm.org_id
            JOIN profiles p ON p.id = uo.user_id
            WHERE p.id = auth.uid()
            AND ogm.group_id = id
        )
    );

-- org_group_members RLS
ALTER TABLE org_group_members ENABLE ROW LEVEL SECURITY;

-- Group members: Group admins can manage, members can read
CREATE POLICY "Group members: group admins manage" ON org_group_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM organization_groups og
            JOIN user_organizations uo ON uo.organization_id = og.owner_org_id
            JOIN profiles p ON p.id = uo.user_id
            WHERE p.id = auth.uid()
            AND og.id = group_id
            AND uo.role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Group members: members read" ON org_group_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_organizations uo
            JOIN profiles p ON p.id = uo.user_id
            WHERE p.id = auth.uid()
            AND uo.organization_id = org_id
        ) OR
        EXISTS (
            SELECT 1 FROM org_group_members ogm2
            JOIN user_organizations uo ON uo.organization_id = ogm2.org_id
            JOIN profiles p ON p.id = uo.user_id
            WHERE p.id = auth.uid()
            AND ogm2.group_id = group_id
        )
    );

-- org_group_invites RLS
ALTER TABLE org_group_invites ENABLE ROW LEVEL SECURITY;

-- Invites: Group owners can manage, everyone can read for join attempts
CREATE POLICY "Group invites: owners manage" ON org_group_invites
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM organization_groups og
            JOIN user_organizations uo ON uo.organization_id = og.owner_org_id
            JOIN profiles p ON p.id = uo.user_id
            WHERE p.id = auth.uid()
            AND og.id = group_id
            AND uo.role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Group invites: public read for join" ON org_group_invites
    FOR SELECT USING (
        expires_at > NOW() AND used_count < max_uses
    );

-- org_group_join_requests RLS
ALTER TABLE org_group_join_requests ENABLE ROW LEVEL SECURITY;

-- Join requests: Group owners can manage, applicants can read their own
CREATE POLICY "Join requests: group owners manage" ON org_group_join_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM organization_groups og
            JOIN user_organizations uo ON uo.organization_id = og.owner_org_id
            JOIN profiles p ON p.id = uo.user_id
            WHERE p.id = auth.uid()
            AND og.id = group_id
            AND uo.role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Join requests: applicants read own" ON org_group_join_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_organizations uo
            JOIN profiles p ON p.id = uo.user_id
            WHERE p.id = auth.uid()
            AND uo.organization_id = applicant_org_id
        )
    );

CREATE POLICY "Join requests: applicants insert own" ON org_group_join_requests
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_organizations uo
            JOIN profiles p ON p.id = uo.user_id
            WHERE p.id = auth.uid()
            AND uo.organization_id = applicant_org_id
            AND uo.role IN ('owner', 'admin')
        )
    );

-- Audit logging for all tables
DO $$
DECLARE
    table_name TEXT;
BEGIN
    FOR table_name IN VALUES ('organization_groups'), ('org_group_members'), ('org_group_invites'), ('org_group_join_requests') LOOP
        -- Create audit table
        EXECUTE format('
            CREATE TABLE %I_audit (
                audit_id BIGSERIAL PRIMARY KEY,
                operation TEXT NOT NULL,
                changed_by UUID,
                changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                old_values JSONB,
                new_values JSONB,
                table_name TEXT DEFAULT %L
            )', table_name || '_audit', table_name);

        -- Create audit trigger function
        EXECUTE format('
            CREATE OR REPLACE FUNCTION %I_audit_trigger()
            RETURNS TRIGGER AS $func$
            BEGIN
                INSERT INTO %I_audit (
                    operation,
                    changed_by,
                    old_values,
                    new_values
                ) VALUES (
                    TG_OP,
                    auth.uid(),
                    CASE WHEN TG_OP != ''INSERT'' THEN row_to_json(OLD) ELSE NULL END,
                    CASE WHEN TG_OP != ''DELETE'' THEN row_to_json(NEW) ELSE NULL END
                );
                RETURN COALESCE(NEW, OLD);
            END;
            $func$ LANGUAGE plpgsql SECURITY DEFINER;
        ', table_name || '_audit', table_name || '_audit');

        -- Apply audit trigger
        EXECUTE format('
            CREATE TRIGGER %I_audit_trigger
                AFTER INSERT OR UPDATE OR DELETE ON %I
                FOR EACH ROW
                EXECUTE FUNCTION %I_audit_trigger();
        ', table_name || '_audit', table_name, table_name || '_audit');
    END LOOP;
END $$;

-- Helper functions for group operations

-- Function to check if organization is group member
CREATE OR REPLACE FUNCTION is_org_in_group(org_uuid UUID, group_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM org_group_members
        WHERE org_id = org_uuid AND group_id = group_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get organizations in same groups as given org
CREATE OR REPLACE FUNCTION get_group_sibling_orgs(org_uuid UUID)
RETURNS TABLE(org_id UUID, group_id UUID, group_name TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT 
        ogm2.org_id,
        ogm2.group_id,
        og.name as group_name
    FROM org_group_members ogm1
    JOIN org_group_members ogm2 ON ogm1.group_id = ogm2.group_id
    JOIN organization_groups og ON og.id = ogm1.group_id
    WHERE ogm1.org_id = org_uuid 
    AND ogm2.org_id != org_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate invite code and return group info
CREATE OR REPLACE FUNCTION validate_invite_code(invite_code TEXT)
RETURNS TABLE(
    group_id UUID,
    group_name TEXT,
    owner_org_id UUID,
    expires_at TIMESTAMP WITH TIME ZONE,
    remaining_uses INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        og.id,
        og.name,
        og.owner_org_id,
        ogi.expires_at,
        (ogi.max_uses - ogi.used_count) as remaining_uses
    FROM org_group_invites ogi
    JOIN organization_groups og ON og.id = ogi.group_id
    WHERE ogi.code = invite_code
    AND ogi.expires_at > NOW()
    AND ogi.used_count < ogi.max_uses;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON TABLE organization_groups IS 'Enterprise groups that contain multiple organizations';
COMMENT ON TABLE org_group_members IS 'Organizations that belong to groups';
COMMENT ON TABLE org_group_invites IS 'Invite codes for joining groups';
COMMENT ON TABLE org_group_join_requests IS 'Requests to join groups using invite codes';

COMMENT ON FUNCTION is_org_in_group IS 'Check if organization is member of group';
COMMENT ON FUNCTION get_group_sibling_orgs IS 'Get other organizations in same groups as given org';
COMMENT ON FUNCTION validate_invite_code IS 'Validate invite code and return group information';