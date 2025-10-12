-- Fix organizations.created_by issue with trigger
-- Created: 2025-10-12
-- Purpose: Auto-populate created_by field using auth.uid()

BEGIN;

-- 1. Create a trigger function to auto-populate created_by
CREATE OR REPLACE FUNCTION public.auto_set_created_by()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Auto-set created_by to current auth user if not provided
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  
  -- Ensure created_by is set
  IF NEW.created_by IS NULL THEN
    RAISE EXCEPTION 'created_by cannot be null and no authenticated user found';
  END IF;
  
  RETURN NEW;
END;
$$;

-- 2. Create trigger for organizations table
DROP TRIGGER IF EXISTS set_created_by_trigger ON public.organizations;

CREATE TRIGGER set_created_by_trigger
  BEFORE INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_created_by();

-- 3. Make created_by nullable temporarily for easier insertion
ALTER TABLE public.organizations 
ALTER COLUMN created_by DROP NOT NULL;

-- 4. Update any existing organizations without created_by
UPDATE public.organizations 
SET created_by = (
  SELECT id FROM auth.users LIMIT 1
)
WHERE created_by IS NULL;

COMMIT;

-- Verification
DO $$
BEGIN
  RAISE NOTICE '✅ Organizations created_by trigger installed';
  RAISE NOTICE '   - Auto-populates created_by with auth.uid()';
  RAISE NOTICE '   - Allows NULL input, filled by trigger';
  RAISE NOTICE '   - Updated existing NULL values';
END $$;