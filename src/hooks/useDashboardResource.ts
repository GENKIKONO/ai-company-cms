'use client';

/**
 * useDashboardResource - データ取得と変更を統合したフック
 *
 * @description
 * useDashboardDataとuseDashboardMutationを組み合わせて、
 * 一つのリソースに対するCRUD操作を提供する
 */

import { useDashboardData, type UseDashboardDataOptions } from './useDashboardData';
import { useDashboardMutation, type UseDashboardMutationOptions } from './useDashboardMutation';
import type { DataSourceKey } from '@/config/data-sources';

export interface UseDashboardResourceOptions
  extends Omit<UseDashboardDataOptions, 'transform'>,
    Omit<UseDashboardMutationOptions, 'organizationId' | 'userRole'> {}

/**
 * データ取得と変更を統合したフック
 */
export function useDashboardResource<
  T = Record<string, unknown>,
  TInsert = Record<string, unknown>,
  TUpdate = Record<string, unknown>
>(
  dataSourceKey: DataSourceKey | string,
  options: UseDashboardResourceOptions = {}
) {
  const {
    organizationId,
    userRole,
    filters,
    select,
    orderBy,
    limit,
    offset,
    searchQuery,
    realtime,
    skipInitialFetch,
    onSuccess,
    onError,
  } = options;

  const query = useDashboardData<T>(dataSourceKey, {
    organizationId,
    userRole,
    filters,
    select,
    orderBy,
    limit,
    offset,
    searchQuery,
    realtime,
    skipInitialFetch,
  });

  const mutation = useDashboardMutation<TInsert, TUpdate>(dataSourceKey, {
    organizationId,
    userRole,
    onSuccess: (action, data) => {
      // Refresh data after mutation
      query.refresh();
      onSuccess?.(action, data);
    },
    onError,
  });

  return {
    // Query state
    data: query.data,
    isLoading: query.isLoading,
    isEmpty: query.isEmpty,
    error: query.error || mutation.error,
    totalCount: query.totalCount,
    refresh: query.refresh,
    isPermissionError: query.isPermissionError,

    // Mutation state
    isCreating: mutation.isCreating,
    isUpdating: mutation.isUpdating,
    isDeleting: mutation.isDeleting,
    isMutating: mutation.isLoading,

    // Permissions
    canWrite: mutation.canWrite,
    canDelete: mutation.canDelete,

    // Actions
    create: mutation.create,
    update: mutation.update,
    remove: mutation.remove,
    clearError: mutation.clearError,
  };
}

export type UseDashboardResourceResult<T, TInsert, TUpdate> = ReturnType<
  typeof useDashboardResource<T, TInsert, TUpdate>
>;
