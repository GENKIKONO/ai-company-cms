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
 *
 * @note 2024-01: organizations 取得を API Route 経由に変更
 * - クライアントサイドの createBrowserClient では auth.uid() が NULL になる問題を回避
 * - /api/dashboard/init で server-side の createServerClient を使用
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { DashboardErrorBoundary } from './DashboardErrorBoundary';
import { DashboardLoadingState } from './ui/DashboardLoadingState';
import { DashboardAlert } from './ui/DashboardAlert';
import { DashboardSection } from './ui/DashboardSection';
import { getCurrentUserClient as getCurrentUser } from '@/lib/core/auth-state.client';
import { createClient } from '@/lib/supabase/client';
import type { AuthState } from '@/lib/auth/auth-state';
import {
  hasOrgRole,
  isSiteAdmin,
  mapRequiredRole,
  type OrgRole,
} from '@/lib/authz';
import { auditLogWriteClient } from '@/lib/core/audit-logger.client';
import { logger } from '@/lib/utils/logger';
import type { AppUser } from '@/types/legacy/database';
import type { UserRole } from '@/types/utils/database';
import { v4 as uuidv4 } from 'uuid';
import type { DashboardInitResponse } from '@/app/api/dashboard/init/route';

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
  const searchParams = useSearchParams();

  // 診断モード: ?diag=1 で有効化
  const isDiagMode = searchParams?.get('diag') === '1';

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
  // Phase 3: AuthState による状態管理
  const [authState, setAuthState] = useState<AuthState>('UNAUTHENTICATED');
  // 診断用: Supabase エラー詳細（PII なし）
  const [errorDetails, setErrorDetails] = useState<{
    whichQuery?: string;
    supabaseCode?: string;
    supabaseMessage?: string;
    supabaseDetails?: string;
    supabaseHint?: string;
    context?: string;
  } | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isDataFetched, setIsDataFetched] = useState(false);
  // ビルドSHA（APIから取得）
  const [buildSha, setBuildSha] = useState<string>('loading...');

  // Fetch counter ref to track current fetch and ignore stale results
  // This prevents race conditions during client-side navigation
  const fetchCounterRef = useRef(0);
  // Ref to track if component is mounted (for cleanup)
  const isMountedRef = useRef(true);

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
   *
   * 2024-01: API Route 経由で取得に変更
   * - クライアントサイドの createBrowserClient では auth.uid() が NULL になる問題を回避
   * - /api/dashboard/init で server-side の createServerClient を使用
   *
   * Race condition対策:
   * - fetchCounterRef で現在のfetchを追跡
   * - 古いfetchの結果は無視（stale closure問題を防止）
   * - コンポーネントアンマウント後の状態更新を防止
   */
  const fetchData = useCallback(async () => {
    // Increment counter and capture current fetch ID
    fetchCounterRef.current += 1;
    const currentFetchId = fetchCounterRef.current;

    // Helper to check if this fetch is still valid
    const isStale = () => currentFetchId !== fetchCounterRef.current || !isMountedRef.current;

    setIsLoading(true);
    setError(null);
    setErrorCode(null);
    setErrorDetails(null);
    setPermissionError(null);
    setIsDataFetched(false);

    try {
      // Public ページの場合は認証不要
      if (isPublic) {
        setAuthState('UNAUTHENTICATED');
        setIsLoading(false);
        setIsDataFetched(true);
        return;
      }

      // ========================================
      // API Route 経由で organizations/memberships を取得
      // サーバーサイドの createServerClient を使用することで
      // auth.uid() の解決を確実に行う
      // ========================================
      const initResponse = await fetch('/api/dashboard/init', {
        credentials: 'include', // Cookie を送信
        cache: 'no-store',
      });

      if (isStale()) return;

      const initData: DashboardInitResponse = await initResponse.json();

      // ビルド SHA を取得
      if (initData.sha) {
        setBuildSha(initData.sha);
      }

      // エラーハンドリング
      if (!initData.ok && initData.error) {
        const { code, message, whichQuery, details, hint } = initData.error;

        // 診断用: エラー詳細をキャプチャ
        setErrorDetails({
          whichQuery: whichQuery || 'unknown',
          supabaseCode: code,
          supabaseMessage: message,
          supabaseDetails: details || undefined,
          supabaseHint: hint || undefined,
          context: `${whichQuery || 'unknown'} (server-side via API Route)`,
        });

        // ログ出力
        const logPayload = {
          requestId: initData.requestId,
          route: pathname,
          queryName: whichQuery,
          clientType: 'createServerClient (API Route)',
          supabaseError: { code, message, details, hint },
        };
        logger.error(`[DashboardPageShell] ${whichQuery || 'init'} query failed`, logPayload);
        // eslint-disable-next-line no-console
        console.error('[DashboardPageShell] Query failed:', logPayload);

        // 認証エラー
        if (code === 'NO_AUTH_COOKIE' || code === 'NO_USER_SESSION' || code === 'AUTH_ERROR') {
          setAuthState('AUTH_FAILED');
          setError('認証情報の取得に失敗しました。ページを再読み込みしてください。');
          setErrorCode(code);
          return;
        }

        // その他のエラー
        setAuthState('AUTH_FAILED');
        setError(`${whichQuery || 'データ'} の取得に失敗しました (${code})`);
        setErrorCode(code);
        return;
      }

      // ユーザー情報がない場合
      if (!initData.user) {
        setAuthState('UNAUTHENTICATED');
        setError('認証情報の取得に失敗しました。ページを再読み込みしてください。');
        setErrorCode('UNAUTHENTICATED');
        return;
      }

      // getCurrentUser で AppUser 型に変換（profile 情報を含む）
      const currentUser = await getCurrentUser();

      if (isStale()) return;

      if (!currentUser) {
        setAuthState('AUTH_FAILED');
        setError('ユーザー情報の取得に失敗しました。');
        setErrorCode('USER_PROFILE_ERROR');
        return;
      }

      setUser(currentUser);

      // ========================================
      // 権限チェック
      // ========================================
      const supabase = createClient();
      const mappedRole = mapRequiredRole(requiredRole);

      // サイト管理者専用ページの場合
      if (siteAdminOnly || (requiredRole === 'admin' && !organization)) {
        const isAdmin = await isSiteAdmin(supabase);
        if (isStale()) return;
        if (!isAdmin) {
          setPermissionError('このページにアクセスするにはサイト管理者権限が必要です');
          await logToAudit('page_access', 'denied', 'site_admin_required');
          return;
        }
      }

      const memberships = initData.memberships || [];
      const orgsData = initData.organizations || [];

      // Phase 3: メンバーシップに基づいて AuthState を設定
      if (memberships.length === 0) {
        setAuthState('AUTHENTICATED_NO_ORG');
      } else {
        setAuthState('AUTHENTICATED_READY');
      }

      if (memberships.length > 0 && orgsData.length > 0) {
        // Map organizations with their contexts
        const orgContexts: OrganizationContext[] = orgsData.map(org => ({
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
            if (isStale()) return;
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
        // ログ出力: 組織が0件になった理由を記録
        logger.warn('[DashboardPageShell] No organization membership found', {
          userId: currentUser.id,
          membershipRowsCount: 0,
          reason: 'organization_members returned empty for this user'
        });
        setOrganizations([]);
        setOrganization(null);

        if (requiredRole !== 'viewer') {
          // Admin pages without org might need site_admin check
          if (requiredRole === 'admin') {
            const isAdmin = await isSiteAdmin(supabase);
            if (isStale()) return;
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
    } catch (err) {
      // Ignore errors from stale fetches
      if (isStale()) return;

      const message = err instanceof Error ? err.message : 'データの取得に失敗しました';
      setError(message);
      setErrorCode('FETCH_ERROR');
      await logToAudit('page_access', 'error', message);
    } finally {
      // Only update loading state if this fetch is still current
      if (!isStale()) {
        setIsLoading(false);
        setIsDataFetched(true);
      }
    }
  // pathname を依存配列に追加: クライアントサイドナビゲーション時にデータを再取得
  // NOTE: router は fetchData 内で未使用のため依存から除外（unstable reference による無限ループ防止）
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPublic, requiredRole, siteAdminOnly, logToAudit, pathname]);

  /**
   * 権限チェック関数（DBのRPCを使用）
   */
  const checkPermission = useCallback(async (role: OrgRole): Promise<boolean> => {
    if (!organization?.id) return false;

    try {
      const supabase = createClient();
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

  // Component mount tracking and data fetch
  useEffect(() => {
    // Mark component as mounted
    isMountedRef.current = true;

    // Fetch data (buildSha is now fetched from /api/dashboard/init)
    fetchData();

    // Cleanup: mark component as unmounted to prevent stale updates
    return () => {
      isMountedRef.current = false;
    };
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

    // 診断情報をまとめる（コピペ用）
    const diagData = {
      sha: buildSha,
      requestId,
      authState,
      errorCode,
      userId: user?.id || null,
      organizationId: organization?.id || null,
      whichQuery: errorDetails?.whichQuery || null,
      error: {
        code: errorDetails?.supabaseCode || null,
        message: errorDetails?.supabaseMessage || error,
        details: errorDetails?.supabaseDetails || null,
        hint: errorDetails?.supabaseHint || null,
      },
      context: errorDetails?.context || null,
      timestamp: new Date().toISOString(),
    };

    return (
      <DashboardSection>
        <DashboardAlert
          variant="error"
          title={errorCode === 'RLS_DENIED' ? '権限エラー' : 'データベースエラー'}
          action={{
            label: '再読み込み',
            onClick: () => window.location.reload(),
          }}
        >
          {error}

          {/* 常に表示: 基本診断情報 */}
          <div className="mt-3 p-2 bg-[var(--aio-surface)] rounded text-xs font-mono text-left">
            <div><strong>whichQuery:</strong> {errorDetails?.whichQuery || 'N/A'}</div>
            <div><strong>code:</strong> {errorDetails?.supabaseCode || errorCode || 'N/A'}</div>
            <div><strong>message:</strong> {errorDetails?.supabaseMessage || 'N/A'}</div>
            <div><strong>requestId:</strong> {requestId}</div>
            <div><strong>sha:</strong> {buildSha}</div>
          </div>

          {/* 診断モードまたはdetails展開時: 詳細情報 */}
          {isDiagMode ? (
            <div className="mt-3 p-2 bg-[var(--aio-surface)] rounded text-xs font-mono text-left">
              <div className="font-bold mb-2">【診断モード: 詳細情報】</div>
              <div><strong>authState:</strong> {authState}</div>
              <div><strong>userId:</strong> {user?.id || 'null'}</div>
              <div><strong>organizationId:</strong> {organization?.id || 'null'}</div>
              {errorDetails?.supabaseDetails && (
                <div><strong>details:</strong> {errorDetails.supabaseDetails}</div>
              )}
              {errorDetails?.supabaseHint && (
                <div><strong>hint:</strong> {errorDetails.supabaseHint}</div>
              )}
              {errorDetails?.context && (
                <div><strong>context:</strong> {errorDetails.context}</div>
              )}
              <div className="mt-2 pt-2 border-t border-[var(--dashboard-card-border)]">
                <div className="font-bold">コピー用JSON:</div>
                <pre className="mt-1 p-1 bg-white rounded overflow-auto max-h-32 text-[10px]">
                  {JSON.stringify(diagData, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <details className="mt-3 text-xs">
              <summary className="cursor-pointer text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]">
                詳細診断情報を表示（?diag=1 で自動展開）
              </summary>
              <div className="mt-2 p-2 bg-[var(--aio-surface)] rounded text-left font-mono">
                <div><strong>authState:</strong> {authState}</div>
                <div><strong>userId:</strong> {user?.id || 'null'}</div>
                <div><strong>organizationId:</strong> {organization?.id || 'null'}</div>
                {errorDetails?.supabaseDetails && (
                  <div><strong>details:</strong> {errorDetails.supabaseDetails}</div>
                )}
                {errorDetails?.supabaseHint && (
                  <div><strong>hint:</strong> {errorDetails.supabaseHint}</div>
                )}
                {errorDetails?.context && (
                  <div><strong>context:</strong> {errorDetails.context}</div>
                )}
              </div>
            </details>
          )}
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
