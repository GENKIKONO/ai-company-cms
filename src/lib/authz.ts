/**
 * 認可ユーティリティ
 *
 * DBを正とする方針に基づき、権限判定はすべてDB関数へ委譲
 * フロントは「関数を呼んで結果で分岐」だけ
 *
 * 【DB依存関係】
 * - RPC: user_has_org_role(org_id uuid, min_role text) → boolean
 * - RPC: is_site_admin() → boolean
 * - テーブル: organization_members (user_id, organization_id, role)
 * - テーブル: site_admins (user_id, role, created_at)
 *
 * ※ RPCが未実装の場合、DashboardPageShellはorganization_membersへの
 *   直接クエリにフォールバックします
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/utils/logger';

export type OrgRole = 'viewer' | 'editor' | 'admin';

/**
 * 認可エラー
 */
export class AuthorizationError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'AuthorizationError';
    this.code = code;
  }
}

/**
 * 組織に対するロール権限をチェック
 *
 * DBの `user_has_org_role` 関数を呼び出し、権限があるかを判定
 * ownerはDB関数側でadmin以上として扱われる
 *
 * @param supabase - Supabaseクライアント
 * @param orgId - 組織ID
 * @param minRole - 必要な最小ロール ('viewer' | 'editor' | 'admin')
 * @throws AuthorizationError - 権限がない場合
 */
export async function assertOrgRole(
  supabase: SupabaseClient,
  orgId: string,
  minRole: OrgRole
): Promise<void> {
  const { data, error } = await supabase.rpc('user_has_org_role', {
    org_id: orgId,
    min_role: minRole
  });

  if (error) {
    throw new AuthorizationError(
      'RPC_ERROR',
      `権限チェックに失敗しました: ${error.message}`
    );
  }

  if (!data) {
    throw new AuthorizationError(
      'FORBIDDEN_ORG_ROLE',
      `この操作には ${minRole} 以上の権限が必要です`
    );
  }
}

/**
 * 組織に対するロール権限をチェック（boolean版）
 *
 * @param supabase - Supabaseクライアント
 * @param orgId - 組織ID
 * @param minRole - 必要な最小ロール
 * @returns 権限があればtrue、なければfalse
 */
export async function hasOrgRole(
  supabase: SupabaseClient,
  orgId: string,
  minRole: OrgRole
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('user_has_org_role', {
      org_id: orgId,
      min_role: minRole
    });

    if (error) {
      logger.error('hasOrgRole RPC error:', { data: error });
      return false;
    }

    return !!data;
  } catch (err) {
    logger.error('hasOrgRole error:', { data: err });
    return false;
  }
}

/**
 * サイト管理者かどうかをチェック
 *
 * DBの `is_site_admin` 関数を呼び出し（Core経由）
 * org_idがないAdmin系ページで使用
 *
 * @param supabase - Supabaseクライアント
 * @throws AuthorizationError - サイト管理者でない場合
 */
export async function assertSiteAdmin(
  supabase: SupabaseClient
): Promise<void> {
  // Core経由で判定
  const { isSiteAdminWithClient } = await import('@/lib/core/auth-state');
  const isAdmin = await isSiteAdminWithClient(supabase);

  if (!isAdmin) {
    throw new AuthorizationError(
      'FORBIDDEN_SITE_ADMIN',
      'この操作にはサイト管理者権限が必要です'
    );
  }
}

/**
 * サイト管理者かどうかをチェック（boolean版）
 *
 * @deprecated `@/lib/core/auth-state` の `isSiteAdminWithClient` を使用してください
 * @param supabase - Supabaseクライアント
 * @returns サイト管理者であればtrue
 */
export { isSiteAdminWithClient as isSiteAdmin } from '@/lib/core/auth-state';

/**
 * requiredRoleからDB関数用のロール名へマッピング
 *
 * フロント側で保持する最小限のマッピング
 * owner → admin扱い（DB関数側で処理）
 */
export function mapRequiredRole(role: string): OrgRole {
  switch (role) {
    case 'admin':
    case 'owner':
      return 'admin';
    case 'editor':
      return 'editor';
    case 'viewer':
    default:
      return 'viewer';
  }
}

/**
 * RLSエラーかどうかを判定
 */
export function isRLSDeniedError(error: any): boolean {
  if (!error) return false;

  // Supabase/PostgREST のRLS拒否エラーコード
  const rlsErrorCodes = ['PGRST301', '42501', 'PGRST116'];

  return (
    rlsErrorCodes.includes(error.code) ||
    error.message?.includes('row-level security') ||
    error.message?.includes('permission denied') ||
    error.message?.includes('RLS')
  );
}

/**
 * セッション期限切れエラーかどうかを判定
 */
export function isSessionExpiredError(error: any): boolean {
  if (!error) return false;

  return (
    error.code === 'PGRST301' ||
    error.message?.includes('JWT expired') ||
    error.message?.includes('session') ||
    error.status === 401
  );
}
