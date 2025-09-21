-- Missing Tables for Stripe Integration
-- Stripe決済統合に必要な追加テーブル

-- Subscriptions table (サブスクリプション管理)
CREATE TABLE public.subscriptions (
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

-- Stripe customers table (Stripe顧客情報)
CREATE TABLE public.stripe_customers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    stripe_customer_id TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id)
);

-- Webhook events table (Webhook冪等性管理)
CREATE TABLE public.webhook_events (
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

-- Add stripe_customer_id to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Add subscription_status to organizations table
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'none';

-- Create indexes
CREATE INDEX idx_subscriptions_org_id ON public.subscriptions(org_id);
CREATE INDEX idx_subscriptions_stripe_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);

CREATE INDEX idx_stripe_customers_org_id ON public.stripe_customers(organization_id);
CREATE INDEX idx_stripe_customers_stripe_id ON public.stripe_customers(stripe_customer_id);

CREATE INDEX idx_webhook_events_stripe_id ON public.webhook_events(stripe_event_id);
CREATE INDEX idx_webhook_events_processed ON public.webhook_events(processed);
CREATE INDEX idx_webhook_events_created_at ON public.webhook_events(created_at);

-- Create updated_at triggers
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stripe_customers_updated_at BEFORE UPDATE ON public.stripe_customers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscriptions
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

CREATE POLICY "Editors and admins can view all subscriptions" ON public.subscriptions
    FOR SELECT USING (public.is_editor_or_admin());

CREATE POLICY "System can manage subscriptions" ON public.subscriptions
    FOR ALL USING (true);

-- RLS Policies for stripe_customers
CREATE POLICY "Users can view their organization's stripe data" ON public.stripe_customers
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Editors and admins can view all stripe customers" ON public.stripe_customers
    FOR SELECT USING (public.is_editor_or_admin());

CREATE POLICY "System can manage stripe customers" ON public.stripe_customers
    FOR ALL USING (true);

-- RLS Policies for webhook_events (admin only)
CREATE POLICY "Admins can view webhook events" ON public.webhook_events
    FOR SELECT USING (public.is_admin());

CREATE POLICY "System can manage webhook events" ON public.webhook_events
    FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON public.subscriptions TO authenticated;
GRANT ALL ON public.stripe_customers TO authenticated;
GRANT ALL ON public.webhook_events TO authenticated;