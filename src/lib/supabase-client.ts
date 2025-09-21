'use client';

import { createBrowserClient } from '@supabase/ssr';

export const supabaseBrowserBrowser = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const supabaseBrowserClient = supabaseBrowserBrowser;
export const createClient = () => supabaseBrowserBrowser;

export default supabaseBrowserBrowser;