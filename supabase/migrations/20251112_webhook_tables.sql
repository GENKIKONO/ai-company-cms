-- Webhook用テーブル作成
-- 決済履歴テーブル
CREATE TABLE IF NOT EXISTS public.payment_history (
    id BIGSERIAL PRIMARY KEY,
    stripe_invoice_id TEXT UNIQUE NOT NULL,
    stripe_customer_id TEXT NOT NULL,
    amount INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'usd',
    status TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- メール送信ログテーブル
CREATE TABLE IF NOT EXISTS public.email_logs (
    id BIGSERIAL PRIMARY KEY,
    email_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    recipient TEXT NOT NULL,
    subject TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_payment_history_customer ON payment_history(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_invoice ON payment_history(stripe_invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_created_at ON payment_history(created_at);

CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient);
CREATE INDEX IF NOT EXISTS idx_email_logs_event_type ON email_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at);

-- RLS設定（管理者のみアクセス可能）
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_history_admin_only" ON payment_history
    FOR ALL USING (auth.jwt()->>'role' = 'admin');

CREATE POLICY "email_logs_admin_only" ON email_logs
    FOR ALL USING (auth.jwt()->>'role' = 'admin');

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payment_history_updated_at 
    BEFORE UPDATE ON payment_history 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();