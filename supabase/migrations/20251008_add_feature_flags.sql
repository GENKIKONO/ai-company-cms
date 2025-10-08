-- Add feature flags and entitlements columns to organizations table

alter table organizations
  add column if not exists feature_flags jsonb default '{}'::jsonb,
  add column if not exists entitlements jsonb default '{}'::jsonb;

-- Update existing records to have empty objects
update organizations 
set 
  feature_flags = coalesce(feature_flags, '{}'::jsonb),
  entitlements = coalesce(entitlements, '{}'::jsonb)
where feature_flags is null or entitlements is null;