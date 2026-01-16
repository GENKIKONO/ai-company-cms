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
 * Check if running in browser environment
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

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
 *
 * IMPORTANT: This function is SSR-safe - it will only create a real client
 * in browser environment. During SSR, it throws to prevent singleton pollution.
 *
 * Throws at runtime if env vars are missing (fail-fast on actual usage)
 */
export const createClient = (): SupabaseClient => {
  // SSR Guard: Prevent creating browser client during server-side rendering
  // This prevents singleton pollution where a broken client is cached
  if (!isBrowser()) {
    throw new Error(
      '[Supabase Client] createClient() was called during SSR. ' +
      'Browser client should only be created on client-side. ' +
      'Use @/lib/supabase/server for server-side operations.'
    );
  }

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

// =====================================================
// LEGACY EXPORTS: Lazy getters to prevent SSR issues
// These use Proxy to defer client creation until actual property access
// =====================================================

/**
 * Lazy Supabase browser client getter
 *
 * DEPRECATED: Use createClient() directly for clearer semantics.
 * This export exists for backward compatibility only.
 *
 * Uses Proxy to defer client creation until a property is accessed,
 * preventing SSR-time singleton pollution.
 */
const createLazyClient = (): SupabaseClient => {
  // During SSR, return a proxy that will throw on any property access
  // This prevents accidental usage during SSR
  if (!isBrowser()) {
    return new Proxy({} as SupabaseClient, {
      get(_, prop) {
        // Allow checking for existence without throwing
        if (prop === 'then' || prop === Symbol.toStringTag) {
          return undefined;
        }
        throw new Error(
          `[Supabase Client] Attempted to access supabaseBrowser.${String(prop)} during SSR. ` +
          'Use createClient() inside useEffect or event handlers.'
        );
      },
    });
  }
  return createClient();
};

export const supabaseBrowser = createLazyClient();
export const supabaseClient = supabaseBrowser;
export default createClient;