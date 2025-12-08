'use client';

import { createBrowserClient } from '@supabase/ssr';
// TODO: [SUPABASE_TYPE_FOLLOWUP] Supabase Database 型定義を再構築後に復元する

export const createClient = () => {
  return createBrowserClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

// Legacy exports for compatibility
export const supabaseBrowser = createClient();
export const supabaseClient = createClient();
export default createClient;