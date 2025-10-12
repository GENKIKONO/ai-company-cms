-- Q&A Knowledge System for AIO Hub (Fixed version)
-- Extends existing FAQ functionality with categories, content management, and JSON-LD support
-- Compatible with existing FAQ table, designed for gradual migration

-- Categories for organizing Q&A content
-- Supports both global (system-wide) and organization-specific categories
CREATE TABLE IF NOT EXISTS public.qa_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  visibility VARCHAR(20) DEFAULT 'org' CHECK (visibility IN ('global', 'org')),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES public.app_users(id),
  updated_by UUID REFERENCES public.app_users(id),
  
  -- Ensure unique slugs per organization (global categories have null org_id)
  UNIQUE(organization_id, slug),
  
  -- Global categories must have null organization_id
  CONSTRAINT global_categories_no_org CHECK (
    (visibility = 'global' AND organization_id IS NULL) OR 
    (visibility = 'org' AND organization_id IS NOT NULL)
  )
);

-- Enhanced Q&A entries with rich metadata and content management
CREATE TABLE IF NOT EXISTS public.qa_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.qa_categories(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMP WITH TIME ZONE,
  last_edited_by UUID NOT NULL REFERENCES public.app_users(id),
  last_edited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Content freshness tracking
  content_hash VARCHAR(64), -- SHA-256 hash for change detection
  refresh_suggested_at TIMESTAMP WITH TIME ZONE, -- When content should be reviewed
  
  -- JSON-LD cache (optional, for performance)
  jsonld_cache JSONB
);

-- Content update tracking and audit log
CREATE TABLE IF NOT EXISTS public.qa_content_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  qa_entry_id UUID REFERENCES public.qa_entries(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.qa_categories(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL CHECK (action IN (
    'create', 'update', 'publish', 'unpublish', 'archive', 'delete',
    'category_create', 'category_update', 'category_delete'
  )),
  actor_user_id UUID NOT NULL REFERENCES public.app_users(id),
  changes JSONB, -- Store what changed (field-level diff)
  note TEXT, -- Optional human-readable note
  metadata JSONB, -- Additional context (IP, user agent, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Question templates for guided content creation (future enhancement)
CREATE TABLE IF NOT EXISTS public.qa_question_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.qa_categories(id) ON DELETE CASCADE,
  template_text TEXT NOT NULL,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add search vector column after table creation (using English config as fallback)
ALTER TABLE public.qa_entries ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create function to update search vector
CREATE OR REPLACE FUNCTION update_qa_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', coalesce(NEW.question, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.answer, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(array_to_string(NEW.tags, ' '), '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update search vector
CREATE TRIGGER qa_entries_search_vector_trigger
  BEFORE INSERT OR UPDATE ON public.qa_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_qa_search_vector();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_qa_categories_org_active ON public.qa_categories(organization_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_qa_categories_visibility ON public.qa_categories(visibility, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_qa_entries_org_status ON public.qa_entries(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_qa_entries_category ON public.qa_entries(category_id) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_qa_entries_published ON public.qa_entries(published_at DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_qa_entries_updated ON public.qa_entries(last_edited_at DESC);
CREATE INDEX IF NOT EXISTS idx_qa_entries_search ON public.qa_entries USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_qa_entries_tags ON public.qa_entries USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_qa_logs_org_time ON public.qa_content_logs(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_qa_logs_qa_entry ON public.qa_content_logs(qa_entry_id, created_at DESC);

-- Row Level Security (RLS) Policies
ALTER TABLE public.qa_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qa_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qa_content_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qa_question_templates ENABLE ROW LEVEL SECURITY;

-- Categories: Users can see global categories + their org's categories
CREATE POLICY "qa_categories_select" ON public.qa_categories
  FOR SELECT
  TO authenticated
  USING (
    visibility = 'global' OR 
    (organization_id IS NOT NULL AND organization_id IN (
      SELECT organization_id FROM public.app_users WHERE id = auth.uid()
    ))
  );

-- Categories: Only users from the organization can modify org-specific categories
CREATE POLICY "qa_categories_insert" ON public.qa_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    visibility = 'org' AND
    organization_id IS NOT NULL AND
    organization_id IN (
      SELECT organization_id FROM public.app_users WHERE id = auth.uid()
    )
  );

CREATE POLICY "qa_categories_update" ON public.qa_categories
  FOR UPDATE
  TO authenticated
  USING (
    visibility = 'org' AND
    organization_id IS NOT NULL AND
    organization_id IN (
      SELECT organization_id FROM public.app_users WHERE id = auth.uid()
    )
  );

CREATE POLICY "qa_categories_delete" ON public.qa_categories
  FOR DELETE
  TO authenticated
  USING (
    visibility = 'org' AND
    organization_id IS NOT NULL AND
    organization_id IN (
      SELECT organization_id FROM public.app_users WHERE id = auth.uid()
    )
  );

-- Q&A Entries: Users can only access their organization's entries
CREATE POLICY "qa_entries_select" ON public.qa_entries
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.app_users WHERE id = auth.uid()
    )
  );

CREATE POLICY "qa_entries_insert" ON public.qa_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.app_users WHERE id = auth.uid()
    ) AND
    last_edited_by = auth.uid()
  );

CREATE POLICY "qa_entries_update" ON public.qa_entries
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.app_users WHERE id = auth.uid()
    )
  );

CREATE POLICY "qa_entries_delete" ON public.qa_entries
  FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.app_users WHERE id = auth.uid()
    )
  );

-- Content Logs: Users can only access their organization's logs
CREATE POLICY "qa_logs_select" ON public.qa_content_logs
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.app_users WHERE id = auth.uid()
    )
  );

CREATE POLICY "qa_logs_insert" ON public.qa_content_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.app_users WHERE id = auth.uid()
    ) AND
    actor_user_id = auth.uid()
  );

-- Question Templates: Access based on category permissions
CREATE POLICY "qa_templates_select" ON public.qa_question_templates
  FOR SELECT
  TO authenticated
  USING (
    category_id IN (
      SELECT id FROM public.qa_categories 
      WHERE visibility = 'global' OR organization_id IN (
        SELECT organization_id FROM public.app_users WHERE id = auth.uid()
      )
    )
  );

-- Update triggers for timestamp management
CREATE OR REPLACE FUNCTION update_qa_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER qa_categories_update_trigger
  BEFORE UPDATE ON public.qa_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_qa_updated_at();

CREATE TRIGGER qa_entries_update_trigger
  BEFORE UPDATE ON public.qa_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_qa_updated_at();

-- Function to generate content hash
CREATE OR REPLACE FUNCTION generate_qa_content_hash(question TEXT, answer TEXT, tags TEXT[])
RETURNS VARCHAR(64) AS $$
BEGIN
  RETURN encode(digest(question || '|' || answer || '|' || array_to_string(tags, ','), 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Insert some default global categories
INSERT INTO public.qa_categories (name, slug, description, visibility, sort_order, is_active) VALUES
  ('企業情報', 'company-info', '会社の基本情報、沿革、ビジョンなど', 'global', 1, true),
  ('サービス・製品', 'services-products', '提供するサービスや製品について', 'global', 2, true),
  ('採用・キャリア', 'careers', '採用情報、働き方、キャリア開発について', 'global', 3, true),
  ('技術・開発', 'technology', '技術スタック、開発プロセスについて', 'global', 4, true),
  ('福利厚生・環境', 'benefits-culture', '福利厚生、働く環境、企業文化について', 'global', 5, true),
  ('お客様向け', 'customer-support', 'お客様からのよくある質問', 'global', 6, true),
  ('その他', 'others', 'その他の質問', 'global', 99, true)
ON CONFLICT (organization_id, slug) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE public.qa_categories IS 'Categories for organizing Q&A content. Supports global templates and organization-specific categories.';
COMMENT ON TABLE public.qa_entries IS 'Enhanced Q&A entries with content management, versioning, and search capabilities.';
COMMENT ON TABLE public.qa_content_logs IS 'Audit log for Q&A content changes and updates.';
COMMENT ON TABLE public.qa_question_templates IS 'Templates to guide users in creating consistent Q&A content.';

COMMENT ON COLUMN public.qa_entries.search_vector IS 'Full-text search vector with weighted terms (question=A, answer=B, tags=C).';
COMMENT ON COLUMN public.qa_entries.content_hash IS 'SHA-256 hash of content for change detection and caching.';
COMMENT ON COLUMN public.qa_entries.refresh_suggested_at IS 'When this content should be reviewed for freshness.';
COMMENT ON COLUMN public.qa_entries.jsonld_cache IS 'Cached JSON-LD output for performance optimization.';