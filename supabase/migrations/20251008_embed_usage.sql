-- ===============================================
-- LuxuCare CMS 埋め込み使用状況追跡機能
-- Phase 2: 利用分析・プラン制御・管理機能
-- ===============================================

-- 1. 使用状況記録テーブル（生データ）
CREATE TABLE IF NOT EXISTS public.embed_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    widget_type TEXT NOT NULL CHECK (widget_type IN ('widget', 'iframe', 'html')),
    event_type TEXT NOT NULL CHECK (event_type IN ('load', 'click', 'error', 'resize')),
    source_url TEXT, -- 埋め込み元URL
    user_agent TEXT,
    ip_address INET, -- 匿名化済みIP
    response_time INTEGER, -- レスポンス時間（ms）
    error_message TEXT,
    custom_properties JSONB, -- 追加データ
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス（パフォーマンス最適化）
CREATE INDEX IF NOT EXISTS idx_embed_usage_org_id ON public.embed_usage(organization_id);
CREATE INDEX IF NOT EXISTS idx_embed_usage_created_at ON public.embed_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_embed_usage_widget_type ON public.embed_usage(widget_type);
CREATE INDEX IF NOT EXISTS idx_embed_usage_event_type ON public.embed_usage(event_type);
CREATE INDEX IF NOT EXISTS idx_embed_usage_org_date ON public.embed_usage(organization_id, created_at);

-- 2. 日次集計テーブル（高速クエリ用）
CREATE TABLE IF NOT EXISTS public.embed_usage_daily (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    widget_loads INTEGER DEFAULT 0,
    iframe_loads INTEGER DEFAULT 0,
    html_loads INTEGER DEFAULT 0,
    total_clicks INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    avg_response_time NUMERIC(10,2),
    unique_sources INTEGER DEFAULT 0,
    top_sources JSONB, -- [{"url": "...", "count": 123}]
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, date)
);

-- 日次集計インデックス
CREATE INDEX IF NOT EXISTS idx_embed_usage_daily_org_date ON public.embed_usage_daily(organization_id, date);

-- 3. 月次集計テーブル（プラン制限チェック用）
CREATE TABLE IF NOT EXISTS public.embed_usage_monthly (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    month TEXT NOT NULL, -- YYYY-MM形式
    total_views INTEGER DEFAULT 0,
    widget_views INTEGER DEFAULT 0,
    iframe_views INTEGER DEFAULT 0,
    html_views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    top_sources JSONB,
    error_rate NUMERIC(5,4), -- エラー率 (0.0000-1.0000)
    avg_response_time NUMERIC(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, month)
);

-- 月次集計インデックス
CREATE INDEX IF NOT EXISTS idx_embed_usage_monthly_org_month ON public.embed_usage_monthly(organization_id, month);

-- 4. 埋め込み設定管理テーブル
CREATE TABLE IF NOT EXISTS public.embed_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- 埋め込み設定名
    widget_type TEXT NOT NULL CHECK (widget_type IN ('widget', 'iframe', 'html')),
    theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
    size TEXT DEFAULT 'medium' CHECK (size IN ('small', 'medium', 'large')),
    show_logo BOOLEAN DEFAULT true,
    show_description BOOLEAN DEFAULT true,
    show_services BOOLEAN DEFAULT false,
    custom_css TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 埋め込み設定インデックス
CREATE INDEX IF NOT EXISTS idx_embed_configurations_org_id ON public.embed_configurations(organization_id);
CREATE INDEX IF NOT EXISTS idx_embed_configurations_active ON public.embed_configurations(organization_id, is_active);

-- ===============================================
-- RLS (Row Level Security) ポリシー
-- ===============================================

-- 使用状況記録テーブルのRLS
ALTER TABLE public.embed_usage ENABLE ROW LEVEL SECURITY;

-- 読み取り: 組織メンバー or 管理者
CREATE POLICY "embed_usage_read" ON public.embed_usage
FOR SELECT USING (
    is_admin() OR
    EXISTS (
        SELECT 1 FROM public.organizations o
        WHERE o.id = embed_usage.organization_id
        AND o.created_by = auth.uid()
    )
);

-- 書き込み: システムのみ（アプリケーションレベルで制御）
CREATE POLICY "embed_usage_insert" ON public.embed_usage
FOR INSERT WITH CHECK (
    is_admin() OR
    EXISTS (
        SELECT 1 FROM public.organizations o
        WHERE o.id = embed_usage.organization_id
        AND o.created_by = auth.uid()
    )
);

-- 日次集計テーブルのRLS
ALTER TABLE public.embed_usage_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "embed_usage_daily_read" ON public.embed_usage_daily
FOR SELECT USING (
    is_admin() OR
    EXISTS (
        SELECT 1 FROM public.organizations o
        WHERE o.id = embed_usage_daily.organization_id
        AND o.created_by = auth.uid()
    )
);

-- 月次集計テーブルのRLS
ALTER TABLE public.embed_usage_monthly ENABLE ROW LEVEL SECURITY;

CREATE POLICY "embed_usage_monthly_read" ON public.embed_usage_monthly
FOR SELECT USING (
    is_admin() OR
    EXISTS (
        SELECT 1 FROM public.organizations o
        WHERE o.id = embed_usage_monthly.organization_id
        AND o.created_by = auth.uid()
    )
);

-- 埋め込み設定テーブルのRLS
ALTER TABLE public.embed_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "embed_configurations_read" ON public.embed_configurations
FOR SELECT USING (
    is_admin() OR
    EXISTS (
        SELECT 1 FROM public.organizations o
        WHERE o.id = embed_configurations.organization_id
        AND o.created_by = auth.uid()
    )
);

CREATE POLICY "embed_configurations_write" ON public.embed_configurations
FOR ALL USING (
    is_admin() OR
    EXISTS (
        SELECT 1 FROM public.organizations o
        WHERE o.id = embed_configurations.organization_id
        AND o.created_by = auth.uid()
    )
);

-- ===============================================
-- 便利な関数とビュー
-- ===============================================

-- 人気ソース取得関数
CREATE OR REPLACE FUNCTION get_top_embed_sources(
    org_id UUID,
    start_date DATE,
    end_date DATE,
    result_limit INTEGER DEFAULT 10
)
RETURNS TABLE(url TEXT, count BIGINT, percentage NUMERIC) AS $$
BEGIN
    RETURN QUERY
    WITH source_counts AS (
        SELECT 
            source_url,
            COUNT(*) as source_count
        FROM public.embed_usage
        WHERE organization_id = org_id
        AND created_at::DATE BETWEEN start_date AND end_date
        AND source_url IS NOT NULL
        AND event_type = 'load'
        GROUP BY source_url
    ),
    total_count AS (
        SELECT SUM(source_count) as total FROM source_counts
    )
    SELECT 
        sc.source_url,
        sc.source_count,
        ROUND((sc.source_count::NUMERIC / tc.total::NUMERIC) * 100, 2) as percentage
    FROM source_counts sc, total_count tc
    ORDER BY sc.source_count DESC
    LIMIT result_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- リアルタイム統計取得関数
CREATE OR REPLACE FUNCTION get_realtime_embed_stats(
    org_id UUID,
    target_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
    active_widgets INTEGER,
    today_views BIGINT,
    today_clicks BIGINT,
    today_errors BIGINT,
    average_response_time NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        -- アクティブWidget数（設定テーブルから）
        (SELECT COUNT(*)::INTEGER 
         FROM public.embed_configurations 
         WHERE organization_id = org_id AND is_active = true),
        
        -- 今日のビュー数
        COALESCE((SELECT COUNT(*) 
                  FROM public.embed_usage 
                  WHERE organization_id = org_id 
                  AND created_at::DATE = target_date 
                  AND event_type = 'load'), 0),
        
        -- 今日のクリック数
        COALESCE((SELECT COUNT(*) 
                  FROM public.embed_usage 
                  WHERE organization_id = org_id 
                  AND created_at::DATE = target_date 
                  AND event_type = 'click'), 0),
        
        -- 今日のエラー数
        COALESCE((SELECT COUNT(*) 
                  FROM public.embed_usage 
                  WHERE organization_id = org_id 
                  AND created_at::DATE = target_date 
                  AND event_type = 'error'), 0),
        
        -- 平均レスポンス時間
        COALESCE((SELECT AVG(response_time) 
                  FROM public.embed_usage 
                  WHERE organization_id = org_id 
                  AND created_at::DATE = target_date 
                  AND response_time IS NOT NULL), 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================
-- 自動集計トリガー関数（パフォーマンス向上）
-- ===============================================

-- 日次集計更新関数
CREATE OR REPLACE FUNCTION update_daily_embed_stats()
RETURNS TRIGGER AS $$
DECLARE
    target_date DATE;
    org_id UUID;
BEGIN
    target_date := NEW.created_at::DATE;
    org_id := NEW.organization_id;
    
    INSERT INTO public.embed_usage_daily (
        organization_id, 
        date,
        widget_loads,
        iframe_loads,
        html_loads,
        total_clicks,
        error_count,
        avg_response_time,
        unique_sources
    )
    SELECT 
        org_id,
        target_date,
        SUM(CASE WHEN widget_type = 'widget' AND event_type = 'load' THEN 1 ELSE 0 END),
        SUM(CASE WHEN widget_type = 'iframe' AND event_type = 'load' THEN 1 ELSE 0 END),
        SUM(CASE WHEN widget_type = 'html' AND event_type = 'load' THEN 1 ELSE 0 END),
        SUM(CASE WHEN event_type = 'click' THEN 1 ELSE 0 END),
        SUM(CASE WHEN event_type = 'error' THEN 1 ELSE 0 END),
        AVG(response_time),
        COUNT(DISTINCT source_url)
    FROM public.embed_usage
    WHERE organization_id = org_id
    AND created_at::DATE = target_date
    ON CONFLICT (organization_id, date) 
    DO UPDATE SET
        widget_loads = EXCLUDED.widget_loads,
        iframe_loads = EXCLUDED.iframe_loads,
        html_loads = EXCLUDED.html_loads,
        total_clicks = EXCLUDED.total_clicks,
        error_count = EXCLUDED.error_count,
        avg_response_time = EXCLUDED.avg_response_time,
        unique_sources = EXCLUDED.unique_sources,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 日次集計トリガー
DROP TRIGGER IF EXISTS trigger_update_daily_stats ON public.embed_usage;
CREATE TRIGGER trigger_update_daily_stats
    AFTER INSERT ON public.embed_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_daily_embed_stats();

-- ===============================================
-- 初期データとテスト
-- ===============================================

-- 管理者用の権限確認
-- この関数は既存のis_admin()を使用想定

-- データ保持期間の制約追加（パフォーマンス）
CREATE INDEX IF NOT EXISTS idx_embed_usage_cleanup 
ON public.embed_usage(created_at) 
WHERE created_at < (NOW() - INTERVAL '90 days');

-- コメント追加
COMMENT ON TABLE public.embed_usage IS '埋め込みWidget/iframeの使用状況記録（生データ）';
COMMENT ON TABLE public.embed_usage_daily IS '日次集計データ（高速クエリ用）';
COMMENT ON TABLE public.embed_usage_monthly IS '月次集計データ（プラン制限チェック用）';
COMMENT ON TABLE public.embed_configurations IS '埋め込み設定管理';

-- 完了
-- このマイグレーションにより、Phase 2の利用状況トラッキングとプラン制御が可能になります