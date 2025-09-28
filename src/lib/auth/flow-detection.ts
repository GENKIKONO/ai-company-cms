/**
 * フロー識別とユーザーアクセス判定
 * セルフサーブ（Single-Org）と代理店（Partner）フローの共存対応
 */

export type UserFlow = 'self_serve' | 'partner' | 'admin';

export interface UserAccess {
  flow: UserFlow;
  canCreateOrg: boolean;
  canAccessMultipleOrgs: boolean;
  ownedOrgId?: string;
  accessibleOrgIds: string[];
}

/**
 * ユーザーロールからフローを判定
 */
export function determineUserFlow(role: string): UserFlow {
  switch (role) {
    case 'admin':
      return 'admin';
    case 'partner':
      return 'partner';
    case 'org_owner':
    case 'org_editor':
    case 'viewer':
    default:
      return 'self_serve';
  }
}

/**
 * ユーザーのアクセス権限を算出
 */
export function calculateUserAccess(
  role: string,
  organizations: Array<{ id: string; user_role: string }> = []
): UserAccess {
  const flow = determineUserFlow(role);
  
  switch (flow) {
    case 'admin':
      return {
        flow: 'admin',
        canCreateOrg: true,
        canAccessMultipleOrgs: true,
        accessibleOrgIds: organizations.map(org => org.id),
      };
      
    case 'partner':
      return {
        flow: 'partner',
        canCreateOrg: true,
        canAccessMultipleOrgs: true,
        accessibleOrgIds: organizations.map(org => org.id),
      };
      
    case 'self_serve':
    default:
      const ownedOrg = organizations.find(org => 
        org.user_role === 'org_owner'
      );
      
      return {
        flow: 'self_serve',
        canCreateOrg: !ownedOrg, // セルフサーブは1組織のみ
        canAccessMultipleOrgs: false,
        ownedOrgId: ownedOrg?.id,
        accessibleOrgIds: ownedOrg ? [ownedOrg.id] : [],
      };
  }
}

/**
 * セルフサーブユーザーの導線判定
 */
export function getSelfServeRedirect(userAccess: UserAccess): string | null {
  if (userAccess.flow !== 'self_serve') {
    return null;
  }
  
  // 組織未保有の場合は作成画面へ
  if (!userAccess.ownedOrgId) {
    return '/organizations/new';
  }
  
  // 組織保有済みの場合はダッシュボードへ
  return '/dashboard';
}

/**
 * API エンドポイントのアクセス権限チェック
 */
export function canAccessApiEndpoint(
  userAccess: UserAccess, 
  endpoint: string, 
  orgId?: string
): boolean {
  // 管理者は全アクセス可能
  if (userAccess.flow === 'admin') {
    return true;
  }
  
  // パートナーは /api/organizations/* にアクセス可能
  if (userAccess.flow === 'partner') {
    if (endpoint.startsWith('/api/organizations')) {
      return !orgId || userAccess.accessibleOrgIds.includes(orgId);
    }
    return endpoint.startsWith('/api/my');
  }
  
  // セルフサーブは /api/my/* のみ
  if (userAccess.flow === 'self_serve') {
    if (endpoint.startsWith('/api/organizations')) {
      return false; // 403 Forbidden
    }
    return endpoint.startsWith('/api/my');
  }
  
  return false;
}