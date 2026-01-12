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
              <Link href="/dashboard" className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]">
                ダッシュボード
              </Link>
            </li>
            <li><span className="text-[var(--color-text-tertiary)]">/</span></li>
            <li>
              <Link href="/dashboard/manage" className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]">
                管理
              </Link>
            </li>
            <li><span className="text-[var(--color-text-tertiary)]">/</span></li>
            <li className="text-[var(--color-text-primary)] font-medium">AI使用量</li>
          </ol>
        </nav>

        <div className="bg-white rounded-lg shadow-sm border border-[var(--dashboard-card-border)]">
          <div className="px-6 py-4 border-b border-[var(--dashboard-card-border)]">
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">AI使用量ダッシュボード</h1>
            <p className="text-sm text-[var(--color-text-tertiary)] mt-1">組織ごとのAI機能使用状況を確認</p>
          </div>

          <div className="p-6" data-testid="ai-usage-list">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-[var(--aio-primary)] border-t-transparent rounded-full mx-auto"></div>
                <p className="text-[var(--color-text-tertiary)] mt-4">読み込み中...</p>
              </div>
            ) : error ? (
              <div className="bg-[var(--aio-danger-muted)] border border-[var(--aio-danger)] rounded-md p-4">
                <p className="text-[var(--aio-danger)]">{error}</p>
              </div>
            ) : usageData.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[var(--color-text-tertiary)]">使用データがありません</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[var(--dashboard-card-border)]">
                  <thead className="bg-[var(--aio-surface)]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase">組織</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase">インタビュー数</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase">メッセージ数</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase">トークン数</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase">最終更新</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-[var(--dashboard-card-border)]">
                    {usageData.map((item) => (
                      <tr key={item.organization_id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-[var(--color-text-primary)]">
                            {item.organizations?.name || '不明'}
                          </div>
                          <div className="text-sm text-[var(--color-text-tertiary)]">
                            {item.organizations?.slug || item.organization_id}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-primary)]">
                          {item.interview_count?.toLocaleString() || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-primary)]">
                          {item.message_count?.toLocaleString() || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-primary)]">
                          {item.token_count?.toLocaleString() || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-tertiary)]">
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
