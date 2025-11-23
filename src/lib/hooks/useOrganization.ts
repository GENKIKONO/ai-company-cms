/**
 * 組織コンテキストフック
 * 現在のユーザーの組織情報を管理
 */

import useSWR from 'swr';
import { useCallback, useEffect } from 'react';
import { fetcher } from '@/lib/utils/fetcher';
import { useCacheManager } from './useCacheManager';
import { CACHE_KEYS } from '@/lib/cache/keys';
import { logger } from '@/lib/log';
import { supabaseBrowser } from '@/lib/supabase-client';
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
  const { data, error, isLoading, mutate } = useSWR<MeResponse>(CACHE_KEYS.organization, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000, // 5秒間キャッシュ
    refreshInterval: 0, // 自動リフレッシュ無効
    errorRetryCount: 1, // エラー時1回のみリトライ
    errorRetryInterval: 2000, // リトライ間隔2秒
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
   * セッションを強制リフレッシュして組織データを再取得
   * ログイン後に組織が見つからない場合のフォールバック
   */
  const forceRefreshWithSession = useCallback(async () => {
    try {
      logger.info('Forcing session refresh to resolve organization data');
      
      // Supabaseセッションを強制リフレッシュ
      const supabase = supabaseBrowser;
      const { data: sessionData, error: sessionError } = await supabase.auth.refreshSession();
      
      if (sessionError) {
        logger.warn('Session refresh failed:', { error: sessionError.message });
      } else {
        logger.info('Session refreshed successfully');
      }
      
      // キャッシュをクリアして再取得
      await mutate();
      
      logger.info('Organization data force refresh completed');
    } catch (error) {
      logger.error('Failed to force refresh session:', { 
        error: error instanceof Error ? error.message : error 
      });
    }
  }, [mutate]);

  /**
   * 組織データが見つからない場合のシンプルなリトライ機能
   * ユーザーが存在するが組織が null の場合に1回だけセッションをリフレッシュ
   */
  useEffect(() => {
    const hasUser = data?.user && !isLoading;
    const hasNoOrganization = !data?.organization && !isLoading;
    const noError = !error;
    
    if (hasUser && hasNoOrganization && noError) {
      logger.debug('User found but no organization - attempting single session refresh');
      
      const timeoutId = setTimeout(async () => {
        try {
          await forceRefreshWithSession();
        } catch (error) {
          logger.error('Single retry failed:', { error });
        }
      }, 2000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [data?.user, data?.organization, isLoading, error, forceRefreshWithSession]);

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

  // データが不完全な場合の判定をシンプル化
  const hasUser = !!data?.user;
  const hasOrganization = !!data?.organization;
  const isWaitingForOrganization = hasUser && !hasOrganization && !isLoading && !error;

  return {
    user: data?.user || null,
    organization: data?.organization || null,
    isLoading: isLoading || isWaitingForOrganization, // 組織待機中は常にローディング
    isWaitingForOrganization, // 明示的な待機状態
    error: error?.status === 404 || error?.status === 401 ? null : error,
    invalidateOrganization,
    forceRefreshWithSession,
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