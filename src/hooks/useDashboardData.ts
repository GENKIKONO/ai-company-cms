'use client';

/**
 * useDashboardData - Dashboard統一データ取得フック
 *
 * @description
 * - DATA_SOURCESの設定に基づいてデータを取得
 * - ローディング・エラー状態を統一管理
 * - 組織スコープを自動適用
 * - リアルタイム更新対応（オプション）
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { selectFrom, countRecords, supabase } from '@/lib/supabase';
import { getDataSource, hasDataSourcePermission, type DataSourceKey } from '@/config/data-sources';
import type { UserRole } from '@/types/utils/database';
import type { DatabaseError } from '@/types/database.types';

// =====================================================
// TYPES
// =====================================================

export interface UseDashboardDataOptions<T = unknown> {
  /** 組織ID（org-scopedデータソースで必須） */
  organizationId?: string;
  /** ユーザーロール（権限チェック用） */
  userRole?: UserRole;
  /** 追加フィルター */
  filters?: Record<string, unknown>;
  /** カスタムカラム選択（デフォルト設定を上書き） */
  select?: string;
  /** ソート設定を上書き */
  orderBy?: { column: string; ascending?: boolean };
  /** 取得件数制限 */
  limit?: number;
  /** オフセット（ページネーション用） */
  offset?: number;
  /** 検索クエリ */
  searchQuery?: string;
  /** リアルタイム更新を有効化 */
  realtime?: boolean;
  /** 自動フェッチを無効化 */
  skipInitialFetch?: boolean;
  /** データ変換関数 */
  transform?: (data: unknown[]) => T[];
}

export interface UseDashboardDataResult<T> {
  /** 取得したデータ */
  data: T[];
  /** ローディング状態 */
  isLoading: boolean;
  /** エラー情報 */
  error: string | null;
  /** データが空か */
  isEmpty: boolean;
  /** 総件数 */
  totalCount: number;
  /** 手動リフレッシュ */
  refresh: () => Promise<void>;
  /** 権限エラーか */
  isPermissionError: boolean;
}

// =====================================================
// HOOK IMPLEMENTATION
// =====================================================

export function useDashboardData<T = Record<string, unknown>>(
  dataSourceKey: DataSourceKey | string,
  options: UseDashboardDataOptions<T> = {}
): UseDashboardDataResult<T> {
  const {
    organizationId,
    userRole = 'viewer',
    filters = {},
    select,
    orderBy,
    limit,
    offset,
    searchQuery,
    realtime = false,
    skipInitialFetch = false,
    transform,
  } = options;

  // State
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(!skipInitialFetch);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [isPermissionError, setIsPermissionError] = useState(false);

  // Get data source config
  const config = useMemo(() => getDataSource(dataSourceKey), [dataSourceKey]);

  // Permission check
  const hasPermission = useMemo(() => {
    if (!config) return false;
    return hasDataSourcePermission(dataSourceKey, 'read', userRole);
  }, [config, dataSourceKey, userRole]);

  // Build filters with org scope
  const effectiveFilters = useMemo(() => {
    const result: Record<string, unknown> = { ...filters };

    if (config?.requiresOrgScope && organizationId) {
      result.organization_id = organizationId;
    }

    return result;
  }, [config, organizationId, filters]);

  // Fetch function
  const fetchData = useCallback(async () => {
    if (!config) {
      setError(`データソース "${dataSourceKey}" が見つかりません`);
      setIsLoading(false);
      return;
    }

    if (!hasPermission) {
      setError('このデータへのアクセス権限がありません');
      setIsPermissionError(true);
      setIsLoading(false);
      return;
    }

    if (config.requiresOrgScope && !organizationId) {
      setError('組織IDが指定されていません');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsPermissionError(false);

    try {
      // Fetch data
      const { data: result, error: fetchError } = await selectFrom(
        config.table,
        {
          columns: select || config.defaultSelect,
          filters: effectiveFilters,
          orderBy: orderBy || config.defaultOrder,
          limit,
        }
      );

      if (fetchError) {
        throw new Error(fetchError.message || 'データの取得に失敗しました');
      }

      // Apply offset manually if needed (selectFrom doesn't support offset directly)
      let processedData = result || [];
      if (offset && offset > 0) {
        processedData = processedData.slice(offset);
      }

      // Apply transform if provided
      const finalData = transform
        ? transform(processedData)
        : (processedData as T[]);

      setData(finalData);

      // Get total count
      const { data: count } = await countRecords(config.table, effectiveFilters);
      setTotalCount(count || 0);

    } catch (err) {
      const message = err instanceof Error ? err.message : 'データの取得に失敗しました';
      setError(message);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [config, hasPermission, organizationId, effectiveFilters, select, orderBy, limit, offset, transform, dataSourceKey]);

  // Initial fetch
  useEffect(() => {
    if (!skipInitialFetch) {
      fetchData();
    }
  }, [fetchData, skipInitialFetch]);

  // Realtime subscription
  useEffect(() => {
    if (!realtime || !config || !organizationId) return;

    const channel = supabase
      .channel(`dashboard:${config.table}:${organizationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: config.table,
          filter: `organization_id=eq.${organizationId}`,
        },
        () => {
          // Refresh on any change
          fetchData();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [realtime, config, organizationId, fetchData]);

  return {
    data,
    isLoading,
    error,
    isEmpty: !isLoading && data.length === 0,
    totalCount,
    refresh: fetchData,
    isPermissionError,
  };
}

// =====================================================
// CONVENIENCE HOOKS
// =====================================================

/**
 * 単一レコード取得用フック
 */
export function useDashboardSingleRecord<T = Record<string, unknown>>(
  dataSourceKey: DataSourceKey | string,
  id: string | null,
  options: Omit<UseDashboardDataOptions<T>, 'limit'> = {}
) {
  const result = useDashboardData<T>(dataSourceKey, {
    ...options,
    filters: id ? { ...options.filters, id } : options.filters,
    limit: 1,
    skipInitialFetch: !id,
  });

  return {
    ...result,
    data: result.data[0] || null,
  };
}

/**
 * カウント取得用フック
 */
export function useDashboardCount(
  dataSourceKey: DataSourceKey | string,
  options: Pick<UseDashboardDataOptions, 'organizationId' | 'filters'> = {}
) {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { organizationId, filters = {} } = options;
  const config = getDataSource(dataSourceKey);

  const fetchCount = useCallback(async () => {
    if (!config) {
      setError(`データソース "${dataSourceKey}" が見つかりません`);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const effectiveFilters: Record<string, unknown> = { ...filters };
      if (config.requiresOrgScope && organizationId) {
        effectiveFilters.organization_id = organizationId;
      }

      const { data: result, error: fetchError } = await countRecords(
        config.table,
        effectiveFilters
      );

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setCount(result || 0);
    } catch (err) {
      const message = err instanceof Error ? err.message : '件数の取得に失敗しました';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [config, dataSourceKey, organizationId, filters]);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  return { count, isLoading, error, refresh: fetchCount };
}
