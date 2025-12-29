'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { DashboardPageShell } from '@/components/dashboard';

interface AiUsageData {
  organization_id: string;
  interview_count: number;
  message_count: number;
  token_count: number;
  updated_at: string;
  organizations?: {
    name: string;
    slug: string;
  };
}

export default function AiUsagePage() {
  return (
    <DashboardPageShell title="AI使用量" requiredRole="admin">
      <AiUsageContent />
    </DashboardPageShell>
  );
}

function AiUsageContent() {
  const [usageData, setUsageData] = useState<AiUsageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsageData() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('organization_ai_usage')
          .select(`
            *,
            organizations(name, slug)
          `)
          .order('updated_at', { ascending: false });

        if (error) throw error;
        setUsageData(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'データ取得エラー');
      } finally {
        setLoading(false);
      }
    }
    fetchUsageData();
  }, []);

  return (
    <div className="py-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            <li>
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                ダッシュボード
              </Link>
            </li>
            <li><span className="text-gray-500">/</span></li>
            <li>
              <Link href="/dashboard/admin" className="text-gray-500 hover:text-gray-700">
                管理
              </Link>
            </li>
            <li><span className="text-gray-500">/</span></li>
            <li className="text-gray-900 font-medium">AI使用量</li>
          </ol>
        </nav>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">AI使用量ダッシュボード</h1>
            <p className="text-sm text-gray-500 mt-1">組織ごとのAI機能使用状況を確認</p>
          </div>

          <div className="p-6" data-testid="ai-usage-list">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-[var(--aio-primary)] border-t-transparent rounded-full mx-auto"></div>
                <p className="text-gray-500 mt-4">読み込み中...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-700">{error}</p>
              </div>
            ) : usageData.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">使用データがありません</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">組織</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">インタビュー数</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">メッセージ数</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">トークン数</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">最終更新</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {usageData.map((item) => (
                      <tr key={item.organization_id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {item.organizations?.name || '不明'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {item.organizations?.slug || item.organization_id}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.interview_count?.toLocaleString() || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.message_count?.toLocaleString() || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.token_count?.toLocaleString() || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.updated_at ? new Date(item.updated_at).toLocaleString('ja-JP') : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
