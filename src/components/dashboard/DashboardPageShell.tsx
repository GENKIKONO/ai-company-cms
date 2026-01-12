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
import { useRouter, usePathname } from 'next/navigation';
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
  /** ユーザーが所属する全組織一覧 */
  organizations: OrganizationContext[];
  /** ユーザーロール（参考値、権限判定にはhasOrgRoleを使用） */
  userRole: UserRole;
  /** 読み込み中か */
  isLoading: boolean;
  /** 組織が0件（オンボーディング対象） */
  isReallyEmpty: boolean;
  /** 権限チェック関数（DB RPCベース） */
  checkPermission: (requiredRole: OrgRole) => Promise<boolean>;
  /** データ更新関数 */
  refresh: () => Promise<void>;
  /** 組織関連キャッシュ無効化（コンテンツ更新時に使用） */
  invalidateOrganization: () => Promise<void>;
  /** リクエストID（エラー追跡用） */
  requestId: string;
}

/** 拡張ポイント用のレンダー関数型 */
export type ShellRenderFn = (ctx: DashboardPageContext) => React.ReactNode;

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
  /** 組織未作成時のカスタムUI（/dashboard トップページ用） */
  onEmptyOrganization?: React.ReactNode | ShellRenderFn;
  /** 権限エラー時のカスタムUI */
  onPermissionError?: React.ReactNode | ShellRenderFn;
  /** システムエラー時のカスタムUI */
  onSystemError?: React.ReactNode | ShellRenderFn;
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

/**
 * Dashboardページコンテキストを取得するフック（セーフ版）
 * DashboardPageShell 外で呼ばれた場合は null を返す
 * @internal useOrganization のラッパ化移行用
 */
export function useDashboardPageContextSafe(): DashboardPageContext | null {
  return useContext(PageContext);
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
  onEmptyOrganization,
  onPermissionError,
  onSystemError,
}: DashboardPageShellProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Request ID for error tracking
  const [requestId] = useState(() => uuidv4());

  // State
  const [user, setUser] = useState<AppUser | null>(null);
  const [organization, setOrganization] = useState<OrganizationContext | null>(null);
  const [organizations, setOrganizations] = useState<OrganizationContext[]>([]);
  const [userRole, setUserRole] = useState<UserRole>('viewer');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isDataFetched, setIsDataFetched] = useState(false);

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
    setIsDataFetched(false);

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

        // Get ALL user's organizations using view (v_current_user_orgs recommended)
        // Fallback to organization_members if view doesn't exist
        let memberships: { organization_id: string; role: string }[] = [];

        // Try v_current_user_orgs first, fall back to organization_members if permission denied
        const { data: viewData, error: viewError } = await supabase
          .from('v_current_user_orgs')
          .select('organization_id, role');

        if (!viewError && viewData && viewData.length > 0) {
          memberships = viewData;
        }
        // viewError (including 42501 permission denied) → fallback below

        if (memberships.length === 0) {
          // Fallback: direct query to organization_members
          const { data: membershipData, error: membershipError } = await supabase
            .from('organization_members')
            .select('organization_id, role')
            .eq('user_id', currentUser.id);

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

          memberships = membershipData || [];
        }

        if (memberships.length > 0) {
          // Get all organization details
          const orgIds = memberships.map(m => m.organization_id);
          const { data: orgsData, error: orgsError } = await supabase
            .from('organizations')
            .select('id, name, slug, plan')
            .in('id', orgIds);

          if (orgsError) {
            if (isRLSDeniedError(orgsError)) {
              setErrorCode('RLS_DENIED');
              setError('組織情報へのアクセス権限がありません');
              await logToAudit('page_access', 'denied', 'org_rls_denied');
              return;
            }
            throw orgsError;
          }

          // Map organizations with their contexts
          const orgContexts: OrganizationContext[] = (orgsData || []).map(org => ({
            id: org.id,
            name: org.name,
            slug: org.slug,
            plan: org.plan,
          }));

          setOrganizations(orgContexts);

          // Set the first organization as the current one (or could be selected)
          const firstMembership = memberships[0];
          const currentOrg = orgContexts.find(o => o.id === firstMembership.organization_id) || orgContexts[0];

          if (currentOrg) {
            setOrganization(currentOrg);

            // Set user role from first membership (for display purposes only)
            const role = (firstMembership.role as UserRole) || 'viewer';
            setUserRole(role);

            // Check required permission via DB RPC
            // 権限判定はDBに完全委譲 - JSでの比較は行わない
            if (requiredRole !== 'viewer') {
              const hasPermission = await hasOrgRole(supabase, currentOrg.id, mappedRole);
              if (!hasPermission) {
                setPermissionError(
                  `このページにアクセスするには${getRoleDisplayName(requiredRole)}以上の権限が必要です`
                );
                await logToAudit('page_access', 'denied', `required_role_${requiredRole}`);
                return;
              }
            }
          }
        } else {
          // No organization membership - isReallyEmpty will be true
          setOrganizations([]);
          setOrganization(null);

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
      setIsDataFetched(true);
    }
  // pathname を依存配列に追加: クライアントサイドナビゲーション時にデータを再取得
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPublic, requiredRole, siteAdminOnly, router, logToAudit, pathname]);

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

  /**
   * 組織関連キャッシュ無効化
   * コンテンツ更新時に使用
   */
  const invalidateOrganization = useCallback(async () => {
    // 現在はrefreshと同等。将来的にはSWR等のキャッシュ無効化も追加可能
    await fetchData();
  }, [fetchData]);

  // 組織が0件（オンボーディング対象）
  const isReallyEmpty = isDataFetched && !isLoading && organizations.length === 0 && !error && !permissionError;

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
    organizations,
    userRole,
    isLoading,
    isReallyEmpty,
    checkPermission,
    refresh: fetchData,
    invalidateOrganization,
    requestId,
  };

  /**
   * 拡張ポイントのレンダリングヘルパー
   */
  const renderExtensionPoint = (
    point: React.ReactNode | ShellRenderFn | undefined
  ): React.ReactNode | null => {
    if (!point) return null;
    if (typeof point === 'function') {
      return point(contextValue);
    }
    return point;
  };

  // Render loading state
  if (isLoading) {
    return (
      <DashboardSection>
        {loadingSkeleton || <DashboardLoadingState message="読み込み中..." />}
      </DashboardSection>
    );
  }

  // Render error state (with extension point)
  if (error) {
    const customErrorUI = renderExtensionPoint(onSystemError);
    if (customErrorUI) {
      return (
        <PageContext.Provider value={contextValue}>
          <DashboardErrorBoundary>
            {customErrorUI}
          </DashboardErrorBoundary>
        </PageContext.Provider>
      );
    }

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
          <span className="block mt-2 text-xs text-[var(--color-text-tertiary)]">
            リクエストID: {requestId}
          </span>
        </DashboardAlert>
      </DashboardSection>
    );
  }

  // Render permission error (with extension point)
  if (permissionError) {
    const customPermissionUI = renderExtensionPoint(onPermissionError);
    if (customPermissionUI) {
      return (
        <PageContext.Provider value={contextValue}>
          <DashboardErrorBoundary>
            {customPermissionUI}
          </DashboardErrorBoundary>
        </PageContext.Provider>
      );
    }

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
          <span className="block mt-2 text-xs text-[var(--color-text-tertiary)]">
            リクエストID: {requestId}
          </span>
        </DashboardAlert>
      </DashboardSection>
    );
  }

  // Render empty organization state (with extension point)
  if (isReallyEmpty && user) {
    const customEmptyUI = renderExtensionPoint(onEmptyOrganization);
    if (customEmptyUI) {
      return (
        <PageContext.Provider value={contextValue}>
          <DashboardErrorBoundary>
            {customEmptyUI}
          </DashboardErrorBoundary>
        </PageContext.Provider>
      );
    }

    // Default empty organization UI - redirect to create organization
    return (
      <DashboardSection>
        <DashboardAlert
          variant="info"
          title="組織を作成してください"
          action={{
            label: '組織を作成',
            onClick: () => router.push('/organizations/new'),
          }}
        >
          ダッシュボードを利用するには、まず組織を作成してください。
          <span className="block mt-2 text-xs text-[var(--color-text-tertiary)]">
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
