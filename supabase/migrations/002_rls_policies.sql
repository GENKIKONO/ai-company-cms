-- Row Level Security (RLS) Policies
-- LuxuCare AI企業CMSシステム
-- セキュリティポリシーの設定

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partnerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Helper functions
CREATE OR REPLACE FUNCTION public.user_role()
RETURNS user_role AS $$
  SELECT COALESCE(
    (SELECT role FROM public.users WHERE id = auth.uid()),
    'viewer'::user_role
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT public.user_role() = 'admin'::user_role;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_editor_or_admin()
RETURNS boolean AS $$
  SELECT public.user_role() IN ('admin'::user_role, 'editor'::user_role);
$$ LANGUAGE sql SECURITY DEFINER;

-- Grant execute permissions for helper functions
GRANT EXECUTE ON FUNCTION public.user_role() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_editor_or_admin() TO anon, authenticated;

-- Users table policies
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT USING (public.is_admin());

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can update all users" ON public.users
    FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can insert users" ON public.users
    FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete users" ON public.users
    FOR DELETE USING (public.is_admin());

-- Organizations table policies
CREATE POLICY "Anyone can view published organizations" ON public.organizations
    FOR SELECT USING (status = 'published');

CREATE POLICY "Editors and admins can view all organizations" ON public.organizations
    FOR SELECT USING (public.is_editor_or_admin());

CREATE POLICY "Editors and admins can insert organizations" ON public.organizations
    FOR INSERT WITH CHECK (public.is_editor_or_admin());

CREATE POLICY "Editors and admins can update organizations" ON public.organizations
    FOR UPDATE USING (public.is_editor_or_admin());

CREATE POLICY "Admins can delete organizations" ON public.organizations
    FOR DELETE USING (public.is_admin());

-- Services table policies
CREATE POLICY "Anyone can view services of published organizations" ON public.services
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.organizations 
            WHERE id = services.organization_id 
            AND status = 'published'
        )
    );

CREATE POLICY "Editors and admins can view all services" ON public.services
    FOR SELECT USING (public.is_editor_or_admin());

CREATE POLICY "Editors and admins can insert services" ON public.services
    FOR INSERT WITH CHECK (public.is_editor_or_admin());

CREATE POLICY "Editors and admins can update services" ON public.services
    FOR UPDATE USING (public.is_editor_or_admin());

CREATE POLICY "Editors and admins can delete services" ON public.services
    FOR DELETE USING (public.is_editor_or_admin());

-- Case studies table policies
CREATE POLICY "Anyone can view case studies of published organizations" ON public.case_studies
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.organizations 
            WHERE id = case_studies.organization_id 
            AND status = 'published'
        )
    );

CREATE POLICY "Editors and admins can view all case studies" ON public.case_studies
    FOR SELECT USING (public.is_editor_or_admin());

CREATE POLICY "Editors and admins can insert case studies" ON public.case_studies
    FOR INSERT WITH CHECK (public.is_editor_or_admin());

CREATE POLICY "Editors and admins can update case studies" ON public.case_studies
    FOR UPDATE USING (public.is_editor_or_admin());

CREATE POLICY "Editors and admins can delete case studies" ON public.case_studies
    FOR DELETE USING (public.is_editor_or_admin());

-- FAQs table policies
CREATE POLICY "Anyone can view FAQs of published organizations" ON public.faqs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.organizations 
            WHERE id = faqs.organization_id 
            AND status = 'published'
        )
    );

CREATE POLICY "Editors and admins can view all FAQs" ON public.faqs
    FOR SELECT USING (public.is_editor_or_admin());

CREATE POLICY "Editors and admins can insert FAQs" ON public.faqs
    FOR INSERT WITH CHECK (public.is_editor_or_admin());

CREATE POLICY "Editors and admins can update FAQs" ON public.faqs
    FOR UPDATE USING (public.is_editor_or_admin());

CREATE POLICY "Editors and admins can delete FAQs" ON public.faqs
    FOR DELETE USING (public.is_editor_or_admin());

-- Partners table policies
CREATE POLICY "Anyone can view active partners" ON public.partners
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can view all partners" ON public.partners
    FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can insert partners" ON public.partners
    FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update partners" ON public.partners
    FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete partners" ON public.partners
    FOR DELETE USING (public.is_admin());

-- Partnerships table policies
CREATE POLICY "Anyone can view active partnerships of published organizations" ON public.partnerships
    FOR SELECT USING (
        is_active = true AND
        EXISTS (
            SELECT 1 FROM public.organizations 
            WHERE id IN (partnerships.organization_a_id, partnerships.organization_b_id)
            AND status = 'published'
        )
    );

CREATE POLICY "Editors and admins can view all partnerships" ON public.partnerships
    FOR SELECT USING (public.is_editor_or_admin());

CREATE POLICY "Editors and admins can insert partnerships" ON public.partnerships
    FOR INSERT WITH CHECK (public.is_editor_or_admin());

CREATE POLICY "Editors and admins can update partnerships" ON public.partnerships
    FOR UPDATE USING (public.is_editor_or_admin());

CREATE POLICY "Editors and admins can delete partnerships" ON public.partnerships
    FOR DELETE USING (public.is_editor_or_admin());

-- News table policies
CREATE POLICY "Anyone can view news of published organizations" ON public.news
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.organizations 
            WHERE id = news.organization_id 
            AND status = 'published'
        )
    );

CREATE POLICY "Editors and admins can view all news" ON public.news
    FOR SELECT USING (public.is_editor_or_admin());

CREATE POLICY "Editors and admins can insert news" ON public.news
    FOR INSERT WITH CHECK (public.is_editor_or_admin());

CREATE POLICY "Editors and admins can update news" ON public.news
    FOR UPDATE USING (public.is_editor_or_admin());

CREATE POLICY "Editors and admins can delete news" ON public.news
    FOR DELETE USING (public.is_editor_or_admin());

-- User favorites table policies
CREATE POLICY "Users can view their own favorites" ON public.user_favorites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites" ON public.user_favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" ON public.user_favorites
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all favorites" ON public.user_favorites
    FOR SELECT USING (public.is_admin());

-- User saved searches table policies
CREATE POLICY "Users can view their own saved searches" ON public.user_saved_searches
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved searches" ON public.user_saved_searches
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved searches" ON public.user_saved_searches
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved searches" ON public.user_saved_searches
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all saved searches" ON public.user_saved_searches
    FOR SELECT USING (public.is_admin());

-- Analytics events table policies
CREATE POLICY "Admins can view all analytics events" ON public.analytics_events
    FOR SELECT USING (public.is_admin());

CREATE POLICY "Anyone can insert analytics events" ON public.analytics_events
    FOR INSERT WITH CHECK (true);

-- Grant appropriate permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Anonymous users (public access)
GRANT SELECT ON public.organizations TO anon;
GRANT SELECT ON public.services TO anon;
GRANT SELECT ON public.case_studies TO anon;
GRANT SELECT ON public.faqs TO anon;
GRANT SELECT ON public.partners TO anon;
GRANT SELECT ON public.partnerships TO anon;
GRANT SELECT ON public.news TO anon;
GRANT INSERT ON public.analytics_events TO anon;

-- Authenticated users
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.organizations TO authenticated;
GRANT ALL ON public.services TO authenticated;
GRANT ALL ON public.case_studies TO authenticated;
GRANT ALL ON public.faqs TO authenticated;
GRANT ALL ON public.partners TO authenticated;
GRANT ALL ON public.partnerships TO authenticated;
GRANT ALL ON public.news TO authenticated;
GRANT ALL ON public.user_favorites TO authenticated;
GRANT ALL ON public.user_saved_searches TO authenticated;
GRANT ALL ON public.analytics_events TO authenticated;
