/**
 * SWRキャッシュ管理フック
 * 組織関連データの一括キャッシュ無効化機能を提供
 */

import { useCallback } from 'react';
import { useSWRConfig } from 'swr';
import { CACHE_KEYS, getContentKey, getOrganizationRelatedKeys } from '@/lib/cache/keys';
import { logger } from '@/lib/utils/logger';

export function useCacheManager() {
  const { mutate } = useSWRConfig();

  /**
   * 組織関連データのキャッシュを一括無効化
   * @param orgId 組織ID（指定時はアナリティクス関連も無効化）
   */
  const invalidateOrganizationData = useCallback(async (orgId?: string) => {
    const keys = getOrganizationRelatedKeys(orgId);
    const tasks = keys.map(key => mutate(key));
    
    try {
      await Promise.all(tasks);
      logger.info(`Invalidated ${keys.length} organization-related caches`, { orgId });
    } catch (error) {
      logger.error('Failed to invalidate organization caches:', { data: error instanceof Error ? error : new Error(String(error)) });
    }
  }, [mutate]);

  /**
   * 特定コンテンツタイプのキャッシュ無効化
   * @param contentType コンテンツタイプ
   */
  const invalidateContent = useCallback(async (
    contentType: 'posts' | 'services' | 'faqs' | 'case-studies'
  ) => {
    const cacheKey = getContentKey(contentType);
    
    try {
      await mutate(cacheKey);
      
      // 関連パターンも無効化（例: /api/my/posts?page=1 など）
      await mutate((key) => 
        typeof key === 'string' && key.startsWith(`/api/my/${contentType}`)
      );
      
      logger.info(`Invalidated ${contentType} cache`);
    } catch (error) {
      logger.error(`Failed to invalidate ${contentType} cache:`, { data: error instanceof Error ? error : new Error(String(error)) });
    }
  }, [mutate]);

  /**
   * 特定の組織IDに関連するアナリティクスキャッシュのみ無効化
   * @param orgId 組織ID
   * @param analyticsTypes 無効化する分析タイプ（未指定時は全て）
   */
  const invalidateAnalytics = useCallback(async (
    orgId: string,
    analyticsTypes?: Array<'summary' | 'visibility' | 'gsc' | 'combined' | 'bot-logs'>
  ) => {
    const allTypes = ['summary', 'visibility', 'gsc', 'combined', 'bot-logs'] as const;
    const typesToInvalidate = analyticsTypes || allTypes;
    
    const tasks = typesToInvalidate.map(type => {
      switch (type) {
        case 'summary':
          return mutate(CACHE_KEYS.analyticsSummary(orgId));
        case 'visibility':
          return mutate(CACHE_KEYS.analyticsVisibility(orgId));
        case 'gsc':
          return mutate(CACHE_KEYS.analyticsGsc(orgId));
        case 'combined':
          return mutate(CACHE_KEYS.analyticsCombined(orgId));
        case 'bot-logs':
          return mutate(CACHE_KEYS.analyticsBotLogs(orgId));
        default:
          return Promise.resolve();
      }
    });
    
    try {
      await Promise.all(tasks);
      logger.info(`Invalidated analytics caches for org ${orgId}`, { typesToInvalidate });
    } catch (error) {
      logger.error('Failed to invalidate analytics caches:', { data: error instanceof Error ? error : new Error(String(error)) });
    }
  }, [mutate]);

  /**
   * キャッシュ無効化のユーティリティ
   * パターンマッチでまとめて無効化
   * @param pattern キャッシュキーのパターン（正規表現文字列または関数）
   */
  const invalidateByPattern = useCallback(async (
    pattern: string | ((key: any) => boolean)
  ) => {
    try {
      if (typeof pattern === 'string') {
        const regex = new RegExp(pattern);
        await mutate((key) => typeof key === 'string' && regex.test(key));
      } else {
        await mutate(pattern);
      }
      logger.info('Invalidated caches by pattern');
    } catch (error) {
      logger.error('Failed to invalidate caches by pattern:', { data: error instanceof Error ? error : new Error(String(error)) });
    }
  }, [mutate]);

  return {
    invalidateOrganizationData,
    invalidateContent,
    invalidateAnalytics,
    invalidateByPattern,
  };
}

/**
 * コンポーネント外からでも使用可能なグローバルキャッシュ操作
 * 注意: mutateはSWRConfigプロバイダー内でのみ動作
 */
export interface GlobalCacheManager {
  invalidateOrganizationData: (orgId?: string) => Promise<void>;
  invalidateContent: (contentType: 'posts' | 'services' | 'faqs' | 'case-studies') => Promise<void>;
}

// グローバルインスタンスは必要に応じて実装
// export const globalCacheManager: GlobalCacheManager = ...