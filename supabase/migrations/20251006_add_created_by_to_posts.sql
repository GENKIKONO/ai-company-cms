-- Add created_by column to posts table and update RLS policies
-- This migration ensures created_by is always set by the application (API Route)
-- instead of relying on auth.uid() default, which doesn't work with direct API calls

-- ================================
-- ADD CREATED_BY COLUMN TO POSTS
-- ================================

-- Add created_by column (NOT NULL, no default - must be set by application)
ALTER TABLE public.posts 
  ADD COLUMN IF NOT EXISTS created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_posts_created_by ON public.posts(created_by);

-- ================================
-- UPDATE RLS POLICIES FOR POSTS
-- ================================

-- Drop existing INSERT policy and create a new one that checks created_by
DROP POLICY IF EXISTS "Users can insert own org posts" ON public.posts;

-- New INSERT policy: user must own the organization AND created_by must be auth.uid()
CREATE POLICY "Users can insert own org posts" ON public.posts
  FOR INSERT WITH CHECK (
    -- User owns the organization
    organization_id IN (
      SELECT id FROM public.organizations WHERE created_by = auth.uid()
    )
    -- AND created_by must be the current user
    AND created_by = auth.uid()
  );

-- Update other policies to also check created_by for additional security
DROP POLICY IF EXISTS "Users can update own org posts" ON public.posts;
CREATE POLICY "Users can update own org posts" ON public.posts
  FOR UPDATE USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE created_by = auth.uid()
    )
    AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS "Users can delete own org posts" ON public.posts;
CREATE POLICY "Users can delete own org posts" ON public.posts
  FOR DELETE USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE created_by = auth.uid()
    )
    AND created_by = auth.uid()
  );

-- SELECT policy remains the same (users can view any post from their org)
-- "Users can view own org posts" policy is already correct

-- ================================
-- COMMENTS FOR DOCUMENTATION
-- ================================
COMMENT ON COLUMN public.posts.created_by IS 'User who created this post - must be set by application, not database default';

-- Notify PostgREST to reload schema
SELECT pg_notify('pgrst', 'reload schema');