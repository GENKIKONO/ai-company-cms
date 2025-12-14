'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { SalesMaterial } from '@/types/domain/sales';
import DashboardBackLink from '@/components/dashboard/DashboardBackLink';
import { useOrganization } from '@/lib/hooks/useOrganization';
import { logger } from '@/lib/utils/logger';

export default function MaterialsManagementPage() {
  const [materials, setMaterials] = useState<SalesMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { organization, isLoading: orgLoading, error: orgError } = useOrganization();
  const organizationId = organization?.id || '';

  const fetchMaterials = useCallback(async () => {
    if (!organizationId || orgLoading) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/my/materials?organizationId=${organizationId}`, {
        cache: 'no-store'
      });
      
      if (!response.ok) {
        setError(`HTTP ${response.status}: ${response.statusText}`);
        return;
      }
      
      const result = await response.json().catch(() => ({}));
      setMaterials(result.data || []);
      setError(null);
    } catch (err) {
      logger.error('Failed to fetch materials:', { data: err });
      setError(err instanceof Error ? err.message : 'Failed to fetch materials');
    } finally {
      setLoading(false);
    }
  }, [organizationId, orgLoading]);

  useEffect(() => {
    if (organizationId && !orgLoading) {
      fetchMaterials();
    }
  }, [organizationId, orgLoading, fetchMaterials]);

  useEffect(() => {
    if (orgError) {
      setError('組織情報の取得に失敗しました');
    }
  }, [orgError]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('この営業資料を削除しますか？')) return;

    try {
      const response = await fetch(`/api/my/materials/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        alert('削除に失敗しました: HTTP ' + response.status + ': ' + response.statusText);
        return;
      }

      setMaterials(materials.filter(material => material.id !== id));
    } catch (err) {
      logger.error('Failed to delete material:', { data: err });
      alert('削除に失敗しました: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  }, [materials]);

  if (loading || orgLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ヘッダー */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">営業資料管理</h1>
            <p className="text-lg text-gray-600 mt-2">営業資料をアップロード・管理します</p>
          </div>
        </div>
      </div>

      {/* ナビゲーション */}
      <DashboardBackLink />

      {/* エラー表示 */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* 営業資料一覧 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">営業資料一覧 ({materials.length}件)</h2>
        </div>

        {materials.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-4 text-sm font-medium text-gray-900">営業資料がありません</h3>
            <p className="mt-2 text-sm text-gray-500">営業資料をアップロードして管理を始めましょう。</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {materials.map((material) => (
              <div key={material.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/dashboard/materials/${material.id}`}
                      className="text-lg font-medium text-gray-900 hover:text-blue-600 truncate block"
                    >
                      {material.title}
                    </Link>
                    <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                      {material.file_type && (
                        <span className="bg-slate-200 text-slate-800 px-2 py-1 text-xs rounded-full">
                          {material.file_type}
                        </span>
                      )}
                      {material.file_size && (
                        <span>サイズ: {(material.file_size / 1024 / 1024).toFixed(2)} MB</span>
                      )}
                      <span>アップロード: {new Date(material.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Link
                      href={`/dashboard/materials/${material.id}`}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      表示
                    </Link>
                    <button
                      onClick={() => handleDelete(material.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                    >
                      削除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}