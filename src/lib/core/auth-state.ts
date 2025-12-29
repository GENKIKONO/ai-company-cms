/**
 * 認証状態取得の統一モジュール（Core正本 - Server用）
 *
 * 【Phase 2-1b: Core Auth Entry Points】
 *
 * ■ 公開API（置換作業で使用する関数）
 *   - getUserServerOptional(): AuthUser | null を返す（認証任意）
 *   - requireUserServer(): AuthUser を返す、未認証なら throw
 *   - isSiteAdmin(): site_admin判定
 *   - isOrgMember(orgId): 組織メンバー判定
 *   - getOrgRole(orgId): 組織内ロール取得
 *
 * ■ 使用場所
 *   - Server Component
 *   - Server Actions
 *   - Route Handlers (API Routes)
 *
 * ■ 禁止事項
 *   - supabase.auth.getUser() の直接呼び出し
 *   - supabase.auth.getSession() の直接呼び出し
 *   → 必ずこのモジュール経由
 */

import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient, User, Session } from '@supabase/supabase-js'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type AuthUser = {
  id: string
  email: string | null
  app_role: string | null
}

/**
 * user_metadata を含む拡張認証ユーザー型
 * user_metadata が必要な場合に使用
 */
export type AuthUserFull = AuthUser & {
  user_metadata: Record<string, unknown>
  app_metadata: Record<string, unknown>
  created_at: string | null
  last_sign_in_at: string | null
  email_confirmed_at: string | null  // Phase 20: diag/auth互換のため追加
}

export class AuthRequiredError extends Error {
  code = 'AUTH_REQUIRED' as const
  status = 401

  constructor(message = '認証が必要です') {
    super(message)
    this.name = 'AuthRequiredError'
  }
}

// ─────────────────────────────────────────────────────────────
// Core Entry Points
// ─────────────────────────────────────────────────────────────

/**
 * 現在のログインユーザーを取得（認証任意）
 *
 * @returns AuthUser | null
 */
export async function getUserServerOptional(): Promise<AuthUser | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  return {
    id: user.id,
    email: user.email ?? null,
    app_role: (user.app_metadata as Record<string, unknown>)?.role as string ?? null,
  }
}

/**
 * 現在のログインユーザーを取得（認証必須）
 *
 * @returns AuthUser
 * @throws AuthRequiredError - 未認証の場合
 */
export async function requireUserServer(): Promise<AuthUser> {
  const user = await getUserServerOptional()

  if (!user) {
    throw new AuthRequiredError()
  }

  return user
}

/**
 * @deprecated getUserServerOptional() を使用してください
 */
export const getAuthUser = getUserServerOptional

// ─────────────────────────────────────────────────────────────
// Client-injected variants (for Route Handlers with existing client)
// ─────────────────────────────────────────────────────────────

/**
 * 既存のSupabaseクライアントを使ってユーザーを取得（認証任意）
 *
 * Route Handlers で既にクライアントがある場合に使用
 *
 * @param supabase - Supabaseクライアント
 * @returns AuthUser | null
 */
export async function getUserWithClient(
  supabase: SupabaseClient
): Promise<AuthUser | null> {
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) return null

  return {
    id: user.id,
    email: user.email ?? null,
    app_role: (user.app_metadata as Record<string, unknown>)?.role as string ?? null,
  }
}

/**
 * 既存のSupabaseクライアントを使ってユーザーを取得（認証必須）
 *
 * Route Handlers で既にクライアントがある場合に使用
 * 未認証の場合は AuthRequiredError を throw
 *
 * @param supabase - Supabaseクライアント
 * @returns AuthUser
 * @throws AuthRequiredError
 */
export async function requireUserWithClient(
  supabase: SupabaseClient
): Promise<AuthUser> {
  const user = await getUserWithClient(supabase)

  if (!user) {
    throw new AuthRequiredError()
  }

  return user
}

// ─────────────────────────────────────────────────────────────
// Session variants (for cases needing access_token)
// ─────────────────────────────────────────────────────────────

/**
 * 既存のSupabaseクライアントを使ってセッションを取得（セッション任意）
 *
 * access_token が必要な場合（fetch ヘッダー設定など）に使用
 *
 * @param supabase - Supabaseクライアント
 * @returns Session | null
 */
export async function getSessionWithClient(
  supabase: SupabaseClient
): Promise<Session | null> {
  const { data: { session }, error } = await supabase.auth.getSession()

  if (error || !session) return null

  return session
}

/**
 * 既存のSupabaseクライアントを使ってセッションを取得（セッション必須）
 *
 * access_token が必要な場合（fetch ヘッダー設定など）に使用
 * 未認証の場合は AuthRequiredError を throw
 *
 * @param supabase - Supabaseクライアント
 * @returns Session
 * @throws AuthRequiredError
 */
export async function requireSessionWithClient(
  supabase: SupabaseClient
): Promise<Session> {
  const session = await getSessionWithClient(supabase)

  if (!session) {
    throw new AuthRequiredError()
  }

  return session
}

// ─────────────────────────────────────────────────────────────
// Full User variants (for cases needing user_metadata)
// ─────────────────────────────────────────────────────────────

/**
 * 既存のSupabaseクライアントを使って完全なユーザー情報を取得（認証任意）
 *
 * user_metadata / app_metadata が必要な場合に使用
 * 例: /api/me, /api/ai-interview-sessions
 *
 * @param supabase - Supabaseクライアント
 * @returns AuthUserFull | null
 */
export async function getUserFullWithClient(
  supabase: SupabaseClient
): Promise<AuthUserFull | null> {
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) return null

  return {
    id: user.id,
    email: user.email ?? null,
    app_role: (user.app_metadata as Record<string, unknown>)?.role as string ?? null,
    user_metadata: (user.user_metadata as Record<string, unknown>) ?? {},
    app_metadata: (user.app_metadata as Record<string, unknown>) ?? {},
    created_at: user.created_at ?? null,
    last_sign_in_at: user.last_sign_in_at ?? null,
    email_confirmed_at: user.email_confirmed_at ?? null,  // Phase 20
  }
}

/**
 * 既存のSupabaseクライアントを使って完全なユーザー情報を取得（認証必須）
 *
 * user_metadata / app_metadata が必要な場合に使用
 * 未認証の場合は AuthRequiredError を throw
 *
 * @param supabase - Supabaseクライアント
 * @returns AuthUserFull
 * @throws AuthRequiredError
 */
export async function requireUserFullWithClient(
  supabase: SupabaseClient
): Promise<AuthUserFull> {
  const user = await getUserFullWithClient(supabase)

  if (!user) {
    throw new AuthRequiredError()
  }

  return user
}

/**
 * 現在のユーザーがsite_adminかどうかを判定（サーバー側専用）
 *
 * 内部でSupabaseクライアントを生成し、RPC経由で判定
 * Server Component / Server Actions / Route Handlers で使用
 */
export async function isSiteAdmin(): Promise<boolean> {
  const supabase = await createClient()
  return isSiteAdminWithClient(supabase)
}

/**
 * 既存のSupabaseクライアントを使ってsite_adminかどうかを判定
 *
 * DBの `is_site_admin()` RPC を呼び出し
 * 既にクライアントがある場合（DashboardPageShell等）で使用
 *
 * @param supabase - Supabaseクライアント
 * @returns サイト管理者であればtrue
 */
export async function isSiteAdminWithClient(
  supabase: SupabaseClient
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('is_site_admin')

    if (error) {
      // RPC が存在しない場合はフォールバック（site_adminsテーブル直接）
      if (error.code === '42883') {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return false

        const { data: adminData } = await supabase
          .from('site_admins')
          .select('user_id')
          .eq('user_id', user.id)
          .single()

        return !!adminData
      }
      // eslint-disable-next-line no-console
      console.error('[core/auth-state] isSiteAdmin RPC error:', error)
      return false
    }

    return !!data
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[core/auth-state] isSiteAdmin error:', err)
    return false
  }
}

/**
 * ユーザーが指定された組織のメンバーかどうかを判定
 */
export async function isOrgMember(orgId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return false

  const { data } = await supabase
    .from('organization_members')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('organization_id', orgId)
    .single()

  return !!data
}

/**
 * ユーザーの組織内ロールを取得
 */
export async function getOrgRole(orgId: string): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data } = await supabase
    .from('organization_members')
    .select('role')
    .eq('user_id', user.id)
    .eq('organization_id', orgId)
    .single()

  return data?.role ?? null
}

// ─────────────────────────────────────────────────────────────
// Token Verification (for API routes with Bearer token)
// ─────────────────────────────────────────────────────────────

/**
 * JWTトークンからユーザーを検証・取得
 *
 * Authorization ヘッダーの Bearer トークンを検証する API で使用。
 * セキュリティ上、エラー詳細は露出しない。
 *
 * @param supabase - Supabaseクライアント（通常は admin client）
 * @param token - JWT アクセストークン
 * @returns { user: AuthUser | null; error: boolean }
 */
export async function getUserFromTokenWithClient(
  supabase: SupabaseClient,
  token: string
): Promise<{ user: AuthUser | null; error: boolean }> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return { user: null, error: true }
    }

    return {
      user: {
        id: user.id,
        email: user.email ?? null,
        app_role: (user.app_metadata as Record<string, unknown>)?.role as string ?? null,
      },
      error: false,
    }
  } catch {
    return { user: null, error: true }
  }
}
