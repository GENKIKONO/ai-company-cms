-- Add is_published column to content tables for publication control
-- Created: 2025-10-13
-- Fix missing publication controls for services, posts, case_studies, faqs

-- Add is_published column to services table
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT false;

-- Add is_published column to posts table  
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT false;

-- Add is_published column to case_studies table
ALTER TABLE public.case_studies
ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT false;

-- Add is_published column to faqs table
ALTER TABLE public.faqs
ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT false;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_services_is_published ON public.services(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_posts_is_published ON public.posts(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_case_studies_is_published ON public.case_studies(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_faqs_is_published ON public.faqs(is_published) WHERE is_published = true;

-- Update existing records to be published (for current data compatibility)
UPDATE public.services SET is_published = true WHERE is_published = false;
UPDATE public.posts SET is_published = true WHERE is_published = false AND status = 'published';
UPDATE public.case_studies SET is_published = true WHERE is_published = false;
UPDATE public.faqs SET is_published = true WHERE is_published = false;

-- Add comments for documentation
COMMENT ON COLUMN public.services.is_published IS 'Whether the service is publicly visible';
COMMENT ON COLUMN public.posts.is_published IS 'Whether the post is publicly visible';
COMMENT ON COLUMN public.case_studies.is_published IS 'Whether the case study is publicly visible';
COMMENT ON COLUMN public.faqs.is_published IS 'Whether the FAQ is publicly visible';

-- Update the updated_at timestamp to ensure migration is tracked
UPDATE public.services SET updated_at = NOW() WHERE TRUE;
UPDATE public.posts SET updated_at = NOW() WHERE TRUE;
UPDATE public.case_studies SET updated_at = NOW() WHERE TRUE;
UPDATE public.faqs SET updated_at = NOW() WHERE TRUE;