'use client';

import { createBrowserClient } from '@supabase/ssr';

export const supabaseClient = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const supabaseBrowser = supabaseClient;
export const createClient = () => supabaseClient;

export default supabaseClient;