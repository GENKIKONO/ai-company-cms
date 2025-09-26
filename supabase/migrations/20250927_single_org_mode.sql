-- Single-Org Mode Migration
-- 各ユーザーは1つの企業のみ作成・管理できるように制限
-- Created: 2025-09-27

-- Step 1: Handle existing duplicate data (if any)
-- For duplicate created_by entries, keep the most recently updated one
WITH duplicate_orgs AS (
  SELECT created_by, COUNT(*) as org_count
  FROM public.organizations 
  WHERE created_by IS NOT NULL
  GROUP BY created_by
  HAVING COUNT(*) > 1
),
orgs_to_keep AS (
  SELECT DISTINCT ON (o.created_by) o.id
  FROM public.organizations o
  INNER JOIN duplicate_orgs d ON o.created_by = d.created_by
  ORDER BY o.created_by, o.updated_at DESC
),
orgs_to_delete AS (
  SELECT o.id
  FROM public.organizations o
  INNER JOIN duplicate_orgs d ON o.created_by = d.created_by
  WHERE o.id NOT IN (SELECT id FROM orgs_to_keep)
)
-- Set created_by to NULL for duplicates (don't delete, just orphan them)
UPDATE public.organizations 
SET created_by = NULL, 
    updated_at = NOW()
WHERE id IN (SELECT id FROM orgs_to_delete);

-- Step 2: Add unique constraint on organizations.created_by
-- This ensures each user can only create one organization
ALTER TABLE public.organizations 
ADD CONSTRAINT unique_organizations_created_by 
UNIQUE (created_by);

-- Step 3: Add RLS policies for Single-Org Mode
-- Policy for users to view their own organization
CREATE POLICY "Users can view own organization" ON public.organizations
  FOR SELECT USING (
    auth.uid() = created_by
  );

-- Policy for users to insert their organization (only if they don't have one)
CREATE POLICY "Users can create one organization" ON public.organizations
  FOR INSERT WITH CHECK (
    auth.uid() = created_by AND
    NOT EXISTS (
      SELECT 1 FROM public.organizations 
      WHERE created_by = auth.uid()
    )
  );

-- Policy for users to update their own organization
CREATE POLICY "Users can update own organization" ON public.organizations
  FOR UPDATE USING (
    auth.uid() = created_by
  );

-- Policy for users to delete their own organization (if needed)
CREATE POLICY "Users can delete own organization" ON public.organizations
  FOR DELETE USING (
    auth.uid() = created_by
  );

-- Step 4: Create helper function for Single-Org Mode
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS UUID AS $$
  SELECT id FROM public.organizations 
  WHERE created_by = auth.uid() 
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Grant execute permission for the helper function
GRANT EXECUTE ON FUNCTION public.get_user_organization_id() TO authenticated;

-- Step 5: Add index for performance
CREATE INDEX IF NOT EXISTS idx_organizations_created_by_single_org 
ON public.organizations(created_by) 
WHERE created_by IS NOT NULL;

-- Step 6: Add constraint comment for documentation
COMMENT ON CONSTRAINT unique_organizations_created_by ON public.organizations 
IS 'Single-Org Mode: Each user can only create and manage one organization';

-- Step 7: Add column comment
COMMENT ON COLUMN public.organizations.created_by 
IS 'Single-Org Mode: User who created this organization (unique per user)';