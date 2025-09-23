-- P0 Migration: Create minimal app_users table for user management
-- This is the minimal schema required for the P0 release
-- Created: 2024-09-23

-- Create app_users table for minimal user management
CREATE TABLE IF NOT EXISTS public.app_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'org_owner',
  partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_app_users_updated_at
  BEFORE UPDATE ON public.app_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security)
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for app_users
-- Users can only access their own records
CREATE POLICY "Users can view own app_user record" ON public.app_users
  FOR SELECT USING (auth.uid() = id);

-- Users can insert their own record during signup
CREATE POLICY "Users can insert own app_user record" ON public.app_users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own record (for future features)
CREATE POLICY "Users can update own app_user record" ON public.app_users
  FOR UPDATE USING (auth.uid() = id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS app_users_role_idx ON public.app_users(role);
CREATE INDEX IF NOT EXISTS app_users_partner_id_idx ON public.app_users(partner_id);

-- Insert comment for documentation
COMMENT ON TABLE public.app_users IS 'P0 minimal user management table. Stores user roles and partner associations.';
COMMENT ON COLUMN public.app_users.role IS 'User role: org_owner (default), admin, or member';
COMMENT ON COLUMN public.app_users.partner_id IS 'Optional reference to partner organization';