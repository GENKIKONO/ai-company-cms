'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

// =====================================================
// ENV GUARD: 安全な環境変数チェック
// - モジュール読み込み時ではなく、クライアント生成時にエラー
// - 開発時は console.error + null client、production は fail-fast
// =====================================================
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Singleton instance (lazy initialization)
let _supabaseInstance: SupabaseClient | null = null;

/**
 * Check if environment is properly configured
 */
function validateEnv(): { valid: boolean; missing: string } {
  const missing = [
    !SUPABASE_URL && 'NEXT_PUBLIC_SUPABASE_URL',
    !SUPABASE_ANON_KEY && 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ].filter(Boolean).join(', ');

  return {
    valid: !!(SUPABASE_URL && SUPABASE_ANON_KEY),
    missing,
  };
}

/**
 * Create or return cached Supabase browser client
 * Throws at runtime if env vars are missing (fail-fast on actual usage)
 */
export const createClient = (): SupabaseClient => {
  // Return cached instance if already created
  if (_supabaseInstance) {
    return _supabaseInstance;
  }

  const { valid, missing } = validateEnv();

  if (!valid) {
    const errorMsg =
      `[Supabase Client] 必須環境変数が未設定: ${missing}. ` +
      `Vercel Dashboard → Settings → Environment Variables で Production に設定してください。`;

    // Always log error for debugging
    // eslint-disable-next-line no-console
    console.error(errorMsg);

    // In production, fail fast
    if (process.env.NODE_ENV === 'production') {
      throw new Error(errorMsg);
    }

    // In development, throw but with clearer message
    throw new Error(`${errorMsg}\n\n[DEV] .env.local に環境変数を追加してください。`);
  }

  // Create and cache the instance
  _supabaseInstance = createBrowserClient<any>(
    SUPABASE_URL!,
    SUPABASE_ANON_KEY!
  );

  return _supabaseInstance;
};

// Legacy exports for compatibility (lazy initialization via getter)
// These are evaluated lazily on first access, not at module load time
export const supabaseBrowser = createClient();
export const supabaseClient = supabaseBrowser;
export default createClient;