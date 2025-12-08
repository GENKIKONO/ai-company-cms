'use client';

// TODO: [SUPABASE_CMS_MIGRATION] 新しい型をインポートして段階的に移行
// import type { CmsSiteSettingsRow, CmsSectionRow, CmsAssetRow } from '@/types/cms-supabase';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useOrgRealtimeCms, useCMSSectionByKey, useCMSSettingByKey } from '@/hooks/useOrgRealtimeCms';
import { useAdminApiClient, type AdminApiResponse } from '@/lib/admin-api-client';

interface CMSDataState {
  sections: Record<string, any>[];
  settings: Record<string, any>[];
  assets: Record<string, any>[];
  isLoading: boolean;
  isConnected: boolean;
  error: string | null;
  lastUpdate: string;
}

interface CmsOperations {
  // Site Settings
  createSiteSetting: (setting: {
    key: string;
    value: string;
    data_type: string;
    description?: string;
    is_public: boolean;
  }) => Promise<AdminApiResponse>;
  updateSiteSetting: (setting: any) => Promise<AdminApiResponse>;
  deleteSiteSetting: (key: string) => Promise<AdminApiResponse>;
  
  // CMS Sections  
  createCmsSection: (section: {
    page_key: string;
    section_key: string;
    section_type: string;
    title?: string;
    content: Record<string, any>;
    display_order: number;
    is_active: boolean;
  }) => Promise<AdminApiResponse>;
  updateCmsSection: (section: any) => Promise<AdminApiResponse>;
  deleteCmsSection: (pageKey: string, sectionKey: string) => Promise<AdminApiResponse>;
  
  // CMS Assets
  createCmsAsset: (asset: {
    filename: string;
    original_name: string;
    file_path: string;
    file_size?: number;
    mime_type?: string;
    alt_text?: string;
    description?: string;
    tags: string[];
    is_active: boolean;
  }) => Promise<AdminApiResponse>;
  updateCmsAsset: (asset: any) => Promise<AdminApiResponse>;
  deleteCmsAsset: (assetId: string) => Promise<AdminApiResponse>;
  
  // Utility
  refresh: () => Promise<void>;
  healthCheck: () => Promise<AdminApiResponse>;
}

/**
 * 統合CMS データフック
 * 
 * Realtime + Admin API + 既存APIパターンを統合
 * SSR初期ロード → Realtime購読 → Admin API操作の流れを管理
 */
export function useCmsData(organizationId: string): CMSDataState & CmsOperations {
  const adminApi = useAdminApiClient();
  
  const [operationState, setOperationState] = useState({
    isLoading: false,
    error: null as string | null
  });

  // Realtime接続
  const realtime = useOrgRealtimeCms({
    organizationId,
    autoConnect: true,
    onUpdate: (data) => {
      // [CMS Hook] Realtime update: data
    },
    onError: (error) => {
      // [CMS Hook] Realtime error: error
      setOperationState(prev => ({ ...prev, error: error.message }));
    }
  });

  // 統合状態
  const state = useMemo((): CMSDataState => ({
    sections: realtime.sections,
    settings: realtime.settings,
    assets: realtime.assets,
    isLoading: realtime.isLoading || operationState.isLoading,
    isConnected: realtime.isConnected,
    error: realtime.error || operationState.error,
    lastUpdate: realtime.lastUpdate
  }), [realtime, operationState]);

  // 操作ヘルパー
  const executeOperation = useCallback(async <T>(
    operation: () => Promise<AdminApiResponse<T>>,
    operationName: string
  ): Promise<AdminApiResponse<T>> => {
    setOperationState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = await operation();
      
      if (!result.success) {
        setOperationState(prev => ({ 
          ...prev, 
          error: result.error || `${operationName}に失敗しました`
        }));
      }
      
      return result;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `${operationName}でエラーが発生しました`;
      setOperationState(prev => ({ ...prev, error: errorMessage }));
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setOperationState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Site Settings操作
  const createSiteSetting = useCallback(async (setting: {
    key: string;
    value: string;
    data_type: string;
    description?: string;
    is_public: boolean;
  }) => {
    return executeOperation(
      () => adminApi.upsertSiteSetting(organizationId, setting),
      'サイト設定の作成'
    );
  }, [adminApi, organizationId, executeOperation]);

  const updateSiteSetting = useCallback(async (setting: any) => {
    return executeOperation(
      () => adminApi.upsertSiteSetting(organizationId, setting),
      'サイト設定の更新'
    );
  }, [adminApi, organizationId, executeOperation]);

  const deleteSiteSetting = useCallback(async (key: string) => {
    return executeOperation(
      () => adminApi.deleteSiteSetting(organizationId, key),
      'サイト設定の削除'
    );
  }, [adminApi, organizationId, executeOperation]);

  // CMS Sections操作
  const createCmsSection = useCallback(async (section: {
    page_key: string;
    section_key: string;
    section_type: string;
    title?: string;
    content: Record<string, any>;
    display_order: number;
    is_active: boolean;
  }) => {
    return executeOperation(
      () => adminApi.upsertCmsSection(organizationId, section),
      'CMSセクションの作成'
    );
  }, [adminApi, organizationId, executeOperation]);

  const updateCmsSection = useCallback(async (section: any) => {
    return executeOperation(
      () => adminApi.upsertCmsSection(organizationId, section),
      'CMSセクションの更新'
    );
  }, [adminApi, organizationId, executeOperation]);

  const deleteCmsSection = useCallback(async (pageKey: string, sectionKey: string) => {
    return executeOperation(
      () => adminApi.deleteCmsSection(organizationId, pageKey, sectionKey),
      'CMSセクションの削除'
    );
  }, [adminApi, organizationId, executeOperation]);

  // CMS Assets操作
  const createCmsAsset = useCallback(async (asset: {
    filename: string;
    original_name: string;
    file_path: string;
    file_size?: number;
    mime_type?: string;
    alt_text?: string;
    description?: string;
    tags: string[];
    is_active: boolean;
  }) => {
    return executeOperation(
      () => adminApi.upsertCmsAsset(organizationId, asset),
      'CMSアセットの作成'
    );
  }, [adminApi, organizationId, executeOperation]);

  const updateCmsAsset = useCallback(async (asset: any) => {
    return executeOperation(
      () => adminApi.upsertCmsAsset(organizationId, asset),
      'CMSアセットの更新'
    );
  }, [adminApi, organizationId, executeOperation]);

  const deleteCmsAsset = useCallback(async (assetId: string) => {
    return executeOperation(
      () => adminApi.deleteCmsAsset(organizationId, assetId),
      'CMSアセットの削除'
    );
  }, [adminApi, organizationId, executeOperation]);

  // ユーティリティ操作
  const refresh = useCallback(async () => {
    await realtime.refresh();
  }, [realtime]);

  const healthCheck = useCallback(async () => {
    return executeOperation(
      () => adminApi.healthCheck(),
      'ヘルスチェック'
    );
  }, [adminApi, executeOperation]);

  // エラー自動クリア
  useEffect(() => {
    if (operationState.error) {
      const timer = setTimeout(() => {
        setOperationState(prev => ({ ...prev, error: null }));
      }, 10000); // 10秒後にエラークリア

      return () => clearTimeout(timer);
    }
  }, [operationState.error]);

  return {
    // 状態
    ...state,
    
    // Site Settings操作
    createSiteSetting,
    updateSiteSetting,
    deleteSiteSetting,
    
    // CMS Sections操作
    createCmsSection,
    updateCmsSection,
    deleteCmsSection,
    
    // CMS Assets操作
    createCmsAsset,
    updateCmsAsset,
    deleteCmsAsset,
    
    // ユーティリティ
    refresh,
    healthCheck
  };
}

/**
 * セクション検索フック
 */
export function useCmsSection(
  cmsData: CMSDataState,
  pageKey: string,
  sectionKey: string
) {
  return useCMSSectionByKey(cmsData.sections, pageKey, sectionKey);
}

/**
 * 設定値取得フック
 */
export function useCmsSetting(
  cmsData: CMSDataState,
  key: string
) {
  return useCMSSettingByKey(cmsData.settings, key);
}

/**
 * パフォーマンス最適化: ページ別セクション取得
 */
export function useCmsSectionsByPage(
  cmsData: CMSDataState,
  pageKey: string
) {
  return useMemo(() => 
    cmsData.sections
      .filter(section => section.page_key === pageKey)
      .sort((a, b) => a.display_order - b.display_order),
    [cmsData.sections, pageKey]
  );
}

// TypeScript型エクスポート
export type { CMSDataState, CmsOperations };