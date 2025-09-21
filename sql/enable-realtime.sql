-- Enable real-time functionality for the organizations table
ALTER PUBLICATION supabase_realtime ADD TABLE organizations;

-- Create a function to handle real-time collaboration events
CREATE OR REPLACE FUNCTION handle_collaboration_event()
RETURNS TRIGGER AS $$
BEGIN
  -- Log collaboration events
  INSERT INTO collaboration_events (
    organization_id,
    user_id,
    event_type,
    field_path,
    old_value,
    new_value,
    timestamp
  ) VALUES (
    NEW.id,
    auth.uid(),
    TG_OP,
    'organization_update',
    to_jsonb(OLD),
    to_jsonb(NEW),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create collaboration events table
CREATE TABLE IF NOT EXISTS collaboration_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  field_path TEXT,
  old_value JSONB,
  new_value JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_collaboration_events_org_id ON collaboration_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_events_user_id ON collaboration_events(user_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_events_timestamp ON collaboration_events(timestamp);

-- Enable RLS on collaboration events
ALTER TABLE collaboration_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for collaboration events
CREATE POLICY "Users can view collaboration events for organizations they can access"
  ON collaboration_events FOR SELECT
  USING (
    organization_id IN (
      SELECT id FROM organizations 
      WHERE (visibility = 'public') 
         OR (visibility = 'private' AND created_by = auth.uid())
         OR (id IN (
           SELECT organization_id FROM organization_access 
           WHERE user_id = auth.uid()
         ))
    )
  );

CREATE POLICY "Users can insert collaboration events for organizations they can edit"
  ON collaboration_events FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT id FROM organizations 
      WHERE (created_by = auth.uid())
         OR (id IN (
           SELECT organization_id FROM organization_access 
           WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor')
         ))
    )
  );

-- Create trigger for collaboration events
DROP TRIGGER IF EXISTS collaboration_event_trigger ON organizations;
CREATE TRIGGER collaboration_event_trigger
  AFTER UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION handle_collaboration_event();

-- Function to get active collaborators for an organization
CREATE OR REPLACE FUNCTION get_active_collaborators(org_id UUID)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  last_activity TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    ce.user_id,
    u.email,
    u.raw_user_meta_data->>'full_name' as full_name,
    u.raw_user_meta_data->>'avatar_url' as avatar_url,
    MAX(ce.timestamp) as last_activity
  FROM collaboration_events ce
  JOIN auth.users u ON ce.user_id = u.id
  WHERE ce.organization_id = org_id
    AND ce.timestamp > NOW() - INTERVAL '30 minutes'
  GROUP BY ce.user_id, u.email, u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'avatar_url'
  ORDER BY last_activity DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old collaboration events
CREATE OR REPLACE FUNCTION cleanup_old_collaboration_events()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM collaboration_events
  WHERE timestamp < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create organization access table for fine-grained permissions
CREATE TABLE IF NOT EXISTS organization_access (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  access_level TEXT NOT NULL CHECK (access_level IN ('viewer', 'editor', 'admin')),
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Enable RLS on organization access
ALTER TABLE organization_access ENABLE ROW LEVEL SECURITY;

-- RLS policies for organization access
CREATE POLICY "Users can view access for organizations they can access"
  ON organization_access FOR SELECT
  USING (
    organization_id IN (
      SELECT id FROM organizations 
      WHERE (visibility = 'public') 
         OR (visibility = 'private' AND created_by = auth.uid())
         OR (id IN (
           SELECT organization_id FROM organization_access 
           WHERE user_id = auth.uid()
         ))
    )
  );

CREATE POLICY "Organization owners can manage access"
  ON organization_access FOR ALL
  USING (
    organization_id IN (
      SELECT id FROM organizations 
      WHERE created_by = auth.uid()
    )
  );

-- Grant default access to organization creators
CREATE OR REPLACE FUNCTION grant_creator_access()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO organization_access (organization_id, user_id, access_level, granted_by)
  VALUES (NEW.id, NEW.created_by, 'admin', NEW.created_by)
  ON CONFLICT (organization_id, user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically grant access to organization creators
DROP TRIGGER IF EXISTS grant_creator_access_trigger ON organizations;
CREATE TRIGGER grant_creator_access_trigger
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION grant_creator_access();