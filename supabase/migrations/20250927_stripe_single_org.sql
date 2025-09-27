-- Add Stripe subscription fields to organizations table for Single-Org Mode
-- Migration: 20250927_stripe_single_org.sql

-- Add Stripe-related columns to organizations table
alter table public.organizations
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists plan text check (plan in ('free','basic','pro')) default 'free',
  add column if not exists subscription_status text check (subscription_status in ('active','past_due','canceled','incomplete','trialing','paused')) default null,
  add column if not exists current_period_end timestamptz;

-- Add indexes for Stripe fields to improve query performance
create index if not exists idx_organizations_stripe_customer_id on public.organizations(stripe_customer_id);
create index if not exists idx_organizations_plan on public.organizations(plan);
create index if not exists idx_organizations_subscription_status on public.organizations(subscription_status);

-- Add comment for documentation
comment on column public.organizations.stripe_customer_id is 'Stripe Customer ID for billing';
comment on column public.organizations.stripe_subscription_id is 'Stripe Subscription ID';
comment on column public.organizations.plan is 'Subscription plan: free, basic, or pro';
comment on column public.organizations.subscription_status is 'Stripe subscription status';
comment on column public.organizations.current_period_end is 'Current billing period end date';

-- Update RLS policies to allow users to read their own organization's billing info
-- (Update operations should only be done via server-side APIs for security)

-- Note: The existing RLS policy for 'created_by = auth.uid()' already covers
-- read access to these new columns. No additional RLS policies needed.