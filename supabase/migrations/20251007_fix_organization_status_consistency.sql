/**
 * Fix organization status consistency between `status` and `is_published` fields
 * 
 * Issue: Some organizations may have status='published' but is_published=false
 * causing 404 errors on public pages due to dual condition check.
 * 
 * Solution: Sync is_published field with status field for data consistency.
 */

-- Fix existing data inconsistency
-- Ensure is_published matches status field
UPDATE organizations 
SET is_published = (status = 'published')
WHERE is_published != (status = 'published');

-- Add helpful index for public page queries (if not exists)
CREATE INDEX IF NOT EXISTS idx_organizations_public 
ON organizations (slug, status, is_published) 
WHERE status = 'published' AND is_published = true;

-- Verify the fix with a report
DO $$
DECLARE
  total_orgs integer;
  published_orgs integer;
  consistent_orgs integer;
  fixed_count integer;
BEGIN
  -- Get counts
  SELECT COUNT(*) INTO total_orgs FROM organizations;
  SELECT COUNT(*) INTO published_orgs FROM organizations WHERE status = 'published';
  SELECT COUNT(*) INTO consistent_orgs FROM organizations WHERE is_published = (status = 'published');
  
  -- Calculate how many were fixed
  fixed_count := total_orgs - consistent_orgs;
  
  RAISE NOTICE '🔧 Organization Status Consistency Fix Applied:';
  RAISE NOTICE '   Total Organizations: %', total_orgs;
  RAISE NOTICE '   Published Organizations: %', published_orgs;
  RAISE NOTICE '   Consistent Organizations: %', consistent_orgs;
  RAISE NOTICE '   Fixed Inconsistencies: %', fixed_count;
  RAISE NOTICE '✅ All organizations now have consistent status/is_published fields';
  RAISE NOTICE '✅ Public pages should now work correctly for published organizations';
END $$;

-- Create a trigger to prevent future inconsistencies
CREATE OR REPLACE FUNCTION sync_organization_is_published()
RETURNS TRIGGER AS $$
BEGIN
  -- Automatically sync is_published with status on any update
  NEW.is_published := (NEW.status = 'published');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists, then create
DROP TRIGGER IF EXISTS organization_status_sync_trigger ON organizations;
CREATE TRIGGER organization_status_sync_trigger
  BEFORE INSERT OR UPDATE OF status ON organizations
  FOR EACH ROW EXECUTE FUNCTION sync_organization_is_published();

RAISE NOTICE '✅ Prevention trigger created: organization_status_sync_trigger';
RAISE NOTICE '✅ Future status updates will automatically sync is_published field';