-- ヒアリング代行依頼システム
-- 作成日: 2025-10-07
-- 目的: 企業ヒアリング代行による情報構造化サービス

-- ヒアリング依頼ステータス enum
CREATE TYPE hearing_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');

-- ヒアリング依頼テーブル
CREATE TABLE public.hearing_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status hearing_status DEFAULT 'pending',
    
    -- 依頼内容
    purpose TEXT NOT NULL CHECK (char_length(purpose) >= 10 AND char_length(purpose) <= 1000),
    preferred_date DATE,
    contact_phone TEXT,
    contact_email TEXT,
    
    -- ヒアリング項目
    business_overview BOOLEAN DEFAULT FALSE,
    service_details BOOLEAN DEFAULT FALSE,
    case_studies BOOLEAN DEFAULT FALSE,
    competitive_advantage BOOLEAN DEFAULT FALSE,
    target_market BOOLEAN DEFAULT FALSE,
    
    -- 進捗管理
    assigned_to UUID REFERENCES auth.users(id),
    scheduled_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- メモ・成果物
    admin_notes TEXT,
    interview_summary TEXT,
    deliverables_url TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス追加
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hearing_requests_organization_id ON public.hearing_requests(organization_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hearing_requests_requester_id ON public.hearing_requests(requester_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hearing_requests_status ON public.hearing_requests(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hearing_requests_assigned_to ON public.hearing_requests(assigned_to);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hearing_requests_created_at ON public.hearing_requests(created_at DESC);

-- RLS ポリシー設定
ALTER TABLE public.hearing_requests ENABLE ROW LEVEL SECURITY;

-- 依頼者は自分の依頼のみ閲覧・更新可能
CREATE POLICY "Users can view own hearing requests" ON public.hearing_requests
    FOR SELECT
    USING (requester_id = auth.uid());

CREATE POLICY "Users can create hearing requests" ON public.hearing_requests
    FOR INSERT
    WITH CHECK (
        requester_id = auth.uid() 
        AND EXISTS (
            SELECT 1 FROM public.organizations 
            WHERE organizations.id = organization_id 
            AND organizations.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can update own hearing requests" ON public.hearing_requests
    FOR UPDATE
    USING (requester_id = auth.uid())
    WITH CHECK (requester_id = auth.uid());

-- 管理者は全件閲覧・更新可能
CREATE POLICY "Admins can view all hearing requests" ON public.hearing_requests
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can update all hearing requests" ON public.hearing_requests
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- 更新トリガー
CREATE OR REPLACE FUNCTION update_hearing_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER hearing_requests_updated_at_trigger
    BEFORE UPDATE ON public.hearing_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_hearing_requests_updated_at();

-- コメント追加
COMMENT ON TABLE public.hearing_requests IS 'ヒアリング代行依頼管理テーブル';
COMMENT ON COLUMN public.hearing_requests.organization_id IS '対象組織ID';
COMMENT ON COLUMN public.hearing_requests.requester_id IS '依頼者のユーザーID';
COMMENT ON COLUMN public.hearing_requests.purpose IS '依頼目的・背景';
COMMENT ON COLUMN public.hearing_requests.preferred_date IS '希望実施日';
COMMENT ON COLUMN public.hearing_requests.business_overview IS '事業概要ヒアリング';
COMMENT ON COLUMN public.hearing_requests.service_details IS 'サービス詳細ヒアリング';
COMMENT ON COLUMN public.hearing_requests.case_studies IS '事例・実績ヒアリング';
COMMENT ON COLUMN public.hearing_requests.competitive_advantage IS '競合優位性ヒアリング';
COMMENT ON COLUMN public.hearing_requests.target_market IS 'ターゲット市場ヒアリング';