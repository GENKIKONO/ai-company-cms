/**
 * 組織コンテキストフック
 * 現在のユーザーの組織情報を管理
 */

import useSWR from 'swr';
import { fetcher } from '@/lib/utils/fetcher';

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
  const { data, error, isLoading } = useSWR<MeResponse>('/api/me', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5 * 60 * 1000, // 5分間キャッシュ
    onError: (error) => {
      // 404の場合はエラーとして扱わない（認証されていない状態）
      if (error?.status === 404 || error?.status === 401) {
        return null;
      }
      console.error('useOrganization error:', error);
    }
  });

  return {
    user: data?.user || null,
    organization: data?.organization || null,
    isLoading,
    error: error?.status === 404 || error?.status === 401 ? null : error
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