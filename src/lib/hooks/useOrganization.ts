/**
 * 組織コンテキストフック
 * 現在のユーザーの組織情報を管理
 */

import useSWR from 'swr';
import { useCallback } from 'react';
import { fetcher } from '@/lib/utils/fetcher';
import { useCacheManager } from './useCacheManager';
import { CACHE_KEYS } from '@/lib/cache/keys';
import { logger } from '@/lib/log';
import { useAuth } from './useAuth';
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

export interface MeResponse {
  user: User | null;
  organization: Organization | null;
}

/**
 * 現在のユーザーと組織情報を同時に取得
 */
export function useOrganization() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  // 認証されたユーザーがいる場合のみSWRを実行
  const { data, error, isLoading, mutate } = useSWR<MeResponse>(
    isAuthenticated && user ? [CACHE_KEYS.organization, user.id] : null,
    () => fetcher(CACHE_KEYS.organization),
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
      refreshInterval: 0,
      errorRetryCount: 1,
      errorRetryInterval: 2000,
      onError: (error) => {
        if (error?.status === 404 || error?.status === 401) {
          return null;
        }
        logger.error('useOrganization error:', { data: error });
      }
    }
  );

  const { invalidateOrganizationData } = useCacheManager();


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
    organization: data?.organization || null,
    isLoading: authLoading || isLoading,
    error: error?.status === 404 || error?.status === 401 ? null : error,
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