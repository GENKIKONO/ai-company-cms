-- Add section visibility control columns to organizations table
-- These columns control which sections are displayed on the public organization page

ALTER TABLE public.organizations 
  ADD COLUMN IF NOT EXISTS show_services BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_posts BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_case_studies BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_faqs BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_qa BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_news BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_partnership BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_contact BOOLEAN DEFAULT true;

-- Add comment for documentation
COMMENT ON COLUMN public.organizations.show_services IS 'Controls visibility of services section on public page';
COMMENT ON COLUMN public.organizations.show_posts IS 'Controls visibility of posts/articles section on public page';
COMMENT ON COLUMN public.organizations.show_case_studies IS 'Controls visibility of case studies section on public page';
COMMENT ON COLUMN public.organizations.show_faqs IS 'Controls visibility of FAQs section on public page';
COMMENT ON COLUMN public.organizations.show_qa IS 'Controls visibility of Q&A entries section on public page';
COMMENT ON COLUMN public.organizations.show_news IS 'Controls visibility of news section on public page';
COMMENT ON COLUMN public.organizations.show_partnership IS 'Controls visibility of partnership section on public page';
COMMENT ON COLUMN public.organizations.show_contact IS 'Controls visibility of contact information section on public page';