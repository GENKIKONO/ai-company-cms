-- Add media fields to services table
-- Created: 2025-10-13
-- Add image_url and video_url columns to services

-- Add image_url and video_url columns if they don't exist
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Add URL format validation constraints
ALTER TABLE public.services 
ADD CONSTRAINT IF NOT EXISTS check_image_url_format 
CHECK (image_url IS NULL OR image_url ~* '^https?://.*$');

ALTER TABLE public.services 
ADD CONSTRAINT IF NOT EXISTS check_video_url_format 
CHECK (video_url IS NULL OR video_url ~* '^https?://.*$');

-- Add indexes for media URLs for faster queries
CREATE INDEX IF NOT EXISTS idx_services_image_url ON public.services(image_url) WHERE image_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_services_video_url ON public.services(video_url) WHERE video_url IS NOT NULL;

-- Comments for documentation
COMMENT ON COLUMN public.services.image_url IS 'Service image URL (must be http/https)';
COMMENT ON COLUMN public.services.video_url IS 'Service video URL (must be http/https)';

-- Update the updated_at timestamp to ensure migration is tracked
UPDATE public.services SET updated_at = NOW() WHERE TRUE;