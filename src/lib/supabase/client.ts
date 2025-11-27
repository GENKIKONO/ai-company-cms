'use client';

import { createBrowserClient } from '@supabase/ssr';

export const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

// Legacy exports for compatibility
export const supabaseBrowser = createClient();
export const supabaseClient = createClient();
export default createClient;