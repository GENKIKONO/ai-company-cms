'use client';

/**
 * useDashboardMutation - Dashboard統一データ変更フック
 *
 * @description
 * - DATA_SOURCESの設定に基づいてCRUD操作を提供
 * - 権限チェックを自動実行
 * - 楽観的更新対応（オプション）
 * - エラーハンドリング統一
 */

import { useState, useCallback, useMemo } from 'react';
import { insertInto, updateRecord, deleteRecord } from '@/lib/supabase';
import { getDataSource, hasDataSourcePermission, type DataSourceKey, type TableName } from '@/config/data-sources';
import type { UserRole } from '@/types/utils/database';
import type { TableInsert, TableUpdate, SupabaseDatabase } from '@/types/database.types';

type WritableTableName = keyof SupabaseDatabase['public']['Tables'];

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Normalize user role for permission checks
 * Maps 'owner' to 'admin' to match DATA_SOURCES.permissions config
 */
function normalizeRole(role: UserRole | string): UserRole {
  if (role === 'owner') return 'admin';
  if (role === 'admin' || role === 'editor' || role === 'viewer') return role;
  return 'viewer'; // Default fallback
}

// =====================================================
// TYPES
// =====================================================

export interface UseDashboardMutationOptions {
  /** 組織ID（org-scopedデータソースで必須） */
  organizationId?: string;
  /** ユーザーロール（権限チェック用） */
  userRole?: UserRole;
  /** 成功時コールバック */
  onSuccess?: (action: 'create' | 'update' | 'delete', data?: unknown) => void;
  /** エラー時コールバック */
  onError?: (action: 'create' | 'update' | 'delete', error: Error) => void;
}

export interface MutationState {
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;
  lastAction: 'create' | 'update' | 'delete' | null;
}

export interface MutationActions<TInsert, TUpdate> {
  /** レコード作成 */
  create: (data: TInsert) => Promise<{ success: boolean; data?: unknown; error?: string }>;
  /** レコード更新 */
  update: (id: string, data: TUpdate) => Promise<{ success: boolean; data?: unknown; error?: string }>;
  /** レコード削除 */
  remove: (id: string) => Promise<{ success: boolean; error?: string }>;
  /** エラーをクリア */
  clearError: () => void;
}

export interface UseDashboardMutationResult<TInsert, TUpdate>
  extends MutationState,
    MutationActions<TInsert, TUpdate> {
  /** いずれかの操作中か */
  isLoading: boolean;
  /** 書き込み権限があるか */
  canWrite: boolean;
  /** 削除権限があるか */
  canDelete: boolean;
}

// =====================================================
// HOOK IMPLEMENTATION
// =====================================================

export function useDashboardMutation<
  TInsert = Record<string, unknown>,
  TUpdate = Record<string, unknown>
>(
  dataSourceKey: DataSourceKey | string,
  options: UseDashboardMutationOptions = {}
): UseDashboardMutationResult<TInsert, TUpdate> {
  const { organizationId, userRole = 'viewer', onSuccess, onError } = options;

  // State
  const [state, setState] = useState<MutationState>({
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
    error: null,
    lastAction: null,
  });

  // Get data source config
  const config = useMemo(() => getDataSource(dataSourceKey), [dataSourceKey]);

  // Normalize role (handle 'owner' → 'admin')
  const normalizedRole = useMemo(() => normalizeRole(userRole), [userRole]);

  // Permission checks
  const canWrite = useMemo(() => {
    if (!config) return false;
    return hasDataSourcePermission(dataSourceKey, 'write', normalizedRole);
  }, [config, dataSourceKey, normalizedRole]);

  const canDelete = useMemo(() => {
    if (!config) return false;
    return hasDataSourcePermission(dataSourceKey, 'delete', normalizedRole);
  }, [config, dataSourceKey, normalizedRole]);

  // Create action
  const create = useCallback(
    async (data: TInsert): Promise<{ success: boolean; data?: unknown; error?: string }> => {
      if (!config) {
        return { success: false, error: `データソース "${dataSourceKey}" が見つかりません` };
      }

      if (!canWrite) {
        return { success: false, error: '作成権限がありません' };
      }

      if (config.requiresOrgScope && !organizationId) {
        return { success: false, error: '組織IDが指定されていません' };
      }

      setState((prev) => ({ ...prev, isCreating: true, error: null, lastAction: 'create' }));

      try {
        // Add organization_id if required
        const insertData = config.requiresOrgScope
          ? { ...data, organization_id: organizationId }
          : data;

        // Use writeTable if defined, otherwise fall back to table (for non-view sources)
        const targetTable = (config.writeTable || config.table) as WritableTableName;
        const { data: result, error: insertError } = await insertInto(
          targetTable,
          insertData as TableInsert<typeof targetTable>
        );

        if (insertError) {
          throw new Error(insertError.message || '作成に失敗しました');
        }

        onSuccess?.('create', result);
        setState((prev) => ({ ...prev, isCreating: false }));
        return { success: true, data: result };
      } catch (err) {
        const error = err instanceof Error ? err : new Error('作成に失敗しました');
        setState((prev) => ({ ...prev, isCreating: false, error: error.message }));
        onError?.('create', error);
        return { success: false, error: error.message };
      }
    },
    [config, canWrite, organizationId, dataSourceKey, onSuccess, onError]
  );

  // Update action
  const update = useCallback(
    async (
      id: string,
      data: TUpdate
    ): Promise<{ success: boolean; data?: unknown; error?: string }> => {
      if (!config) {
        return { success: false, error: `データソース "${dataSourceKey}" が見つかりません` };
      }

      if (!canWrite) {
        return { success: false, error: '更新権限がありません' };
      }

      setState((prev) => ({ ...prev, isUpdating: true, error: null, lastAction: 'update' }));

      try {
        // Use writeTable if defined, otherwise fall back to table (for non-view sources)
        const targetTable = (config.writeTable || config.table) as WritableTableName;
        const { data: result, error: updateError } = await updateRecord(
          targetTable,
          id,
          data as TableUpdate<typeof targetTable>
        );

        if (updateError) {
          throw new Error(updateError.message || '更新に失敗しました');
        }

        onSuccess?.('update', result);
        setState((prev) => ({ ...prev, isUpdating: false }));
        return { success: true, data: result };
      } catch (err) {
        const error = err instanceof Error ? err : new Error('更新に失敗しました');
        setState((prev) => ({ ...prev, isUpdating: false, error: error.message }));
        onError?.('update', error);
        return { success: false, error: error.message };
      }
    },
    [config, canWrite, dataSourceKey, onSuccess, onError]
  );

  // Delete action
  const remove = useCallback(
    async (id: string): Promise<{ success: boolean; error?: string }> => {
      if (!config) {
        return { success: false, error: `データソース "${dataSourceKey}" が見つかりません` };
      }

      if (!canDelete) {
        return { success: false, error: '削除権限がありません' };
      }

      setState((prev) => ({ ...prev, isDeleting: true, error: null, lastAction: 'delete' }));

      try {
        // Use writeTable if defined, otherwise fall back to table (for non-view sources)
        const targetTable = (config.writeTable || config.table) as WritableTableName;
        const { error: deleteError } = await deleteRecord(targetTable, id);

        if (deleteError) {
          throw new Error(deleteError.message || '削除に失敗しました');
        }

        onSuccess?.('delete');
        setState((prev) => ({ ...prev, isDeleting: false }));
        return { success: true };
      } catch (err) {
        const error = err instanceof Error ? err : new Error('削除に失敗しました');
        setState((prev) => ({ ...prev, isDeleting: false, error: error.message }));
        onError?.('delete', error);
        return { success: false, error: error.message };
      }
    },
    [config, canDelete, dataSourceKey, onSuccess, onError]
  );

  // Clear error
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    isLoading: state.isCreating || state.isUpdating || state.isDeleting,
    canWrite,
    canDelete,
    create,
    update,
    remove,
    clearError,
  };
}

// =====================================================
// COMBINED HOOK
// =====================================================

// Note: useDashboardResource is defined in a separate file (useDashboardResource.ts)
// to avoid circular dependency issues with useDashboardData.
// Import it from '@/hooks/dashboard' or '@/hooks/useDashboardResource'
