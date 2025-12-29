'use client';

/**
 * DashboardPageShell - Dashboard統一ページシェル
 *
 * @description
 * 全Dashboardページの外枠を提供する統一コンポーネント
 *
 * 機能:
 * - 認証チェック
 * - 権限チェック（DBのRPC関数へ委譲）
 * - エラーバウンダリ
 * - ローディング状態
 * - 組織コンテキスト提供
 *
 * @note 権限判定はDBを正とする
 * - フロントでは role 名の解釈/比較ロジックを持たない
 * - DBの関数 `user_has_org_role` / `is_site_admin` に完全委譲
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardErrorBoundary } from './DashboardErrorBoundary';
import { DashboardLoadingState } from './ui/DashboardLoadingState';
import { DashboardAlert } from './ui/DashboardAlert';
import { DashboardSection } from './ui/DashboardSection';
import { getCurrentUserClient as getCurrentUser } from '@/lib/core/auth-state.client';
import { createClient } from '@/lib/supabase/client';
import {
  hasOrgRole,
  isSiteAdmin,
  mapRequiredRole,
  isRLSDeniedError,
  isSessionExpiredError,
  type OrgRole,
} from '@/lib/authz';
import { auditLogWriteClient } from '@/lib/core/audit-logger.client';
import type { AppUser } from '@/types/legacy/database';
import type { UserRole } from '@/types/utils/database';
import { v4 as uuidv4 } from 'uuid';

// =====================================================
// TYPES
// =====================================================

export interface OrganizationContext {
  id: string;
  name: string;
  slug: string;
  plan: string | null;
}

export interface DashboardPageContext {
  /** 現在のユーザー */
  user: AppUser | null;
  /** 現在の組織 */
  organization: OrganizationContext | null;
  /** 組織ID */
  organizationId: string | null;
  /** ユーザーロール（参考値、権限判定にはhasOrgRoleを使用） */
  userRole: UserRole;
  /** 読み込み中か */
  isLoading: boolean;
  /** 権限チェック関数（DB RPCベース） */
  checkPermission: (requiredRole: OrgRole) => Promise<boolean>;
  /** データ更新関数 */
  refresh: () => Promise<void>;
  /** リクエストID（エラー追跡用） */
  requestId: string;
}

export interface DashboardPageShellProps {
  children: React.ReactNode;
  /** 必要な最低権限（デフォルト: viewer） */
  requiredRole?: UserRole;
  /** 機能フラグ（プランで制限する機能名） */
  featureFlag?: string;
  /** ページタイトル（ドキュメントタイトル用） */
  title?: string;
  /** ローディング中のスケルトン表示 */
  loadingSkeleton?: React.ReactNode;
  /** 認証不要（パブリックページ用） */
  public?: boolean;
  /** サイト管理者専用（org_idなしでもadmin権限が必要） */
  siteAdminOnly?: boolean;
}

// =====================================================
// CONTEXT
// =====================================================

const PageContext = createContext<DashboardPageContext | null>(null);

/**
 * Dashboardページコンテキストを取得するフック
 */
export function useDashboardPageContext(): DashboardPageContext {
  const context = useContext(PageContext);
  if (!context) {
    throw new Error('useDashboardPageContext must be used within DashboardPageShell');
  }
  return context;
}

// =====================================================
// COMPONENT
// =====================================================

export function DashboardPageShell({
  children,
  requiredRole = 'viewer',
  featureFlag,
  title,
  loadingSkeleton,
  public: isPublic = false,
  siteAdminOnly = false,
}: DashboardPageShellProps) {
  const router = useRouter();

  // Request ID for error tracking
  const [requestId] = useState(() => uuidv4());

  // State
  const [user, setUser] = useState<AppUser | null>(null);
  const [organization, setOrganization] = useState<OrganizationContext | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('viewer');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  /**
   * 監査ログ送信（Core経由）
   */
  const logToAudit = useCallback(async (
    action: string,
    status: 'success' | 'error' | 'denied',
    reason?: string
  ) => {
    // Core の auditLogWriteClient を使用
    await auditLogWriteClient({
      action,
      request_id: requestId,
      reason,
      status,
    });
  }, [requestId]);

  /**
   * ユーザーと組織データを取得
   */
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setErrorCode(null);
    setPermissionError(null);

    try {
      // Get current user
      const currentUser = await getCurrentUser();

      if (!currentUser && !isPublic) {
        // Not authenticated - redirect to login
        router.push('/auth/login?redirect=' + encodeURIComponent(window.location.pathname));
        return;
      }

      setUser(currentUser);

      if (currentUser) {
        const supabase = await createClient();
        const mappedRole = mapRequiredRole(requiredRole);

        // サイト管理者専用ページの場合
        if (siteAdminOnly || (requiredRole === 'admin' && !organization)) {
          const isAdmin = await isSiteAdmin(supabase);
          if (!isAdmin) {
            setPermissionError('このページにアクセスするにはサイト管理者権限が必要です');
            await logToAudit('page_access', 'denied', 'site_admin_required');
            return;
          }
        }

        // Get user's organization using view (v_current_user_orgs recommended)
        // Fallback to organization_members if view doesn't exist
        let membership: { organization_id: string; role: string } | null = null;

        try {
          // Try v_current_user_orgs first (recommended view)
          const { data: viewData, error: viewError } = await supabase
            .from('v_current_user_orgs')
            .select('organization_id, role')
            .maybeSingle();

          if (!viewError && viewData) {
            membership = viewData;
          }
        } catch {
          // View might not exist, fall back to direct table
        }

        if (!membership) {
          // Fallback: direct query to organization_members
          const { data: membershipData, error: membershipError } = await supabase
            .from('organization_members')
            .select('organization_id, role')
            .eq('user_id', currentUser.id)
            .maybeSingle();

          if (membershipError) {
            if (isRLSDeniedError(membershipError)) {
              setErrorCode('RLS_DENIED');
              setError('アクセス権限がありません');
              await logToAudit('page_access', 'denied', 'rls_denied');
              return;
            }
            if (isSessionExpiredError(membershipError)) {
              router.push('/auth/login?redirect=' + encodeURIComponent(window.location.pathname));
              return;
            }
            throw membershipError;
          }

          membership = membershipData;
        }

        if (membership) {
          // Get organization details
          const { data: org, error: orgError } = await supabase
            .from('organizations')
            .select('id, name, slug, plan')
            .eq('id', membership.organization_id)
            .single();

          if (orgError) {
            if (isRLSDeniedError(orgError)) {
              setErrorCode('RLS_DENIED');
              setError('組織情報へのアクセス権限がありません');
              await logToAudit('page_access', 'denied', 'org_rls_denied');
              return;
            }
            throw orgError;
          }

          setOrganization({
            id: org.id,
            name: org.name,
            slug: org.slug,
            plan: org.plan,
          });

          // Set user role from membership (for display purposes only)
          const role = (membership.role as UserRole) || 'viewer';
          setUserRole(role);

          // Check required permission via DB RPC
          // 権限判定はDBに完全委譲 - JSでの比較は行わない
          if (requiredRole !== 'viewer') {
            const hasPermission = await hasOrgRole(supabase, org.id, mappedRole);
            if (!hasPermission) {
              setPermissionError(
                `このページにアクセスするには${getRoleDisplayName(requiredRole)}以上の権限が必要です`
              );
              await logToAudit('page_access', 'denied', `required_role_${requiredRole}`);
              return;
            }
          }
        } else {
          // No organization membership
          if (requiredRole !== 'viewer') {
            // Admin pages without org might need site_admin check
            if (requiredRole === 'admin') {
              const isAdmin = await isSiteAdmin(supabase);
              if (!isAdmin) {
                setPermissionError('組織に所属していないか、権限がありません');
                await logToAudit('page_access', 'denied', 'no_org_membership');
                return;
              }
            } else {
              setPermissionError('組織に所属していません');
              await logToAudit('page_access', 'denied', 'no_org_membership');
              return;
            }
          }
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'データの取得に失敗しました';
      setError(message);

      // Check for specific error types
      if (isRLSDeniedError(err)) {
        setErrorCode('RLS_DENIED');
        await logToAudit('page_access', 'error', 'rls_denied');
      } else if (isSessionExpiredError(err)) {
        router.push('/auth/login?redirect=' + encodeURIComponent(window.location.pathname));
        return;
      } else {
        await logToAudit('page_access', 'error', message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isPublic, requiredRole, siteAdminOnly, router, logToAudit]);

  /**
   * 権限チェック関数（DBのRPCを使用）
   */
  const checkPermission = useCallback(async (role: OrgRole): Promise<boolean> => {
    if (!organization?.id) return false;

    try {
      const supabase = await createClient();
      return await hasOrgRole(supabase, organization.id, role);
    } catch {
      return false;
    }
  }, [organization?.id]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Update document title
  useEffect(() => {
    if (title) {
      document.title = `${title} | AIO Hub Dashboard`;
    }
  }, [title]);

  // Context value
  const contextValue: DashboardPageContext = {
    user,
    organization,
    organizationId: organization?.id || null,
    userRole,
    isLoading,
    checkPermission,
    refresh: fetchData,
    requestId,
  };

  // Render loading state
  if (isLoading) {
    return (
      <DashboardSection>
        {loadingSkeleton || <DashboardLoadingState message="読み込み中..." />}
      </DashboardSection>
    );
  }

  // Render error state
  if (error) {
    return (
      <DashboardSection>
        <DashboardAlert
          variant="error"
          title={errorCode === 'RLS_DENIED' ? '権限エラー' : 'エラーが発生しました'}
          action={{
            label: '再読み込み',
            onClick: () => window.location.reload(),
          }}
        >
          {error}
          <span className="block mt-2 text-xs text-gray-500">
            リクエストID: {requestId}
          </span>
        </DashboardAlert>
      </DashboardSection>
    );
  }

  // Render permission error
  if (permissionError) {
    return (
      <DashboardSection>
        <DashboardAlert
          variant="warning"
          title="アクセス権限がありません"
          action={{
            label: 'ダッシュボードに戻る',
            onClick: () => router.push('/dashboard'),
          }}
        >
          {permissionError}
          <span className="block mt-2 text-xs text-gray-500">
            リクエストID: {requestId}
          </span>
        </DashboardAlert>
      </DashboardSection>
    );
  }

  // Render children with context
  return (
    <PageContext.Provider value={contextValue}>
      <DashboardErrorBoundary>
        {children}
      </DashboardErrorBoundary>
    </PageContext.Provider>
  );
}

// =====================================================
// UTILITIES
// =====================================================

function getRoleDisplayName(role: UserRole): string {
  switch (role) {
    case 'viewer':
      return '閲覧者';
    case 'editor':
      return '編集者';
    case 'admin':
      return '管理者';
    default:
      return role;
  }
}

// =====================================================
// HOC VERSION
// =====================================================

/**
 * HOC版 DashboardPageShell
 * クラスコンポーネントや既存ページのラップに使用
 */
export function withDashboardPageShell<P extends object>(
  Component: React.ComponentType<P & { pageContext: DashboardPageContext }>,
  options: Omit<DashboardPageShellProps, 'children'> = {}
) {
  return function WrappedComponent(props: P) {
    return (
      <DashboardPageShell {...options}>
        <PageContextConsumer>
          {(context) => <Component {...props} pageContext={context} />}
        </PageContextConsumer>
      </DashboardPageShell>
    );
  };
}

/**
 * Context Consumer コンポーネント
 */
function PageContextConsumer({
  children,
}: {
  children: (context: DashboardPageContext) => React.ReactNode;
}) {
  const context = useDashboardPageContext();
  return <>{children(context)}</>;
}

// =====================================================
// EXPORTS
// =====================================================

export default DashboardPageShell;
