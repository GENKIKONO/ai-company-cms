-- =====================================================
-- LuxuCare AI企業CMS 本番データベース完全セットアップ
-- 実行順序: Supabase SQL Editor で全てを一度に実行
-- =====================================================

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Custom Types
DO $$ BEGIN
    CREATE TYPE organization_status AS ENUM ('draft', 'pending', 'published', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('viewer', 'editor', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE partnership_type AS ENUM ('technology', 'business', 'integration');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Helper Function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'viewer',
    organization_id UUID,
    name TEXT,
    avatar_url TEXT,
    stripe_customer_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Organizations Table
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    website TEXT,
    industry TEXT[],
    founded_year INTEGER,
    employee_count TEXT,
    headquarters TEXT,
    logo_url TEXT,
    status organization_status DEFAULT 'draft',
    contact_email TEXT,
    contact_phone TEXT,
    address_prefecture TEXT,
    address_city TEXT,
    address_line1 TEXT,
    address_line2 TEXT,
    address_postal_code TEXT,
    subscription_status TEXT DEFAULT 'none',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Services Table
CREATE TABLE IF NOT EXISTS public.services (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    price_range TEXT,
    features TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Case Studies Table
CREATE TABLE IF NOT EXISTS public.case_studies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    challenge TEXT,
    solution TEXT,
    results TEXT,
    client_name TEXT,
    industry TEXT,
    completion_date DATE,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. FAQs Table
CREATE TABLE IF NOT EXISTS public.faqs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Partners Table
CREATE TABLE IF NOT EXISTS public.partners (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    website TEXT,
    logo_url TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Partnerships Table
CREATE TABLE IF NOT EXISTS public.partnerships (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE,
    type partnership_type NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, partner_id)
);

-- 11. News Table
CREATE TABLE IF NOT EXISTS public.news (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    excerpt TEXT,
    published_date DATE,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. User Favorites Table
CREATE TABLE IF NOT EXISTS public.user_favorites (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, organization_id)
);

-- 13. User Saved Searches Table
CREATE TABLE IF NOT EXISTS public.user_saved_searches (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    search_params JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Analytics Events Table
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Stripe Tables
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id TEXT PRIMARY KEY,
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id),
    stripe_subscription_id TEXT UNIQUE,
    stripe_customer_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    price_id TEXT,
    metadata JSONB,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.stripe_customers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    stripe_customer_id TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id)
);

CREATE TABLE IF NOT EXISTS public.webhook_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    stripe_event_id TEXT UNIQUE NOT NULL,
    event_type TEXT NOT NULL,
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMPTZ,
    retry_count INTEGER DEFAULT 0,
    last_attempt TIMESTAMPTZ,
    error_message TEXT,
    event_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Add Foreign Key to Users
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'users_organization_id_fkey'
    ) THEN
        ALTER TABLE public.users ADD CONSTRAINT users_organization_id_fkey 
            FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 17. Create Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON public.users(organization_id);

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_status ON public.organizations(status);
CREATE INDEX IF NOT EXISTS idx_organizations_industry ON public.organizations USING GIN(industry);

CREATE INDEX IF NOT EXISTS idx_services_organization_id ON public.services(organization_id);
CREATE INDEX IF NOT EXISTS idx_case_studies_organization_id ON public.case_studies(organization_id);
CREATE INDEX IF NOT EXISTS idx_faqs_organization_id ON public.faqs(organization_id);
CREATE INDEX IF NOT EXISTS idx_partnerships_organization_id ON public.partnerships(organization_id);
CREATE INDEX IF NOT EXISTS idx_news_organization_id ON public.news(organization_id);

CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON public.user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_organization_id ON public.user_favorites(organization_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON public.user_saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_organization_id ON public.analytics_events(organization_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_org_id ON public.subscriptions(org_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_org_id ON public.stripe_customers(organization_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_stripe_id ON public.stripe_customers(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_stripe_id ON public.webhook_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON public.webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON public.webhook_events(created_at);

-- 18. Create Updated_at Triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_organizations_updated_at ON public.organizations;
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_services_updated_at ON public.services;
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_case_studies_updated_at ON public.case_studies;
CREATE TRIGGER update_case_studies_updated_at BEFORE UPDATE ON public.case_studies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_faqs_updated_at ON public.faqs;
CREATE TRIGGER update_faqs_updated_at BEFORE UPDATE ON public.faqs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_partners_updated_at ON public.partners;
CREATE TRIGGER update_partners_updated_at BEFORE UPDATE ON public.partners 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_partnerships_updated_at ON public.partnerships;
CREATE TRIGGER update_partnerships_updated_at BEFORE UPDATE ON public.partnerships 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_news_updated_at ON public.news;
CREATE TRIGGER update_news_updated_at BEFORE UPDATE ON public.news 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_saved_searches_updated_at ON public.user_saved_searches;
CREATE TRIGGER update_saved_searches_updated_at BEFORE UPDATE ON public.user_saved_searches 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_stripe_customers_updated_at ON public.stripe_customers;
CREATE TRIGGER update_stripe_customers_updated_at BEFORE UPDATE ON public.stripe_customers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 19. Helper Functions for RLS
CREATE OR REPLACE FUNCTION public.user_role()
RETURNS user_role AS $$
BEGIN
    RETURN (
        SELECT role FROM public.users 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.user_role() = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_editor_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.user_role() IN ('editor', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 20. Enable RLS
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
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- 21. RLS Policies

-- Users policies
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
CREATE POLICY "Users can view own data" ON public.users
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own data" ON public.users;
CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;
CREATE POLICY "Admins can manage all users" ON public.users
    FOR ALL USING (public.is_admin());

-- Organizations policies
DROP POLICY IF EXISTS "Public organizations are viewable by everyone" ON public.organizations;
CREATE POLICY "Public organizations are viewable by everyone" ON public.organizations
    FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "Users can view their organization" ON public.organizations;
CREATE POLICY "Users can view their organization" ON public.organizations
    FOR SELECT USING (
        id IN (
            SELECT organization_id FROM public.users WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Editors and admins can view all organizations" ON public.organizations;
CREATE POLICY "Editors and admins can view all organizations" ON public.organizations
    FOR SELECT USING (public.is_editor_or_admin());

DROP POLICY IF EXISTS "Editors and admins can create organizations" ON public.organizations;
CREATE POLICY "Editors and admins can create organizations" ON public.organizations
    FOR INSERT WITH CHECK (public.is_editor_or_admin());

DROP POLICY IF EXISTS "Editors and admins can update organizations" ON public.organizations;
CREATE POLICY "Editors and admins can update organizations" ON public.organizations
    FOR UPDATE USING (public.is_editor_or_admin());

DROP POLICY IF EXISTS "Admins can delete organizations" ON public.organizations;
CREATE POLICY "Admins can delete organizations" ON public.organizations
    FOR DELETE USING (public.is_admin());

-- Services policies
DROP POLICY IF EXISTS "Public services are viewable" ON public.services;
CREATE POLICY "Public services are viewable" ON public.services
    FOR SELECT USING (
        organization_id IN (
            SELECT id FROM public.organizations WHERE status = 'published'
        )
    );

DROP POLICY IF EXISTS "Editors and admins can view all services" ON public.services;
CREATE POLICY "Editors and admins can view all services" ON public.services
    FOR SELECT USING (public.is_editor_or_admin());

DROP POLICY IF EXISTS "Editors and admins can manage services" ON public.services;
CREATE POLICY "Editors and admins can manage services" ON public.services
    FOR ALL USING (public.is_editor_or_admin());

-- Case studies policies
DROP POLICY IF EXISTS "Public case studies are viewable" ON public.case_studies;
CREATE POLICY "Public case studies are viewable" ON public.case_studies
    FOR SELECT USING (
        organization_id IN (
            SELECT id FROM public.organizations WHERE status = 'published'
        )
    );

DROP POLICY IF EXISTS "Editors and admins can view all case studies" ON public.case_studies;
CREATE POLICY "Editors and admins can view all case studies" ON public.case_studies
    FOR SELECT USING (public.is_editor_or_admin());

DROP POLICY IF EXISTS "Editors and admins can manage case studies" ON public.case_studies;
CREATE POLICY "Editors and admins can manage case studies" ON public.case_studies
    FOR ALL USING (public.is_editor_or_admin());

-- FAQs policies
DROP POLICY IF EXISTS "Public FAQs are viewable" ON public.faqs;
CREATE POLICY "Public FAQs are viewable" ON public.faqs
    FOR SELECT USING (
        organization_id IN (
            SELECT id FROM public.organizations WHERE status = 'published'
        )
    );

DROP POLICY IF EXISTS "Editors and admins can view all FAQs" ON public.faqs;
CREATE POLICY "Editors and admins can view all FAQs" ON public.faqs
    FOR SELECT USING (public.is_editor_or_admin());

DROP POLICY IF EXISTS "Editors and admins can manage FAQs" ON public.faqs;
CREATE POLICY "Editors and admins can manage FAQs" ON public.faqs
    FOR ALL USING (public.is_editor_or_admin());

-- Partners policies
DROP POLICY IF EXISTS "Partners are viewable by everyone" ON public.partners;
CREATE POLICY "Partners are viewable by everyone" ON public.partners
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Editors and admins can manage partners" ON public.partners;
CREATE POLICY "Editors and admins can manage partners" ON public.partners
    FOR ALL USING (public.is_editor_or_admin());

-- Partnerships policies
DROP POLICY IF EXISTS "Public partnerships are viewable" ON public.partnerships;
CREATE POLICY "Public partnerships are viewable" ON public.partnerships
    FOR SELECT USING (
        organization_id IN (
            SELECT id FROM public.organizations WHERE status = 'published'
        )
    );

DROP POLICY IF EXISTS "Editors and admins can view all partnerships" ON public.partnerships;
CREATE POLICY "Editors and admins can view all partnerships" ON public.partnerships
    FOR SELECT USING (public.is_editor_or_admin());

DROP POLICY IF EXISTS "Editors and admins can manage partnerships" ON public.partnerships;
CREATE POLICY "Editors and admins can manage partnerships" ON public.partnerships
    FOR ALL USING (public.is_editor_or_admin());

-- News policies
DROP POLICY IF EXISTS "Public news are viewable" ON public.news;
CREATE POLICY "Public news are viewable" ON public.news
    FOR SELECT USING (
        organization_id IN (
            SELECT id FROM public.organizations WHERE status = 'published'
        )
    );

DROP POLICY IF EXISTS "Editors and admins can view all news" ON public.news;
CREATE POLICY "Editors and admins can view all news" ON public.news
    FOR SELECT USING (public.is_editor_or_admin());

DROP POLICY IF EXISTS "Editors and admins can manage news" ON public.news;
CREATE POLICY "Editors and admins can manage news" ON public.news
    FOR ALL USING (public.is_editor_or_admin());

-- User favorites policies
DROP POLICY IF EXISTS "Users can manage their own favorites" ON public.user_favorites;
CREATE POLICY "Users can manage their own favorites" ON public.user_favorites
    FOR ALL USING (auth.uid() = user_id);

-- User saved searches policies
DROP POLICY IF EXISTS "Users can manage their own saved searches" ON public.user_saved_searches;
CREATE POLICY "Users can manage their own saved searches" ON public.user_saved_searches
    FOR ALL USING (auth.uid() = user_id);

-- Analytics events policies
DROP POLICY IF EXISTS "Analytics events are insertable by everyone" ON public.analytics_events;
CREATE POLICY "Analytics events are insertable by everyone" ON public.analytics_events
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view analytics events" ON public.analytics_events;
CREATE POLICY "Admins can view analytics events" ON public.analytics_events
    FOR SELECT USING (public.is_admin());

-- Subscriptions policies
DROP POLICY IF EXISTS "Users can view their organization's subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view their organization's subscriptions" ON public.subscriptions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.organizations 
            WHERE id = subscriptions.org_id 
            AND id IN (
                SELECT organization_id FROM public.users WHERE id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Editors and admins can view all subscriptions" ON public.subscriptions;
CREATE POLICY "Editors and admins can view all subscriptions" ON public.subscriptions
    FOR SELECT USING (public.is_editor_or_admin());

DROP POLICY IF EXISTS "System can manage subscriptions" ON public.subscriptions;
CREATE POLICY "System can manage subscriptions" ON public.subscriptions
    FOR ALL USING (true);

-- Stripe customers policies
DROP POLICY IF EXISTS "Users can view their organization's stripe data" ON public.stripe_customers;
CREATE POLICY "Users can view their organization's stripe data" ON public.stripe_customers
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.users WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Editors and admins can view all stripe customers" ON public.stripe_customers;
CREATE POLICY "Editors and admins can view all stripe customers" ON public.stripe_customers
    FOR SELECT USING (public.is_editor_or_admin());

DROP POLICY IF EXISTS "System can manage stripe customers" ON public.stripe_customers;
CREATE POLICY "System can manage stripe customers" ON public.stripe_customers
    FOR ALL USING (true);

-- Webhook events policies
DROP POLICY IF EXISTS "Admins can view webhook events" ON public.webhook_events;
CREATE POLICY "Admins can view webhook events" ON public.webhook_events
    FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "System can manage webhook events" ON public.webhook_events;
CREATE POLICY "System can manage webhook events" ON public.webhook_events
    FOR ALL USING (true);

-- 22. Grant Permissions
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
GRANT ALL ON public.subscriptions TO authenticated;
GRANT ALL ON public.stripe_customers TO authenticated;
GRANT ALL ON public.webhook_events TO authenticated;

GRANT SELECT ON public.organizations TO anon;
GRANT SELECT ON public.services TO anon;
GRANT SELECT ON public.case_studies TO anon;
GRANT SELECT ON public.faqs TO anon;
GRANT SELECT ON public.partners TO anon;
GRANT SELECT ON public.partnerships TO anon;
GRANT SELECT ON public.news TO anon;
GRANT INSERT ON public.analytics_events TO anon;

-- =====================================================
-- セットアップ完了！
-- =====================================================