-- Migration: Add locale foundation for future i18n support
-- Date: 2024-12-14
-- Purpose: Add minimal locale columns to support future /ja /en routing

-- 1. Add preferred_locale to profiles table (idempotent)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS preferred_locale TEXT NULL;

-- Clean invalid data before adding constraint
UPDATE public.profiles 
SET preferred_locale = NULL 
WHERE preferred_locale IS NOT NULL 
  AND preferred_locale NOT IN ('ja', 'en');

-- Add constraint for preferred_locale (ja/en only, NULL allowed)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'public.profiles'::regclass 
    AND conname = 'chk_profiles_preferred_locale'
  ) THEN
    ALTER TABLE public.profiles 
    ADD CONSTRAINT chk_profiles_preferred_locale 
    CHECK (preferred_locale IS NULL OR preferred_locale IN ('ja', 'en'));
  END IF;
END $$;

-- 2. Clean organizations.default_locale invalid data before constraint
UPDATE public.organizations 
SET default_locale = NULL 
WHERE default_locale IS NOT NULL 
  AND default_locale NOT IN ('ja', 'en');

-- Add constraint to existing organizations.default_locale (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'public.organizations'::regclass 
    AND conname = 'chk_organizations_default_locale'
  ) THEN
    ALTER TABLE public.organizations 
    ADD CONSTRAINT chk_organizations_default_locale 
    CHECK (default_locale IS NULL OR default_locale IN ('ja', 'en'));
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.preferred_locale IS 'User preferred locale (ja/en), NULL means inherit from organization';
COMMENT ON COLUMN public.organizations.default_locale IS 'Organization default locale (ja/en), NULL means fallback to ja';