import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import { logger } from '@/lib/log';

// P1-3: organization_members.role CHECK制約に対応: ['owner','admin','member','viewer']
export type OrgRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface OrgMembership {
  organization_id: string;
  user_id: string;
  role: OrgRole;
  joined_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  status: string;
  // TODO: Supabase側に確認 - 他の必要なフィールドを追加
}

export interface OrgMemberInfo {
  user: { id: string; email: string };
  organization: Organization;
  membership: OrgMembership;
}

/**
 * サーバーサイド用Supabaseクライアント作成
 */
async function createServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (error) {
            // Server Component での cookie 設定エラーをハンドル
          }
        },
      },
    }
  );
}

/**
 * 内部関数: 組織ロール判定の統一エントリーポイント
 * P1-3: Supabase RPC has_org_role を使用（最終版）
 * 
 * @param userId - ユーザーID（現在は未使用、auth.uid()をRPC内で取得）
 * @param orgId - 組織ID
 * @param allowedRoles - 許可するロールの配列（nullの場合は全ロール許可）
 * @returns boolean - 条件を満たすか
 */
async function checkOrgRole(userId: string, orgId: string, allowedRoles?: OrgRole[]): Promise<boolean> {
  try {
    const supabase = await createServerSupabase();
    
    // デフォルト: 全ロール許可
    const wantedRoles = allowedRoles && allowedRoles.length > 0 
      ? allowedRoles 
      : ['owner', 'admin', 'member', 'viewer'];
    
    // Supabase RPC has_org_role 使用
    const { data: hasRole, error } = await supabase.rpc('has_org_role', {
      org_id: orgId,
      wanted_roles: wantedRoles
    });

    if (error) {
      logger.error('Error in has_org_role RPC', { orgId, wantedRoles, error: error.message });
      return false;
    }

    return hasRole === true;
  } catch (error) {
    logger.error('Exception in checkOrgRole', { orgId, allowedRoles, error });
    return false;
  }
}

/**
 * ユーザーが指定組織のメンバーかを確認
 * P1-3: organization_members を真実のソースとして使用
 */
export async function isOrgMember(userId: string, orgId: string): Promise<boolean> {
  // 内部統一関数を使用（将来RPC化時はここを差し替え）
  return checkOrgRole(userId, orgId);
}

/**
 * ユーザーが指定組織で指定ロール以上の権限を持つかを確認
 * P1-3: organization_members を真実のソースとして使用
 */
export async function hasOrgRole(userId: string, orgId: string, allowedRoles: OrgRole[]): Promise<boolean> {
  // 内部統一関数を使用（将来RPC化時はここを差し替え）
  return checkOrgRole(userId, orgId, allowedRoles);
}

/**
 * ユーザーの組織内ロールを取得
 * P1-3: Supabase RPC get_org_member を使用（最終版）
 * 
 * @param userId - ユーザーID（現在は未使用、auth.uid()をRPC内で取得）
 * @param orgId - 組織ID
 * @returns ロール文字列 | null
 */
export async function getUserOrgRole(userId: string, orgId: string): Promise<OrgRole | null> {
  try {
    const supabase = await createServerSupabase();
    
    // Supabase RPC get_org_member 使用
    const { data, error } = await supabase.rpc('get_org_member', {
      org_id: orgId
    });

    if (error) {
      logger.error('Error in get_org_member RPC', { orgId, error: error.message });
      return null;
    }

    // RPC returns table(role text, joined_at timestamptz) - 最初の行を取得
    if (data && data.length > 0) {
      return data[0].role as OrgRole;
    }

    return null;
  } catch (error) {
    logger.error('Exception in getUserOrgRole', { orgId, error });
    return null;
  }
}

/**
 * 組織メンバーシップ情報（組織情報含む）を取得
 * P1-3: Supabase RPC get_org_member + organizations 直接取得の組み合わせ
 * 
 * @param userId - 対象ユーザーID（auth.uid()をRPC内で使用するため参考値）
 * @param orgId - 組織ID  
 * @param userEmail - ユーザーメールアドレス（オプション、パフォーマンス向上のため）
 */
export async function getOrgMemberInfo(userId: string, orgId: string, userEmail?: string): Promise<OrgMemberInfo | null> {
  try {
    const supabase = await createServerSupabase();
    
    // 1. RPC でメンバーシップ確認
    const { data: memberData, error: memberError } = await supabase.rpc('get_org_member', {
      org_id: orgId
    });

    if (memberError) {
      logger.error('Error in get_org_member RPC for member info', { orgId, error: memberError.message });
      return null;
    }

    if (!memberData || memberData.length === 0) {
      return null;
    }

    const membership = memberData[0];

    // 2. 組織情報を取得
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, slug, status')
      .eq('id', orgId)
      .maybeSingle();

    if (orgError || !orgData) {
      logger.error('Error getting organization info', { orgId, error: orgError?.message });
      return null;
    }

    // ユーザー情報: メールが提供されていない場合は空文字列を使用
    const finalUserEmail = userEmail || '';

    return {
      user: { 
        id: userId, 
        email: finalUserEmail
      },
      organization: orgData as Organization,
      membership: {
        organization_id: orgId,
        user_id: userId,
        role: membership.role as OrgRole,
        joined_at: membership.joined_at
      }
    };
  } catch (error) {
    logger.error('Exception in getOrgMemberInfo', { orgId, error });
    return null;
  }
}

/**
 * 管理者権限（owner/admin）チェック用のヘルパー
 * P1-3: 内部統一関数を使用
 */
export async function isOrgAdminOrOwner(userId: string, orgId: string): Promise<boolean> {
  return checkOrgRole(userId, orgId, ['owner', 'admin']);
}

/**
 * オーナー権限チェック用のヘルパー
 * P1-3: 内部統一関数を使用
 */
export async function isOrgOwner(userId: string, orgId: string): Promise<boolean> {
  return checkOrgRole(userId, orgId, ['owner']);
}

//
// P1-3 最終エクスポート: 本番で使用する組織ロール関数
//
// 【メイン関数（推奨）】
// - isOrgMember(): 任意のロールでのメンバーシップ確認
// - hasOrgRole(): 特定ロール以上の権限確認
// - getOrgMemberInfo(): 組織情報付きメンバーシップ情報取得
//
// 【便利関数】
// - getUserOrgRole(): ユーザーの組織内ロール取得のみ
// - isOrgAdminOrOwner(): 管理権限（admin/owner）チェック
// - isOrgOwner(): オーナー権限チェック
//
// 【想定ユースケース】
// 1. 権限ガードとの連携: auth/server.ts の requireOrgMember() 内で使用
// 2. メンバー情報表示: getOrgMemberInfo() でユーザー情報 + 組織情報を一括取得
// 3. 管理画面アクセス制御: isOrgAdminOrOwner() で管理権限チェック
// 4. RPC移行準備完了: 全関数でhas_org_role/get_org_memberを使用済み
//