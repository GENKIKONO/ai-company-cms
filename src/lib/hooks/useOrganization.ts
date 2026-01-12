/**
 * 組織コンテキストフック
 * 現在のユーザーの組織情報を管理
 *
 * Version 5: DashboardPageShell コンテキスト統合版
 * - DashboardPageShell 内では useDashboardPageContext() を使用
 * - Shell 外では従来の SWR ベース実装にフォールバック
 * - 段階的移行のため、両方のパスをサポート
 *
 * @deprecated DashboardPageShell 配下では useDashboardPageContext() を直接使用してください
 */

import useSWR from 'swr';
import { useCallback } from 'react';
import { fetcher } from '@/lib/utils/fetcher';
import { useCacheManager } from './useCacheManager';
import { CACHE_KEYS } from '@/lib/cache/keys';
import { logger } from '@/lib/log';
import { useAuth } from './useAuth';
import { MeApiResponse, OrganizationSummary } from '@/types/organization-summary';
import { useDashboardPageContextSafe } from '@/components/dashboard/DashboardPageShell';

// 構造化エラータイプ（/api/me と同期）
type MeErrorType =
  | 'permission_denied'   // RLS 42501 / アクセス権なし
  | 'system_error'        // 内部エラー
  | 'none';               // エラーなし

// 拡張 MeApiResponse（errorType フィールド付き）
interface ExtendedMeApiResponse extends MeApiResponse {
  errorType?: MeErrorType;
}

// 後方互換のために旧型定義も維持
export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: 'free' | 'starter' | 'business' | 'enterprise';
  feature_flags: Record<string, boolean>;
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  segment?: 'test_user' | 'early_user' | 'normal_user';
}

// 旧 MeResponse は OrganizationSummary ベースの新形式に移行
export interface MeResponse {
  user: User | null;
  organization: OrganizationSummary | null;        // 後方互換（型をOrganizationSummaryに変更）
  organizations?: OrganizationSummary[];           // 新形式
  selectedOrganization?: OrganizationSummary | null; // 新形式
  error?: string;                                  // エラー情報
}

/**
 * 現在のユーザーと組織情報を同時に取得
 * @deprecated DashboardPageShell 配下では useDashboardPageContext() を直接使用してください
 */
export function useOrganization() {
  // DashboardPageShell 内であればコンテキストを使用
  const shellContext = useDashboardPageContextSafe();

  // 両方のHookを常に呼び出す（React Hooksルール準拠）
  // shellContext が存在する場合、legacyResult は使用されないが呼び出しは必要
  const legacyResult = useOrganizationLegacyInternal(!shellContext);

  // Shell コンテキストが利用可能な場合はそれを使用
  if (shellContext) {
    if (process.env.NODE_ENV === 'development') {
      // 開発時のみ警告（一度だけ）
      logger.debug('[DEPRECATED] useOrganization() called inside DashboardPageShell. Use useDashboardPageContext() directly.');
    }

    // Shell コンテキストを useOrganization の戻り値形式にマッピング
    return {
      user: shellContext.user,
      organization: shellContext.organization ? {
        ...shellContext.organization,
        feature_flags: {} as Record<string, boolean>, // Shell では feature_flags を持たない
      } : null,
      organizations: shellContext.organizations.map(org => ({
        ...org,
        feature_flags: {} as Record<string, boolean>,
      })),
      selectedOrganization: shellContext.organization ? {
        ...shellContext.organization,
        feature_flags: {} as Record<string, boolean>,
      } : null,
      isLoading: shellContext.isLoading,
      error: null,
      hasPermissionError: false, // Shell 内ではすでにハンドル済み
      hasSystemError: false,     // Shell 内ではすでにハンドル済み
      isDataFetched: !shellContext.isLoading,
      isReallyEmpty: shellContext.isReallyEmpty,
      invalidateOrganization: shellContext.invalidateOrganization,
      refresh: shellContext.refresh,
    };
  }

  // Shell 外の場合は従来の SWR 実装を使用
  return legacyResult;
}

/**
 * 従来の SWR ベース実装（Shell 外用）
 * @internal
 * @param enabled - データフェッチを有効にするかどうか（React Hooksルール準拠のため常に呼び出される）
 */
function useOrganizationLegacyInternal(enabled: boolean = true) {
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  // 認証されたユーザーがいる場合のみSWRを実行（拡張型を使用）
  // enabled=false の場合はデータフェッチをスキップ（ShellContext使用時）
  const { data, error, isLoading, mutate } = useSWR<ExtendedMeApiResponse>(
    enabled && isAuthenticated && user ? [CACHE_KEYS.organization, user.id] : null,
    () => fetcher(CACHE_KEYS.organization),
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
      refreshInterval: 0,
      errorRetryCount: 2,
      errorRetryInterval: 3000,
      onError: (error) => {
        // 認証関連のエラーはリトライしない（想定内）
        if (error?.status === 404 || error?.status === 401) {
          return null;
        }
        
        // RLS 権限エラー（42501）も想定内として扱う
        if (error?.status === 403) {
          logger.warn('useOrganization: insufficient privileges:', { 
            status: error?.status,
            userId: user?.id 
          });
          return null;
        }
        
        // その他のエラーはログに記録
        logger.error('useOrganization SWR error:', { 
          error: error?.message || 'Unknown error',
          status: error?.status,
          userId: user?.id 
        });
      },
      fallbackData: null,
      shouldRetryOnError: (error) => {
        // 認証エラーや権限エラーの場合はリトライしない
        return error?.status !== 401 && error?.status !== 404 && error?.status !== 403;
      }
    }
  );

  const { invalidateOrganizationData } = useCacheManager();

  // エラー状態の判定（優先度: errorType → 文字列フォールバック）
  const hasPermissionError = data?.errorType !== undefined
    ? data.errorType === 'permission_denied'
    : (data?.error?.includes('アクセス権') || error?.status === 403);
  
  const hasSystemError = data?.errorType !== undefined
    ? data.errorType === 'system_error'
    : (data?.error?.includes('組織詳細の取得に失敗しました') || data?.error?.includes('メンバーシップは確認済みです'));

  // データ取得状態の判定
  const isDataFetched = !isLoading && !authLoading && data !== undefined;
  const hasOrganizations = data?.organizations && data.organizations.length > 0;
  const isReallyEmpty = isDataFetched && !hasOrganizations && !hasPermissionError && !hasSystemError;


  /**
   * 組織関連キャッシュを一括無効化
   * 組織情報変更時やコンテンツ更新時に使用
   */
  const invalidateOrganization = useCallback(async () => {
    const orgId = data?.organization?.id;
    
    try {
      // 組織関連データを一括無効化（アナリティクス含む）
      await invalidateOrganizationData(orgId);
      
      // 自身のキャッシュも再検証
      await mutate();
      
      logger.info('Organization cache invalidated', { orgId });
    } catch (error) {
      logger.error('Failed to invalidate organization cache', { 
        error: error instanceof Error ? error.message : error,
        orgId 
      });
    }
  }, [data?.organization?.id, invalidateOrganizationData, mutate]);

  return {
    user: data?.user || null,
    organization: data?.selectedOrganization || data?.organization || null, // selectedOrganizationを優先
    organizations: data?.organizations || [],        // 新形式
    selectedOrganization: data?.selectedOrganization || null, // 新形式
    isLoading: authLoading || isLoading,
    // エラーハンドリング強化：API内でのエラーメッセージも含める
    error: data?.error || (error?.status === 404 || error?.status === 401 || error?.status === 403 ? null : error),
    // 構造化エラー対応版：errorType 優先、文字列フォールバック付き
    hasPermissionError,
    hasSystemError,
    // デバッグ用：未取得と0件の区別（エラー状態を除外）
    isDataFetched,
    isReallyEmpty,
    invalidateOrganization,
    refresh: mutate,
  };
}

/**
 * 現在のユーザー情報のみ取得（後方互換性のため）
 * @deprecated useOrganization() を使用してください
 */
export function useUser() {
  const { user, isLoading, error } = useOrganization();
  return { data: user, isLoading, error };
}