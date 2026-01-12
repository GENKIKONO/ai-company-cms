/**
 * 認証状態取得モジュール（Core正本 - Client用）
 *
 * 【Phase 2-1b: Core Auth Entry Points】
 *
 * ■ 公開API（置換作業で使用する関数）
 *   - getUserClient(): AppUser | null を返す
 *   - onAuthChangeClient(callback): 認証状態変更リスナー
 *   - signOutClient(): サインアウト
 *
 * ■ 使用場所
 *   - 'use client' コンポーネント
 *   - DashboardPageShell
 *   - EmbedPageClient
 *   - organizations/* ページ
 *
 * ■ 禁止事項
 *   - supabase.auth.getUser() の直接呼び出し
 *   - supabase.auth.getSession() の直接呼び出し
 *   - supabase.auth.onAuthStateChange() の直接呼び出し
 *   → 必ずこのモジュール経由
 */

'use client';

import { createClient } from '@/lib/supabase/client';
import type { AppUser } from '@/types/legacy/database';
import type { UserRole } from '@/types/utils/database';
import type { AuthChangeEvent, Session, Subscription, User, AuthError } from '@supabase/supabase-js';

/**
 * 現在のログインユーザーを取得（クライアント側専用）
 *
 * 認証済みユーザーが存在すれば、profiles テーブルのデータがなくても
 * 最低限のユーザー情報を返す（ログインリダイレクト問題を防止）
 *
 * @returns AppUser | null
 */
export async function getCurrentUserClient(): Promise<AppUser | null> {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      // 認証エラーまたはユーザーなし → 未ログイン
      return null;
    }

    // profiles テーブルからプロフィール情報を取得（オプショナル）
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, created_at')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      // eslint-disable-next-line no-console
      console.warn('[core/auth-state.client] Profile fetch error (using fallback):', profileError.message);
    }

    // profile が取得できなくても、認証済みユーザー情報を返す
    // これにより profiles レコードがないユーザーでもログインリダイレクトを防止
    return {
      id: user.id,
      email: user.email || '',
      full_name: profile?.full_name ?? user.user_metadata?.full_name ?? null,
      avatar_url: profile?.avatar_url ?? user.user_metadata?.avatar_url ?? null,
      role: (user.app_metadata?.role as UserRole) || 'viewer',
      created_at: profile?.created_at ?? user.created_at ?? new Date().toISOString(),
      updated_at: profile?.created_at ?? user.updated_at ?? new Date().toISOString(),
      email_verified: !!user.email_confirmed_at,
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[core/auth-state.client] Error:', err);
    return null;
  }
}

/**
 * 認証オブジェクトを取得（クライアント側専用）
 *
 * サインアウトなどの認証操作に使用
 */
export async function getAuthClient() {
  const supabase = await createClient();
  return supabase.auth;
}

/**
 * サインアウト（クライアント側専用）
 */
export async function signOutClient(): Promise<{ error: Error | null }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();
    return { error };
  } catch (err) {
    return { error: err instanceof Error ? err : new Error('Sign out failed') };
  }
}

/**
 * 認証状態変更リスナー（クライアント側専用）
 *
 * @param callback - 認証状態変更時のコールバック
 * @returns unsubscribe 関数を含むオブジェクト
 */
export async function onAuthChangeClient(
  callback: (event: AuthChangeEvent, session: Session | null) => void
): Promise<{ data: { subscription: Subscription } }> {
  const supabase = await createClient();
  return supabase.auth.onAuthStateChange(callback);
}

/**
 * セッション取得（クライアント側専用）
 *
 * @returns Session | null
 */
export async function getSessionClient(): Promise<Session | null> {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[core/auth-state.client] getSession error:', err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Raw User Access (for legacy compatibility)
// ─────────────────────────────────────────────────────────────

/**
 * 生のSupabase User型を取得（クライアント側専用）
 *
 * AppUser ではなく Supabase の User 型をそのまま返す。
 * レガシーAPIとの互換性維持用。新規コードでは getCurrentUserClient を推奨。
 *
 * @returns User | null
 */
export async function getRawUserClient(): Promise<User | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[core/auth-state.client] getRawUserClient error:', err);
    return null;
  }
}

/**
 * セッションを更新し、エラー情報を返す（クライアント側専用）
 *
 * OAuth callback 等でセッション確立時のエラーをチェックする場合に使用。
 * URL ハッシュからのトークン処理を行い、エラーがあれば返す。
 *
 * @returns { error: AuthError | null }
 */
export async function refreshSessionClient(): Promise<{ error: AuthError | null }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.getSession();
    return { error };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[core/auth-state.client] refreshSession error:', err);
    return { error: err as AuthError };
  }
}

// ─────────────────────────────────────────────────────────────
// Aliases for consistency
// ─────────────────────────────────────────────────────────────

/**
 * getUserClient の別名（getCurrentUserClient と同じ）
 */
export const getUserClient = getCurrentUserClient;
