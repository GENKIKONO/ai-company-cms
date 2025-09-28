-- Enhance services table with features, media, and CTA support
-- Created: 2025-09-28
-- Sprint 3, Task H1: Service CRUD with JSON-LD generation

-- Add new columns to services table
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS features TEXT[], -- Array of service features
ADD COLUMN IF NOT EXISTS media JSONB,      -- Associated media (images, videos)
ADD COLUMN IF NOT EXISTS cta_text TEXT,    -- Call-to-action text
ADD COLUMN IF NOT EXISTS cta_url TEXT;     -- Call-to-action URL

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_services_features ON public.services USING GIN(features);
CREATE INDEX IF NOT EXISTS idx_services_media ON public.services USING GIN(media);

-- Add constraints for CTA URL format validation
ALTER TABLE public.services 
ADD CONSTRAINT check_cta_url_format 
CHECK (cta_url IS NULL OR cta_url ~* '^https?://.*$');

-- Comments for documentation
COMMENT ON COLUMN public.services.features IS 'Array of service features and benefits';
COMMENT ON COLUMN public.services.media IS 'JSON array of media objects with type, url, alt_text, caption';
COMMENT ON COLUMN public.services.cta_text IS 'Call-to-action button text';
COMMENT ON COLUMN public.services.cta_url IS 'Call-to-action target URL (must be http/https)';

-- Update the updated_at timestamp to ensure migration is tracked
UPDATE public.services SET updated_at = NOW() WHERE TRUE;