'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { DashboardPageShell } from '@/components/dashboard';

interface StorageAccessLog {
  id: string;
  bucket_id: string;
  object_path: string;
  action: string;
  user_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  status_code: number;
  created_at: string;
}

export default function StorageLogsPage() {
  return (
    <DashboardPageShell title="ストレージログ" requiredRole="admin">
      <StorageLogsContent />
    </DashboardPageShell>
  );
}

function StorageLogsContent() {
  const [logs, setLogs] = useState<StorageAccessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterBucket, setFilterBucket] = useState<string>('');
  const [filterAction, setFilterAction] = useState<string>('');

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true);
      setError(null);
      try {
        const supabase = createClient();
        let query = supabase
          .from('storage_access_logs')
          .select('id, bucket_id, object_path, action, user_id, ip_address, user_agent, status_code, created_at')
          .order('created_at', { ascending: false })
          .limit(200);

        if (filterBucket) {
          query = query.eq('bucket_id', filterBucket);
        }
        if (filterAction) {
          query = query.eq('action', filterAction);
        }

        const { data, error } = await query;
        if (error) throw error;
        setLogs(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'データ取得エラー');
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, [filterBucket, filterAction]);

  const getStatusBadge = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) {
      return 'bg-[var(--aio-success-muted)] text-[var(--aio-success)]';
    } else if (statusCode >= 400 && statusCode < 500) {
      return 'bg-[var(--aio-warning-muted)] text-[var(--aio-warning)]';
    } else if (statusCode >= 500) {
      return 'bg-[var(--aio-danger-muted)] text-[var(--aio-danger)]';
    }
    return 'bg-[var(--aio-surface)] text-[var(--color-text-primary)]';
  };

  const getActionBadge = (action: string) => {
    const styles: Record<string, string> = {
      read: 'bg-[var(--aio-muted)] text-[var(--aio-primary)]',
      write: 'bg-[var(--aio-success-muted)] text-[var(--aio-success)]',
      delete: 'bg-[var(--aio-danger-muted)] text-[var(--aio-danger)]',
      list: 'bg-[var(--aio-purple-muted)] text-[var(--aio-purple)]',
    };
    return styles[action?.toLowerCase()] || 'bg-[var(--aio-surface)] text-[var(--color-text-primary)]';
  };

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
            <li className="text-[var(--color-text-primary)] font-medium">ストレージログ</li>
          </ol>
        </nav>

        <div className="bg-white rounded-lg shadow-sm border border-[var(--dashboard-card-border)]">
          <div className="px-6 py-4 border-b border-[var(--dashboard-card-border)]">
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">ストレージアクセスログ</h1>
            <p className="text-sm text-[var(--color-text-tertiary)] mt-1">ファイルストレージへのアクセス履歴</p>
          </div>

          {/* フィルター */}
          <div className="px-6 py-4 border-b border-[var(--dashboard-card-border)] bg-[var(--aio-surface)]">
            <div className="flex gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">バケット</label>
                <select
                  value={filterBucket}
                  onChange={(e) => setFilterBucket(e.target.value)}
                  className="block w-40 rounded-md border-[var(--input-border)] shadow-sm focus:border-[var(--aio-primary)] focus:ring-[var(--aio-primary)] text-sm"
                >
                  <option value="">全て</option>
                  <option value="assets">assets</option>
                  <option value="org-docs">org-docs</option>
                  <option value="avatars">avatars</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">アクション</label>
                <select
                  value={filterAction}
                  onChange={(e) => setFilterAction(e.target.value)}
                  className="block w-32 rounded-md border-[var(--input-border)] shadow-sm focus:border-[var(--aio-primary)] focus:ring-[var(--aio-primary)] text-sm"
                >
                  <option value="">全て</option>
                  <option value="read">read</option>
                  <option value="write">write</option>
                  <option value="delete">delete</option>
                  <option value="list">list</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-6" data-testid="storage-logs-list">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-[var(--aio-primary)] border-t-transparent rounded-full mx-auto"></div>
                <p className="text-[var(--color-text-tertiary)] mt-4">読み込み中...</p>
              </div>
            ) : error ? (
              <div className="bg-[var(--aio-danger-muted)] border border-[var(--aio-danger)] rounded-md p-4">
                <p className="text-[var(--aio-danger)]">{error}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[var(--dashboard-card-border)]">
                  <thead className="bg-[var(--aio-surface)]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase">日時</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase">バケット</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase">パス</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase">アクション</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase">ステータス</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase">IP</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-[var(--dashboard-card-border)]">
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-[var(--color-text-tertiary)]">
                          ログがありません
                        </td>
                      </tr>
                    ) : (
                      logs.map((log) => (
                        <tr key={log.id}>
                          <td className="px-4 py-4 text-sm text-[var(--color-text-tertiary)]">
                            {new Date(log.created_at).toLocaleString('ja-JP')}
                          </td>
                          <td className="px-4 py-4 text-sm text-[var(--color-text-primary)]">
                            {log.bucket_id}
                          </td>
                          <td className="px-4 py-4 text-sm text-[var(--color-text-primary)] max-w-xs truncate font-mono">
                            {log.object_path}
                          </td>
                          <td className="px-4 py-4">
                            <span className={`px-2 py-1 text-xs rounded-full ${getActionBadge(log.action)}`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(log.status_code)}`}>
                              {log.status_code}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-[var(--color-text-tertiary)] font-mono">
                            {log.ip_address || '-'}
                          </td>
                        </tr>
                      ))
                    )}
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
