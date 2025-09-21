-- LuxuCare AI企業CMSシステム - 初期スキーマ
-- 作成日: 2025-09-21
-- 説明: 多言語対応企業ディレクトリシステムのデータベース設計

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE organization_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE user_role AS ENUM ('admin', 'editor', 'viewer');
CREATE TYPE partnership_type AS ENUM ('strategic', 'technology', 'distribution', 'investment');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role user_role DEFAULT 'viewer',
    organization_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organizations table (企業情報)
CREATE TABLE public.organizations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    legal_form TEXT, -- 法人格（株式会社、有限会社等）
    representative_name TEXT, -- 代表者名
    founded DATE,
    capital BIGINT, -- 資本金
    employees INTEGER,
    
    -- Address information
    address_country TEXT DEFAULT 'Japan',
    address_region TEXT, -- 都道府県
    address_locality TEXT, -- 市区町村
    address_postal_code TEXT,
    address_street TEXT, -- 番地・建物名
    
    -- Contact information
    telephone TEXT,
    email TEXT,
    email_public BOOLEAN DEFAULT false,
    url TEXT,
    logo_url TEXT,
    
    -- Business information
    industries TEXT[], -- 業界タグ
    same_as TEXT[], -- 関連URL（SNS、Wikipedia等）
    
    -- System fields
    status organization_status DEFAULT 'draft',
    partner_id UUID, -- パートナー企業ID
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- SEO fields
    meta_title TEXT,
    meta_description TEXT,
    meta_keywords TEXT[]
);

-- Services table (サービス情報)
CREATE TABLE public.services (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    features TEXT[], -- 機能一覧
    categories TEXT[], -- カテゴリ
    price_range TEXT, -- 価格帯
    url TEXT,
    logo_url TEXT,
    screenshots TEXT[], -- スクリーンショットURL
    
    -- Technical details
    supported_platforms TEXT[], -- 対応プラットフォーム
    api_available BOOLEAN DEFAULT false,
    free_trial BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Case studies table (導入事例)
CREATE TABLE public.case_studies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    problem TEXT, -- 課題
    solution TEXT, -- ソリューション
    outcome TEXT, -- 成果
    metrics JSONB, -- 定量的な成果（JSON形式）
    client_name TEXT,
    client_industry TEXT,
    client_size TEXT, -- 企業規模
    is_anonymous BOOLEAN DEFAULT false,
    published_date DATE,
    url TEXT,
    thumbnail_url TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- FAQs table (よくある質問)
CREATE TABLE public.faqs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT,
    order_index INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partners table (パートナー企業)
CREATE TABLE public.partners (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    website_url TEXT,
    logo_url TEXT,
    brand_logo_url TEXT, -- ブランドロゴ
    contact_email TEXT,
    partnership_type partnership_type,
    contract_start_date DATE,
    contract_end_date DATE,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partnership relationships table (企業間提携関係)
CREATE TABLE public.partnerships (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_a_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    organization_b_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    partnership_type partnership_type,
    description TEXT,
    started_at DATE,
    ended_at DATE,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_a_id, organization_b_id, partnership_type)
);

-- News and updates table (ニュース・更新情報)
CREATE TABLE public.news (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    summary TEXT,
    category TEXT, -- プレスリリース、製品更新、イベント等
    published_date DATE,
    url TEXT,
    image_url TEXT,
    is_featured BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User favorites table (お気に入り)
CREATE TABLE public.user_favorites (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, organization_id)
);

-- User saved searches table (保存した検索)
CREATE TABLE public.user_saved_searches (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    search_params JSONB NOT NULL, -- 検索パラメータ
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics events table (アナリティクス)
CREATE TABLE public.analytics_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    session_id TEXT,
    event_name TEXT NOT NULL,
    event_properties JSONB,
    page_url TEXT,
    user_agent TEXT,
    ip_address INET,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_organizations_slug ON public.organizations(slug);
CREATE INDEX idx_organizations_status ON public.organizations(status);
CREATE INDEX idx_organizations_industries ON public.organizations USING GIN(industries);
CREATE INDEX idx_organizations_created_at ON public.organizations(created_at);
CREATE INDEX idx_organizations_partner_id ON public.organizations(partner_id);

CREATE INDEX idx_services_organization_id ON public.services(organization_id);
CREATE INDEX idx_services_categories ON public.services USING GIN(categories);

CREATE INDEX idx_case_studies_organization_id ON public.case_studies(organization_id);
CREATE INDEX idx_case_studies_service_id ON public.case_studies(service_id);
CREATE INDEX idx_case_studies_published_date ON public.case_studies(published_date);

CREATE INDEX idx_faqs_organization_id ON public.faqs(organization_id);
CREATE INDEX idx_faqs_service_id ON public.faqs(service_id);
CREATE INDEX idx_faqs_order_index ON public.faqs(order_index);

CREATE INDEX idx_partnerships_org_a ON public.partnerships(organization_a_id);
CREATE INDEX idx_partnerships_org_b ON public.partnerships(organization_b_id);
CREATE INDEX idx_partnerships_active ON public.partnerships(is_active);

CREATE INDEX idx_news_organization_id ON public.news(organization_id);
CREATE INDEX idx_news_published_date ON public.news(published_date);
CREATE INDEX idx_news_featured ON public.news(is_featured);

CREATE INDEX idx_user_favorites_user_id ON public.user_favorites(user_id);
CREATE INDEX idx_user_favorites_org_id ON public.user_favorites(organization_id);

CREATE INDEX idx_analytics_events_created_at ON public.analytics_events(created_at);
CREATE INDEX idx_analytics_events_event_name ON public.analytics_events(event_name);
CREATE INDEX idx_analytics_events_user_id ON public.analytics_events(user_id);

-- Add foreign key constraint for organization_id in users table
ALTER TABLE public.users ADD CONSTRAINT fk_users_organization 
    FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL;

-- Add foreign key constraint for partner_id in organizations table  
ALTER TABLE public.organizations ADD CONSTRAINT fk_organizations_partner
    FOREIGN KEY (partner_id) REFERENCES public.partners(id) ON DELETE SET NULL;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_case_studies_updated_at BEFORE UPDATE ON public.case_studies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_faqs_updated_at BEFORE UPDATE ON public.faqs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_partners_updated_at BEFORE UPDATE ON public.partners 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_partnerships_updated_at BEFORE UPDATE ON public.partnerships 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_news_updated_at BEFORE UPDATE ON public.news 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_saved_searches_updated_at BEFORE UPDATE ON public.user_saved_searches 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();