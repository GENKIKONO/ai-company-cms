'use client';

import { createBrowserClient } from '@supabase/ssr';
// TODO: [SUPABASE_TYPE_FOLLOWUP] Supabase Database 型定義を再構築後に復元する

// =====================================================
// ENV GUARD: ビルド/起動時に env 欠落を即検知
// =====================================================
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  const missing = [
    !SUPABASE_URL && 'NEXT_PUBLIC_SUPABASE_URL',
    !SUPABASE_ANON_KEY && 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ].filter(Boolean).join(', ');

  throw new Error(
    `[Supabase Client] 必須環境変数が未設定: ${missing}. ` +
    `Vercel Dashboard → Settings → Environment Variables で Production に設定してください。`
  );
}

export const createClient = () => {
  return createBrowserClient<any>(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );
};

// Legacy exports for compatibility
export const supabaseBrowser = createClient();
export const supabaseClient = createClient();
export default createClient;