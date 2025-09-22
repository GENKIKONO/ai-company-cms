-- Add setup fee columns to subscriptions table
-- Migration created: 2025-09-22

ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS setup_fee_amount integer,
ADD COLUMN IF NOT EXISTS setup_fee_paid_at timestamptz,
ADD COLUMN IF NOT EXISTS notes text;

-- Add comment to describe the new columns
COMMENT ON COLUMN subscriptions.setup_fee_amount IS 'Initial setup fee amount in cents (JPY)';
COMMENT ON COLUMN subscriptions.setup_fee_paid_at IS 'Timestamp when setup fee was paid';
COMMENT ON COLUMN subscriptions.notes IS 'Additional notes about the subscription';

-- Create index for setup fee queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_setup_fee_paid_at 
ON subscriptions(setup_fee_paid_at) WHERE setup_fee_paid_at IS NOT NULL;