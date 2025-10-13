-- Fix duration column naming inconsistency
-- Created: 2025-10-13
-- Fix services table duration column naming

-- Check if 'duration' column exists and rename it to 'duration_months'
DO $$
BEGIN
    -- Check if 'duration' column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'services' 
        AND column_name = 'duration'
        AND table_schema = 'public'
    ) THEN
        -- Check if 'duration_months' doesn't already exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'services' 
            AND column_name = 'duration_months'
            AND table_schema = 'public'
        ) THEN
            -- Rename 'duration' to 'duration_months'
            ALTER TABLE public.services RENAME COLUMN duration TO duration_months;
            RAISE NOTICE 'Renamed duration column to duration_months';
        ELSE
            -- If both exist, drop the old 'duration' column
            ALTER TABLE public.services DROP COLUMN IF EXISTS duration;
            RAISE NOTICE 'Dropped duplicate duration column';
        END IF;
    END IF;
    
    -- Ensure duration_months exists with correct type
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'services' 
        AND column_name = 'duration_months'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.services ADD COLUMN duration_months INTEGER;
        RAISE NOTICE 'Added duration_months column';
    END IF;
END $$;

-- Update column comment
COMMENT ON COLUMN public.services.duration_months IS 'Service duration in months (nullable)';

-- Update the updated_at timestamp to ensure migration is tracked
UPDATE public.services SET updated_at = NOW() WHERE TRUE;