-- Add is_published column to organizations table
-- This migration adds the missing is_published boolean column
-- Production deployment: Execute in Supabase SQL Editor

BEGIN;

-- Check if column already exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'organizations' 
        AND column_name = 'is_published'
        AND table_schema = 'public'
    ) THEN
        -- Add is_published column with default false
        ALTER TABLE public.organizations 
        ADD COLUMN is_published BOOLEAN NOT NULL DEFAULT false;
        
        RAISE NOTICE 'Added is_published column to organizations table';
    ELSE
        RAISE NOTICE 'Column is_published already exists in organizations table';
    END IF;
END $$;

-- Create index for published organizations queries
CREATE INDEX IF NOT EXISTS organizations_is_published_idx 
ON public.organizations(is_published);

-- Update existing organizations to be published (if any exist)
-- Comment out if you want existing organizations to remain unpublished
UPDATE public.organizations 
SET is_published = true 
WHERE is_published = false;

RAISE NOTICE 'Migration completed: is_published column added to organizations table';

COMMIT;