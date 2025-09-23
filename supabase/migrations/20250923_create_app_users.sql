-- Create app_users table for auth sync
-- Migration: 20250923_create_app_users
-- Purpose: P0 minimal schema for user profile sync

-- Create app_users table
CREATE TABLE IF NOT EXISTS public.app_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'org_owner' 
        CHECK (role IN ('org_owner', 'admin', 'member')),
    partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

-- Minimal RLS policies
-- Users can manage their own profile
CREATE POLICY "Users can manage own profile"
    ON public.app_users
    FOR ALL
    USING ( auth.uid() = id )
    WITH CHECK ( auth.uid() = id );

-- Service role can access all (for API operations)
CREATE POLICY "Service role can access all"
    ON public.app_users
    FOR ALL
    USING ( auth.role() = 'service_role' );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_app_users_role ON public.app_users(role);
CREATE INDEX IF NOT EXISTS idx_app_users_partner_id ON public.app_users(partner_id);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_app_users_updated_at
    BEFORE UPDATE ON public.app_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();