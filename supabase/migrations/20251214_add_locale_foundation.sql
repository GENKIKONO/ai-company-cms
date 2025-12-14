-- Migration: Add locale foundation for future i18n support
-- Date: 2024-12-14
-- Purpose: Add minimal locale columns to support future /ja /en routing

-- 1. Add preferred_locale to profiles table
ALTER TABLE public.profiles 
ADD COLUMN preferred_locale TEXT NULL;

-- Add constraint for preferred_locale (ja/en only, NULL allowed)
ALTER TABLE public.profiles 
ADD CONSTRAINT chk_profiles_preferred_locale 
CHECK (preferred_locale IS NULL OR preferred_locale IN ('ja', 'en'));

-- 2. Add constraint to existing organizations.default_locale 
-- (Column already exists, just adding validation)
ALTER TABLE public.organizations 
ADD CONSTRAINT chk_organizations_default_locale 
CHECK (default_locale IS NULL OR default_locale IN ('ja', 'en'));

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.preferred_locale IS 'User preferred locale (ja/en), NULL means inherit from organization';
COMMENT ON COLUMN public.organizations.default_locale IS 'Organization default locale (ja/en), NULL means fallback to ja';