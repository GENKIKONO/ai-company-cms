/**
 * 組織コンテキストフック
 * 現在のユーザーの組織情報を管理
 * 
 * Version 3: RLS強化対応版
 * - MeApiResponse 型使用（organization-summary.ts ベース）
 * - エラーハンドリング強化（42501対応）
 * - 後方互換性維持
 */

import useSWR from 'swr';
import { useCallback } from 'react';
import { fetcher } from '@/lib/utils/fetcher';
import { useCacheManager } from './useCacheManager';
import { CACHE_KEYS } from '@/lib/cache/keys';
import { logger } from '@/lib/log';
import { useAuth } from './useAuth';
import { MeApiResponse, OrganizationSummary } from '@/types/organization-summary';

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
 */
export function useOrganization() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  // 認証されたユーザーがいる場合のみSWRを実行
  const { data, error, isLoading, mutate } = useSWR<MeApiResponse>(
    isAuthenticated && user ? [CACHE_KEYS.organization, user.id] : null,
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

  // データ取得状態の判定
  const isDataFetched = !isLoading && !authLoading && data !== undefined;
  const hasOrganizations = data?.organizations && data.organizations.length > 0;
  const isReallyEmpty = isDataFetched && !hasOrganizations;


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
    // RLS権限エラーの場合の専用フラグ
    hasPermissionError: data?.error?.includes('アクセス権') || error?.status === 403,
    // デバッグ用：未取得と0件の区別
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