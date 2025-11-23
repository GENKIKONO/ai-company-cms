'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Service } from '@/types/database';
import PublicPageLinks from '../components/PublicPageLinks';
import DashboardBackLink from '@/components/dashboard/DashboardBackLink';
import { supabaseBrowser } from '@/lib/supabase-client';
import { logger } from '@/lib/utils/logger';

export default function ServicesManagementPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState<string>('');

  useEffect(() => {
    const getOrganizationId = async () => {
      try {
        const supabase = supabaseBrowser;
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data: userOrg } = await supabase
            .from('user_organizations')
            .select('organization_id')
            .eq('user_id', user.id)
            .eq('role', 'owner')
            .single();
          
          if (userOrg) {
            setOrganizationId(userOrg.organization_id);
          }
        }
      } catch (error) {
        logger.error('Failed to get organization ID:', { data: error });
        setError('組織情報の取得に失敗しました');
      }
    };

    getOrganizationId();
  }, []);

  useEffect(() => {
    if (organizationId) {
      fetchServices();
    }
  }, [organizationId]);

  const fetchServices = async () => {
    if (!organizationId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/my/services?organizationId=${organizationId}`, {
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      setServices(result.data || []);
      setError(null);
    } catch (err) {
      logger.error('Failed to fetch services:', { data: err });
      setError(err instanceof Error ? err.message : 'Failed to fetch services');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('このサービスを削除しますか？')) return;

    try {
      const response = await fetch(`/api/my/services/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      setServices(services.filter(service => service.id !== id));
    } catch (err) {
      logger.error('Failed to delete service:', { data: err });
      alert('削除に失敗しました: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  if (loading) {
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
            <h1 className="text-3xl font-bold text-gray-900">サービス管理</h1>
            <p className="text-lg text-gray-600 mt-2">提供サービスを管理します</p>
          </div>
          <div className="flex items-center space-x-3">
            <PublicPageLinks contentType="services" />
            <Link
              href="/dashboard/services/new"
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md inline-flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              新しいサービス
            </Link>
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

        {/* サービス一覧 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">サービス一覧 ({services.length}件)</h2>
          </div>

          {services.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-4 text-sm font-medium text-gray-900">サービスがありません</h3>
              <p className="mt-2 text-sm text-gray-500">最初のサービスを作成してみましょう。</p>
              <div className="mt-6">
                <Link
                  href="/dashboard/services/new"
                  className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md inline-flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  サービスを作成
                </Link>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {services.map((service) => (
                <div key={service.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {service.name}
                      </h3>
                      {service.description && (
                        <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                          {service.description}
                        </p>
                      )}
                      <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                        {service.category && (
                          <span className="bg-slate-200 text-slate-800 px-2 py-1 text-xs rounded-full">
                            {service.category}
                          </span>
                        )}
                        {service.price && (
                          <span>価格: ¥{service.price.toLocaleString()}</span>
                        )}
                        {service.duration_months && (
                          <span>期間: {service.duration_months}ヶ月</span>
                        )}
                      </div>
                      <div className="mt-2 text-sm text-gray-500">
                        <span>作成: {new Date(service.created_at).toLocaleDateString()}</span>
                        {service.updated_at !== service.created_at && (
                          <span className="ml-4">更新: {new Date(service.updated_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Link
                        href={`/dashboard/services/${service.id}/edit`}
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                      >
                        編集
                      </Link>
                      <button
                        onClick={() => handleDelete(service.id)}
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