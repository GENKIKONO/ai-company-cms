-- 通報機能テーブル作成
-- 作成日: 2025-10-07
-- 目的: 組織コンテンツの不適切な内容に対する通報機能

-- 通報ステータス enum
CREATE TYPE report_status AS ENUM ('pending', 'reviewing', 'resolved', 'dismissed');

-- 通報タイプ enum  
CREATE TYPE report_type AS ENUM (
  'inappropriate_content', 
  'fake_information',
  'spam',
  'copyright_violation', 
  'harassment',
  'other'
);

-- 通報テーブル
CREATE TABLE public.reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    report_type report_type NOT NULL,
    description TEXT NOT NULL CHECK (char_length(description) >= 10 AND char_length(description) <= 1000),
    reported_url TEXT,
    reporter_ip TEXT,
    status report_status DEFAULT 'pending',
    admin_notes TEXT,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス追加
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reports_organization_id ON public.reports(organization_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reports_created_at ON public.reports(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reports_reporter_ip ON public.reports(reporter_ip);

-- RLS ポリシー設定
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 管理者のみ全件閲覧可能
CREATE POLICY "Admins can view all reports" ON public.reports
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- 管理者のみ更新可能
CREATE POLICY "Admins can update reports" ON public.reports
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- 匿名ユーザーは挿入のみ可能（public API経由）
CREATE POLICY "Anyone can create reports" ON public.reports
    FOR INSERT
    WITH CHECK (true);

-- 更新トリガー
CREATE OR REPLACE FUNCTION update_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reports_updated_at_trigger
    BEFORE UPDATE ON public.reports
    FOR EACH ROW
    EXECUTE FUNCTION update_reports_updated_at();

-- コメント追加
COMMENT ON TABLE public.reports IS '組織コンテンツの通報管理テーブル';
COMMENT ON COLUMN public.reports.organization_id IS '通報対象の組織ID';
COMMENT ON COLUMN public.reports.report_type IS '通報理由の分類';
COMMENT ON COLUMN public.reports.description IS '通報内容の詳細説明';
COMMENT ON COLUMN public.reports.reported_url IS '通報対象のURL';
COMMENT ON COLUMN public.reports.reporter_ip IS '通報者のIPアドレス（スパム防止用）';
COMMENT ON COLUMN public.reports.status IS '通報の処理状況';
COMMENT ON COLUMN public.reports.admin_notes IS '管理者による対応メモ';
COMMENT ON COLUMN public.reports.reviewed_by IS '対応した管理者のID';
COMMENT ON COLUMN public.reports.reviewed_at IS '対応完了日時';