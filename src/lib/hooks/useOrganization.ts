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
}

export interface MeResponse {
  user: User | null;
  organization: Organization | null;
}

/**
 * 現在のユーザーと組織情報を同時に取得
 */
export function useOrganization() {
  const { data, error, isLoading, mutate } = useSWR<MeResponse>(CACHE_KEYS.organization, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5 * 60 * 1000, // 5分間キャッシュ
    onError: (error) => {
      // 404の場合はエラーとして扱わない（認証されていない状態）
      if (error?.status === 404 || error?.status === 401) {
        return null;
      }
      logger.error('useOrganization error:', { data: error });
    }
  });

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
    isLoading,
    error: error?.status === 404 || error?.status === 401 ? null : error,
    invalidateOrganization, // 🆕 新機能
    refresh: mutate, // 手動でのデータ再取得
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