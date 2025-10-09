-- Settings table for CMS-managed site configuration
CREATE TABLE IF NOT EXISTS public.settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Seed default hero image URL key if not exists
INSERT INTO public.settings(key, value)
VALUES ('hero_image_url', '')
ON CONFLICT (key) DO NOTHING;

-- RLS policies for settings table
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings
DROP POLICY IF EXISTS "settings_read_policy" ON public.settings;
CREATE POLICY "settings_read_policy"
ON public.settings FOR SELECT
TO anon, authenticated
USING (true);

-- Only authenticated users can insert/update settings
DROP POLICY IF EXISTS "settings_write_policy" ON public.settings;
CREATE POLICY "settings_write_policy"
ON public.settings FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);