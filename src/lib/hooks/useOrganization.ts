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
   * 組織データが見つからない場合の自動リトライ機能
   * ユーザーが存在するが組織が null の場合にセッションをリフレッシュ
   */
  useEffect(() => {
    const hasUser = data?.user && !isLoading;
    const hasNoOrganization = !data?.organization && !isLoading;
    const noError = !error;
    
    if (hasUser && hasNoOrganization && noError) {
      logger.debug('User found but no organization - attempting session refresh');
      
      // 1秒後にセッションリフレッシュを実行（UIの準備を待つ）
      const timeoutId = setTimeout(() => {
        forceRefreshWithSession();
      }, 1000);
      
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

  return {
    user: data?.user || null,
    organization: data?.organization || null,
    isLoading,
    error: error?.status === 404 || error?.status === 401 ? null : error,
    invalidateOrganization, // 🆕 新機能
    forceRefreshWithSession, // 🆕 強制セッションリフレッシュ
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