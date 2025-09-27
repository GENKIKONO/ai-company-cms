-- Fix RLS Policy Conflicts for Single-Org Mode
-- Created: 2025-09-27
-- Purpose: Resolve conflicting RLS policies between role-based and Single-Org Mode access

-- Drop conflicting role-based organization policies
DROP POLICY IF EXISTS "Anyone can view published organizations" ON public.organizations;
DROP POLICY IF EXISTS "Editors and admins can view all organizations" ON public.organizations;
DROP POLICY IF EXISTS "Editors and admins can insert organizations" ON public.organizations;
DROP POLICY IF EXISTS "Editors and admins can update organizations" ON public.organizations;
DROP POLICY IF EXISTS "Admins can delete organizations" ON public.organizations;

-- Ensure Single-Org Mode policies exist (idempotent)
-- Policy 1: Public read access for published organizations
CREATE POLICY "Public can view published organizations" ON public.organizations
  FOR SELECT USING (
    status = 'published'
  );

-- Policy 2: Users can view their own organization (including drafts)
CREATE POLICY "Users can view own organization" ON public.organizations
  FOR SELECT USING (
    auth.uid() = created_by
  );

-- Policy 3: Users can create ONE organization (enforced by unique constraint)
DROP POLICY IF EXISTS "Users can create one organization" ON public.organizations;
CREATE POLICY "Users can create one organization" ON public.organizations
  FOR INSERT WITH CHECK (
    auth.uid() = created_by AND
    NOT EXISTS (
      SELECT 1 FROM public.organizations 
      WHERE created_by = auth.uid()
    )
  );

-- Policy 4: Users can update their own organization
DROP POLICY IF EXISTS "Users can update own organization" ON public.organizations;
CREATE POLICY "Users can update own organization" ON public.organizations
  FOR UPDATE USING (
    auth.uid() = created_by
  );

-- Policy 5: Users can delete their own organization
DROP POLICY IF EXISTS "Users can delete own organization" ON public.organizations;
CREATE POLICY "Users can delete own organization" ON public.organizations
  FOR DELETE USING (
    auth.uid() = created_by
  );

-- Policy 6: Admin override (keep for platform administration)
CREATE POLICY "Admins can manage all organizations" ON public.organizations
  FOR ALL USING (
    public.is_admin()
  );

-- Verify organizations table has the required created_by field with unique constraint
-- This should already exist from 20250927_single_org_mode.sql but let's ensure it
DO $$
BEGIN
  -- Check if constraint exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'unique_organizations_created_by' 
    AND table_name = 'organizations'
  ) THEN
    -- Add the constraint if missing
    ALTER TABLE public.organizations 
    ADD CONSTRAINT unique_organizations_created_by 
    UNIQUE (created_by);
  END IF;
END $$;

-- Ensure created_by column exists and is properly typed
DO $$
BEGIN
  -- Check if created_by column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'organizations' 
    AND column_name = 'created_by'
  ) THEN
    -- Add the column if missing
    ALTER TABLE public.organizations 
    ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for performance if not exists
CREATE INDEX IF NOT EXISTS idx_organizations_created_by_single_org 
ON public.organizations(created_by) 
WHERE created_by IS NOT NULL;

-- Update table comment to document Single-Org Mode
COMMENT ON TABLE public.organizations 
IS 'Single-Org Mode: Each authenticated user can create and manage exactly one organization. Public users can view published organizations.';

COMMENT ON COLUMN public.organizations.created_by 
IS 'Single-Org Mode: User who created this organization (unique per user, enforced by constraint)';