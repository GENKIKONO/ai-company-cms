-- =============================================================================
-- Migration: Schema Diff Reconciliation (Verified Tables)
-- Created: 2024-12-31
-- Purpose: 実DBとmigrationsの差分を補完（追加のみ、破壊的変更なし）
--
-- 根拠: Public Tables Column Metadata.csv (2024-12-31)
-- 注意:
-- - CREATE TABLE IF NOT EXISTS / CREATE INDEX IF NOT EXISTS のみ使用
-- - 破壊的変更禁止（DROP/DELETE/UPDATE/型変更禁止）
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. ai_citations_items テーブル
-- -----------------------------------------------------------------------------
-- 根拠: columns_data ordinal 1-9 完全
-- 用途: LLM引用の明細

CREATE TABLE IF NOT EXISTS public.ai_citations_items (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    response_id uuid NOT NULL,
    content_unit_id uuid NOT NULL,
    weight numeric,
    quoted_chars integer,
    quoted_tokens integer,
    fragment_hint text,
    locale text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);

COMMENT ON TABLE public.ai_citations_items IS 'LLM引用明細。columns_data (2024-12-31) より9列確認。';

CREATE INDEX IF NOT EXISTS idx_ai_citations_items_response
    ON public.ai_citations_items (response_id);

CREATE INDEX IF NOT EXISTS idx_ai_citations_items_content_unit
    ON public.ai_citations_items (content_unit_id);

-- -----------------------------------------------------------------------------
-- 2. ai_citations_responses テーブル
-- -----------------------------------------------------------------------------
-- 根拠: columns_data ordinal 1-12 完全
-- 用途: LLM引用レスポンス

CREATE TABLE IF NOT EXISTS public.ai_citations_responses (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid,
    session_id uuid,
    request_id text,
    model_name text,
    prompt_tokens integer,
    completion_tokens integer,
    output_tokens integer,
    quoted_chars integer,
    quoted_tokens integer,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    user_id uuid,
    PRIMARY KEY (id)
);

COMMENT ON TABLE public.ai_citations_responses IS 'LLM引用レスポンス。columns_data (2024-12-31) より12列確認。';

CREATE INDEX IF NOT EXISTS idx_ai_citations_responses_org
    ON public.ai_citations_responses (organization_id);

CREATE INDEX IF NOT EXISTS idx_ai_citations_responses_session
    ON public.ai_citations_responses (session_id);

CREATE INDEX IF NOT EXISTS idx_ai_citations_responses_created
    ON public.ai_citations_responses (created_at);

-- -----------------------------------------------------------------------------
-- 3. ai_interview_axes テーブル
-- -----------------------------------------------------------------------------
-- 根拠: columns_data ordinal 1-10 完全
-- 用途: AIインタビュー質問軸マスタ

CREATE TABLE IF NOT EXISTS public.ai_interview_axes (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    code text NOT NULL,
    sort_order integer NOT NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT true,
    label_ja text,
    label_en text,
    description_ja text,
    description_en text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);

COMMENT ON TABLE public.ai_interview_axes IS 'AIインタビュー質問軸マスタ。columns_data (2024-12-31) より10列確認。';

CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_interview_axes_code
    ON public.ai_interview_axes (code);

-- -----------------------------------------------------------------------------
-- 4. ai_usage_events テーブル
-- -----------------------------------------------------------------------------
-- 根拠: columns_data ordinal 1-6 完全
-- 用途: AI利用イベント記録

CREATE TABLE IF NOT EXISTS public.ai_usage_events (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    usage_type text NOT NULL,
    occurred_at timestamp with time zone NOT NULL DEFAULT now(),
    month_bucket date,
    created_by uuid,
    PRIMARY KEY (id)
);

COMMENT ON TABLE public.ai_usage_events IS 'AI利用イベント記録。columns_data (2024-12-31) より6列確認。';

CREATE INDEX IF NOT EXISTS idx_ai_usage_events_org
    ON public.ai_usage_events (organization_id);

CREATE INDEX IF NOT EXISTS idx_ai_usage_events_month
    ON public.ai_usage_events (month_bucket);

CREATE INDEX IF NOT EXISTS idx_ai_usage_events_type
    ON public.ai_usage_events (usage_type);

-- -----------------------------------------------------------------------------
-- 5. billing_checkout_link_activations テーブル
-- -----------------------------------------------------------------------------
-- 根拠: columns_data ordinal 1-9 完全
-- 用途: Checkoutリンク有効化履歴

CREATE TABLE IF NOT EXISTS public.billing_checkout_link_activations (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    checkout_link_id uuid NOT NULL,
    activated_by uuid NOT NULL,
    activated_at timestamp with time zone DEFAULT now(),
    previous_active_link_id uuid,
    activation_reason text DEFAULT 'manual'::text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

COMMENT ON TABLE public.billing_checkout_link_activations IS 'Checkoutリンク有効化履歴。columns_data (2024-12-31) より9列確認。';

CREATE INDEX IF NOT EXISTS idx_billing_activations_link
    ON public.billing_checkout_link_activations (checkout_link_id);

CREATE INDEX IF NOT EXISTS idx_billing_activations_by
    ON public.billing_checkout_link_activations (activated_by);

-- -----------------------------------------------------------------------------
-- 6. billing_checkout_links テーブル
-- -----------------------------------------------------------------------------
-- 根拠: columns_data ordinal 1-13 完全
-- 用途: Stripe Checkoutリンク管理

CREATE TABLE IF NOT EXISTS public.billing_checkout_links (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    label text NOT NULL,
    plan_type text NOT NULL,
    stripe_price_id text NOT NULL,
    stripe_checkout_url text,
    discount_rate integer DEFAULT 0,
    campaign_type text NOT NULL,
    start_at timestamp with time zone,
    end_at timestamp with time zone,
    is_active boolean DEFAULT false,
    is_public boolean DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    created_by uuid,
    PRIMARY KEY (id)
);

COMMENT ON TABLE public.billing_checkout_links IS 'Stripe Checkoutリンク管理。columns_data (2024-12-31) より13列確認。';

CREATE INDEX IF NOT EXISTS idx_billing_links_active
    ON public.billing_checkout_links (is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_billing_links_plan
    ON public.billing_checkout_links (plan_type);

-- -----------------------------------------------------------------------------
-- 7. chatbot_interactions テーブル
-- -----------------------------------------------------------------------------
-- 根拠: columns_data ordinal 1-11 完全
-- 用途: チャットボット対話ログ

CREATE TABLE IF NOT EXISTS public.chatbot_interactions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    bot_id uuid NOT NULL,
    user_session_id text,
    user_id uuid,
    question_text text NOT NULL,
    answer_text text NOT NULL,
    page_url text,
    metadata jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    deleted_at timestamp with time zone,
    PRIMARY KEY (id)
);

COMMENT ON TABLE public.chatbot_interactions IS 'チャットボット対話ログ。columns_data (2024-12-31) より11列確認。';

CREATE INDEX IF NOT EXISTS idx_chatbot_interactions_org
    ON public.chatbot_interactions (organization_id);

CREATE INDEX IF NOT EXISTS idx_chatbot_interactions_bot
    ON public.chatbot_interactions (bot_id);

CREATE INDEX IF NOT EXISTS idx_chatbot_interactions_created
    ON public.chatbot_interactions (created_at);

-- -----------------------------------------------------------------------------
-- 8. chatbots テーブル
-- -----------------------------------------------------------------------------
-- 根拠: columns_data ordinal 1-11 完全
-- 用途: チャットボット設定

CREATE TABLE IF NOT EXISTS public.chatbots (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid,
    bot_type text NOT NULL,
    display_name text NOT NULL,
    status text NOT NULL DEFAULT 'active'::text,
    default_language text NOT NULL DEFAULT 'ja'::text,
    settings jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_by uuid,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    deleted_at timestamp with time zone,
    PRIMARY KEY (id)
);

COMMENT ON TABLE public.chatbots IS 'チャットボット設定。columns_data (2024-12-31) より11列確認。';

CREATE INDEX IF NOT EXISTS idx_chatbots_org
    ON public.chatbots (organization_id);

CREATE INDEX IF NOT EXISTS idx_chatbots_status
    ON public.chatbots (status);

-- -----------------------------------------------------------------------------
-- 9. customers テーブル
-- -----------------------------------------------------------------------------
-- 根拠: columns_data ordinal 1-6 完全
-- 用途: 顧客マスタ

CREATE TABLE IF NOT EXISTS public.customers (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    email text,
    name text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);

COMMENT ON TABLE public.customers IS '顧客マスタ。columns_data (2024-12-31) より6列確認。';

CREATE INDEX IF NOT EXISTS idx_customers_tenant
    ON public.customers (tenant_id);

CREATE INDEX IF NOT EXISTS idx_customers_email
    ON public.customers (email);

-- -----------------------------------------------------------------------------
-- 10. embedding_jobs テーブル
-- -----------------------------------------------------------------------------
-- 根拠: columns_data ordinal 1-22 完全
-- 用途: 埋め込みベクトル生成ジョブ

CREATE TABLE IF NOT EXISTS public.embedding_jobs (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid,
    source_table text NOT NULL,
    source_id uuid NOT NULL,
    source_field text NOT NULL,
    content_hash text NOT NULL,
    content_text text NOT NULL,
    chunk_count integer NOT NULL DEFAULT 1,
    chunk_strategy text NOT NULL DEFAULT 'fixed_size'::text,
    embedding_model text NOT NULL DEFAULT 'text-embedding-3-small'::text,
    status text NOT NULL DEFAULT 'pending'::text,
    batch_id uuid,
    priority smallint NOT NULL DEFAULT 100,
    idempotency_key text,
    error_message text,
    retry_count integer NOT NULL DEFAULT 0,
    max_retries integer NOT NULL DEFAULT 3,
    scheduled_at timestamp with time zone NOT NULL DEFAULT now(),
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);

COMMENT ON TABLE public.embedding_jobs IS '埋め込みベクトル生成ジョブ。columns_data (2024-12-31) より22列確認。';

CREATE INDEX IF NOT EXISTS idx_embedding_jobs_org
    ON public.embedding_jobs (organization_id);

CREATE INDEX IF NOT EXISTS idx_embedding_jobs_status
    ON public.embedding_jobs (status);

CREATE INDEX IF NOT EXISTS idx_embedding_jobs_source
    ON public.embedding_jobs (source_table, source_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_embedding_jobs_idempotency
    ON public.embedding_jobs (idempotency_key) WHERE idempotency_key IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 11. features テーブル
-- -----------------------------------------------------------------------------
-- 根拠: columns_data ordinal 1-7 完全
-- 用途: 機能フラグマスタ

CREATE TABLE IF NOT EXISTS public.features (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    key text NOT NULL,
    status text NOT NULL DEFAULT 'active'::text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    description text,
    category text,
    PRIMARY KEY (id)
);

COMMENT ON TABLE public.features IS '機能フラグマスタ。columns_data (2024-12-31) より7列確認。';

CREATE UNIQUE INDEX IF NOT EXISTS idx_features_key
    ON public.features (key);

CREATE INDEX IF NOT EXISTS idx_features_category
    ON public.features (category);

-- -----------------------------------------------------------------------------
-- 12. organization_members テーブル
-- -----------------------------------------------------------------------------
-- 根拠: columns_data ordinal 1-9 完全
-- 用途: 組織メンバーシップ

CREATE TABLE IF NOT EXISTS public.organization_members (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role text NOT NULL DEFAULT 'member'::text,
    invited_by uuid,
    invited_at timestamp with time zone DEFAULT now(),
    joined_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

COMMENT ON TABLE public.organization_members IS '組織メンバーシップ。columns_data (2024-12-31) より9列確認。';

CREATE UNIQUE INDEX IF NOT EXISTS idx_org_members_org_user
    ON public.organization_members (organization_id, user_id);

CREATE INDEX IF NOT EXISTS idx_org_members_user
    ON public.organization_members (user_id);

CREATE INDEX IF NOT EXISTS idx_org_members_role
    ON public.organization_members (role);

-- -----------------------------------------------------------------------------
-- 13. plans テーブル
-- -----------------------------------------------------------------------------
-- 根拠: columns_data ordinal 1-7 完全
-- 用途: プランマスタ

CREATE TABLE IF NOT EXISTS public.plans (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    status text NOT NULL,
    billing_external_id text,
    sort_order integer,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);

COMMENT ON TABLE public.plans IS 'プランマスタ。columns_data (2024-12-31) より7列確認。';

CREATE UNIQUE INDEX IF NOT EXISTS idx_plans_name
    ON public.plans (name);

CREATE INDEX IF NOT EXISTS idx_plans_status
    ON public.plans (status);

-- -----------------------------------------------------------------------------
-- 14. profiles テーブル
-- -----------------------------------------------------------------------------
-- 根拠: columns_data ordinal 1-10 完全
-- 用途: ユーザープロファイル（auth.usersと1:1）

CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL,
    full_name text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now(),
    role text DEFAULT 'user'::text,
    account_status text NOT NULL DEFAULT 'active'::text,
    next_violation_action text,
    next_violation_note text,
    next_violation_set_at timestamp with time zone,
    next_violation_set_by uuid,
    PRIMARY KEY (id)
);

COMMENT ON TABLE public.profiles IS 'ユーザープロファイル（auth.usersと1:1）。columns_data (2024-12-31) より10列確認。';

CREATE INDEX IF NOT EXISTS idx_profiles_status
    ON public.profiles (account_status);

CREATE INDEX IF NOT EXISTS idx_profiles_role
    ON public.profiles (role);

-- -----------------------------------------------------------------------------
-- 15. stripe_customers テーブル
-- -----------------------------------------------------------------------------
-- 根拠: columns_data ordinal 1-4 完全
-- 用途: Stripe顧客マッピング

CREATE TABLE IF NOT EXISTS public.stripe_customers (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    stripe_customer_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

COMMENT ON TABLE public.stripe_customers IS 'Stripe顧客マッピング。columns_data (2024-12-31) より4列確認。';

CREATE UNIQUE INDEX IF NOT EXISTS idx_stripe_customers_user
    ON public.stripe_customers (user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_stripe_customers_stripe_id
    ON public.stripe_customers (stripe_customer_id);

-- =============================================================================
-- ENUM型定義（USER-DEFINEDテーブルで使用）
-- =============================================================================
-- 根拠: query(36).csv (2024-12-31)

-- interview_content_type: service, product, post, news, faq, case_study
DO $$ BEGIN
    CREATE TYPE interview_content_type AS ENUM (
        'service', 'product', 'post', 'news', 'faq', 'case_study'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- interview_session_status: draft, in_progress, completed
DO $$ BEGIN
    CREATE TYPE interview_session_status AS ENUM (
        'draft', 'in_progress', 'completed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- report_status: pending, generating, completed, failed
DO $$ BEGIN
    CREATE TYPE report_status AS ENUM (
        'pending', 'generating', 'completed', 'failed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- -----------------------------------------------------------------------------
-- 16. ai_interview_questions テーブル
-- -----------------------------------------------------------------------------
-- 根拠: query(37).csv ordinal 1-10 完全
-- 用途: AIインタビュー質問マスタ

CREATE TABLE IF NOT EXISTS public.ai_interview_questions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    axis_id uuid NOT NULL,
    content_type interview_content_type NOT NULL,
    lang text NOT NULL,
    question_text text NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    keywords text[],
    PRIMARY KEY (id)
);

COMMENT ON TABLE public.ai_interview_questions IS 'AIインタビュー質問マスタ。query(37).csv (2024-12-31) より10列確認。';

CREATE INDEX IF NOT EXISTS idx_ai_interview_questions_axis
    ON public.ai_interview_questions (axis_id);

CREATE INDEX IF NOT EXISTS idx_ai_interview_questions_content_type
    ON public.ai_interview_questions (content_type);

CREATE INDEX IF NOT EXISTS idx_ai_interview_questions_lang
    ON public.ai_interview_questions (lang);

-- -----------------------------------------------------------------------------
-- 17. ai_interview_sessions テーブル
-- -----------------------------------------------------------------------------
-- 根拠: query(37).csv ordinal 1-14 完全
-- 用途: AIインタビューセッション

CREATE TABLE IF NOT EXISTS public.ai_interview_sessions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid,
    user_id uuid,
    content_type interview_content_type NOT NULL,
    status interview_session_status NOT NULL DEFAULT 'draft'::interview_session_status,
    answers jsonb NOT NULL DEFAULT '{}'::jsonb,
    generated_content text,
    notes text,
    meta jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    deleted_at timestamp with time zone,
    version integer NOT NULL DEFAULT 0,
    generated_content_json jsonb,
    PRIMARY KEY (id)
);

COMMENT ON TABLE public.ai_interview_sessions IS 'AIインタビューセッション。query(37).csv (2024-12-31) より14列確認。';

CREATE INDEX IF NOT EXISTS idx_ai_interview_sessions_org
    ON public.ai_interview_sessions (organization_id);

CREATE INDEX IF NOT EXISTS idx_ai_interview_sessions_user
    ON public.ai_interview_sessions (user_id);

CREATE INDEX IF NOT EXISTS idx_ai_interview_sessions_status
    ON public.ai_interview_sessions (status);

CREATE INDEX IF NOT EXISTS idx_ai_interview_sessions_content_type
    ON public.ai_interview_sessions (content_type);

-- -----------------------------------------------------------------------------
-- 18. ai_monthly_reports テーブル
-- -----------------------------------------------------------------------------
-- 根拠: query(37).csv ordinal 1-14 完全
-- 用途: AI月次レポート

CREATE TABLE IF NOT EXISTS public.ai_monthly_reports (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    plan_id text NOT NULL,
    level text NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    status report_status NOT NULL DEFAULT 'pending'::report_status,
    summary_text text NOT NULL,
    metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
    sections jsonb NOT NULL DEFAULT '{}'::jsonb,
    suggestions jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    month_bucket date,
    PRIMARY KEY (id)
);

COMMENT ON TABLE public.ai_monthly_reports IS 'AI月次レポート。query(37).csv (2024-12-31) より14列確認。';

CREATE INDEX IF NOT EXISTS idx_ai_monthly_reports_org
    ON public.ai_monthly_reports (organization_id);

CREATE INDEX IF NOT EXISTS idx_ai_monthly_reports_period
    ON public.ai_monthly_reports (period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_ai_monthly_reports_status
    ON public.ai_monthly_reports (status);

CREATE INDEX IF NOT EXISTS idx_ai_monthly_reports_month
    ON public.ai_monthly_reports (month_bucket);

-- -----------------------------------------------------------------------------
-- 19. embeddings テーブル
-- -----------------------------------------------------------------------------
-- 根拠: query(37).csv ordinal 1-14 完全
-- 用途: ベクトル埋め込み
-- 注意: vector型はpgvector拡張が必要

-- pgvector拡張の有効化（既存の場合はスキップ）
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS public.embeddings (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid,
    source_table text NOT NULL,
    source_id uuid NOT NULL,
    source_field text NOT NULL,
    chunk_index integer NOT NULL DEFAULT 0,
    chunk_text text NOT NULL,
    content_hash text NOT NULL,
    embedding vector,
    embedding_model text NOT NULL DEFAULT 'text-embedding-3-small'::text,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    lang text,
    PRIMARY KEY (id)
);

COMMENT ON TABLE public.embeddings IS 'ベクトル埋め込み。query(37).csv (2024-12-31) より14列確認。';

CREATE INDEX IF NOT EXISTS idx_embeddings_org
    ON public.embeddings (organization_id);

CREATE INDEX IF NOT EXISTS idx_embeddings_source
    ON public.embeddings (source_table, source_id);

CREATE INDEX IF NOT EXISTS idx_embeddings_hash
    ON public.embeddings (content_hash);

CREATE INDEX IF NOT EXISTS idx_embeddings_active
    ON public.embeddings (is_active) WHERE is_active = true;

-- -----------------------------------------------------------------------------
-- 20. ai_content_units テーブル
-- -----------------------------------------------------------------------------
-- 根拠: query(38).csv pg_attribute (ordinal 2 は削除済み列)
-- 用途: AIコンテンツ単位

CREATE TABLE IF NOT EXISTS public.ai_content_units (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    url text NOT NULL,
    jsonld_id text,
    content_type character varying(50) NOT NULL,
    title text,
    description text,
    structured_data_complete boolean DEFAULT false,
    last_updated timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    organization_id uuid,
    content_hash text,
    deleted_at timestamp with time zone,
    PRIMARY KEY (id)
);

COMMENT ON TABLE public.ai_content_units IS 'AIコンテンツ単位。query(38).csv (2024-12-31) より12列確認（ordinal 2削除済み）。';

CREATE INDEX IF NOT EXISTS idx_ai_content_units_org
    ON public.ai_content_units (organization_id);

CREATE INDEX IF NOT EXISTS idx_ai_content_units_url
    ON public.ai_content_units (url);

CREATE INDEX IF NOT EXISTS idx_ai_content_units_content_type
    ON public.ai_content_units (content_type);

CREATE INDEX IF NOT EXISTS idx_ai_content_units_hash
    ON public.ai_content_units (content_hash);

-- -----------------------------------------------------------------------------
-- 21. subscriptions テーブル
-- -----------------------------------------------------------------------------
-- 根拠: query(38).csv pg_attribute (ordinal 2 は削除済み列)
-- 用途: Stripeサブスクリプション

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid,
    status text NOT NULL,
    price_id text,
    current_period_end timestamp with time zone,
    stripe_subscription_id text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    organization_id uuid,
    PRIMARY KEY (id)
);

COMMENT ON TABLE public.subscriptions IS 'Stripeサブスクリプション。query(38).csv (2024-12-31) より9列確認（ordinal 2削除済み）。';

CREATE INDEX IF NOT EXISTS idx_subscriptions_user
    ON public.subscriptions (user_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_org
    ON public.subscriptions (organization_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_status
    ON public.subscriptions (status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_stripe_id
    ON public.subscriptions (stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 22. user_subscriptions テーブル
-- -----------------------------------------------------------------------------
-- 根拠: query(38).csv pg_attribute (ordinal 7 は削除済み列)
-- 用途: ユーザーサブスクリプション（EXCLUDE制約あり）
-- 注意: btree_gist拡張が必要（EXCLUDE制約用）

-- btree_gist拡張の有効化（既存の場合はスキップ）
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    plan_id uuid NOT NULL,
    starts_at timestamp with time zone NOT NULL DEFAULT now(),
    ends_at timestamp with time zone,
    status text NOT NULL DEFAULT 'active'::text,
    org_id uuid,
    reason text,
    updated_by uuid,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);

COMMENT ON TABLE public.user_subscriptions IS 'ユーザーサブスクリプション。query(38).csv (2024-12-31) より11列確認（ordinal 7削除済み）。';

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user
    ON public.user_subscriptions (user_id);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan
    ON public.user_subscriptions (plan_id);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_org
    ON public.user_subscriptions (org_id);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status
    ON public.user_subscriptions (status);

-- EXCLUDE制約: 同一ユーザーの有効期間重複を防止
-- 注: 既存データとの整合性確認後に有効化推奨
-- ALTER TABLE public.user_subscriptions
--     ADD CONSTRAINT excl_user_subscriptions_overlap
--     EXCLUDE USING gist (
--         user_id WITH =,
--         tstzrange(starts_at, ends_at, '[)') WITH &&
--     ) WHERE (status = 'active');

-- =============================================================================
-- Migration End: 22テーブル + 3 ENUM型 + 2 拡張機能 完了
-- =============================================================================
