'use client';

/**
 * 企業情報管理ページ（プレースホルダー実装）
 * 
 * 現在: 基本的な組織情報表示のみ
 * 将来: 正規の企業情報管理ページが決まったら、ここはredirect()に変更する可能性あり
 */

import { useState, useEffect } from 'react';
import { useOrganization } from '@/lib/hooks/useOrganization';
import DashboardBackLink from '@/components/dashboard/DashboardBackLink';

export default function CompanyManagementPage() {
  const [error, setError] = useState<string | null>(null);
  
  const { organization, isLoading: orgLoading, error: orgError } = useOrganization();

  useEffect(() => {
    if (orgError) {
      setError('組織情報の取得に失敗しました');
    }
  }, [orgError]);

  if (orgLoading) {
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
            <h1 className="text-3xl font-bold text-gray-900">企業情報管理</h1>
            <p className="text-lg text-gray-600 mt-2">企業情報を編集・管理します</p>
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

      {/* 企業情報表示 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">企業情報</h2>
        </div>

        <div className="p-6">
          {organization ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">組織名</label>
                <p className="text-sm text-gray-900 mt-1">{organization.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">プラン</label>
                <p className="text-sm text-gray-900 mt-1">{organization.plan || 'trial'}</p>
              </div>
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
                <p className="text-sm text-blue-700">
                  企業情報の詳細編集機能は今後実装予定です。現在は基本情報のみ表示しています。
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h3 className="mt-4 text-sm font-medium text-gray-900">企業情報が見つかりません</h3>
              <p className="mt-2 text-sm text-gray-500">組織への参加が必要です。</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}