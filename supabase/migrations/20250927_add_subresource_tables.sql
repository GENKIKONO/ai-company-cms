-- Add subresource tables for Single-Org Mode
-- Created: 2025-09-27
-- Tables: posts, services, case_studies, faqs

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ================================
-- POSTS TABLE
-- ================================
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content_markdown TEXT,
  content_html TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_posts_slug_per_org UNIQUE (organization_id, slug)
);

-- Indexes for posts
CREATE INDEX IF NOT EXISTS idx_posts_organization_id ON public.posts(organization_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON public.posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON public.posts(published_at) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_posts_slug ON public.posts(slug);

-- RLS for posts
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org posts" ON public.posts
  FOR SELECT USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert own org posts" ON public.posts
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT id FROM public.organizations WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update own org posts" ON public.posts
  FOR UPDATE USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete own org posts" ON public.posts
  FOR DELETE USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE created_by = auth.uid()
    )
  );

-- Public posts policy (for published posts)
CREATE POLICY "Anyone can view published posts" ON public.posts
  FOR SELECT USING (status = 'published');

-- ================================
-- SERVICES TABLE
-- ================================
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price INTEGER, -- Price in cents/yen (nullable)
  duration_months INTEGER, -- Duration in months (nullable)
  category TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for services
CREATE INDEX IF NOT EXISTS idx_services_organization_id ON public.services(organization_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON public.services(category);

-- RLS for services
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org services" ON public.services
  FOR SELECT USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert own org services" ON public.services
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT id FROM public.organizations WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update own org services" ON public.services
  FOR UPDATE USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete own org services" ON public.services
  FOR DELETE USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE created_by = auth.uid()
    )
  );

-- ================================
-- CASE STUDIES TABLE
-- ================================
CREATE TABLE IF NOT EXISTS public.case_studies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  problem TEXT,
  solution TEXT,
  result TEXT,
  tags TEXT[], -- Array of tags (nullable)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for case_studies
CREATE INDEX IF NOT EXISTS idx_case_studies_organization_id ON public.case_studies(organization_id);
CREATE INDEX IF NOT EXISTS idx_case_studies_tags ON public.case_studies USING GIN(tags);

-- RLS for case_studies
ALTER TABLE public.case_studies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org case studies" ON public.case_studies
  FOR SELECT USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert own org case studies" ON public.case_studies
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT id FROM public.organizations WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update own org case studies" ON public.case_studies
  FOR UPDATE USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete own org case studies" ON public.case_studies
  FOR DELETE USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE created_by = auth.uid()
    )
  );

-- ================================
-- FAQS TABLE
-- ================================
CREATE TABLE IF NOT EXISTS public.faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for faqs
CREATE INDEX IF NOT EXISTS idx_faqs_organization_id ON public.faqs(organization_id);
CREATE INDEX IF NOT EXISTS idx_faqs_sort_order ON public.faqs(organization_id, sort_order);

-- RLS for faqs
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org faqs" ON public.faqs
  FOR SELECT USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert own org faqs" ON public.faqs
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT id FROM public.organizations WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update own org faqs" ON public.faqs
  FOR UPDATE USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete own org faqs" ON public.faqs
  FOR DELETE USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE created_by = auth.uid()
    )
  );

-- ================================
-- UPDATED_AT TRIGGERS
-- ================================

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers for all tables
DROP TRIGGER IF EXISTS handle_updated_at_posts ON public.posts;
CREATE TRIGGER handle_updated_at_posts
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at_services ON public.services;
CREATE TRIGGER handle_updated_at_services
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at_case_studies ON public.case_studies;
CREATE TRIGGER handle_updated_at_case_studies
  BEFORE UPDATE ON public.case_studies
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at_faqs ON public.faqs;
CREATE TRIGGER handle_updated_at_faqs
  BEFORE UPDATE ON public.faqs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ================================
-- COMMENTS FOR DOCUMENTATION
-- ================================
COMMENT ON TABLE public.posts IS 'Blog posts and articles for organizations';
COMMENT ON TABLE public.services IS 'Services offered by organizations';
COMMENT ON TABLE public.case_studies IS 'Case studies and success stories';
COMMENT ON TABLE public.faqs IS 'Frequently asked questions for organizations';

COMMENT ON COLUMN public.posts.content_markdown IS 'Markdown source content';
COMMENT ON COLUMN public.posts.content_html IS 'HTML rendered content (generated from markdown)';
COMMENT ON COLUMN public.services.price IS 'Price in cents/yen (nullable)';
COMMENT ON COLUMN public.services.duration_months IS 'Service duration in months (nullable)';
COMMENT ON COLUMN public.case_studies.tags IS 'Array of tags for categorization';
COMMENT ON COLUMN public.faqs.sort_order IS 'Display order for FAQs within organization';