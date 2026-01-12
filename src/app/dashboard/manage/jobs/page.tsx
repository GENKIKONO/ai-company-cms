'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { DashboardPageShell } from '@/components/dashboard';

interface TranslationJob {
  id: string;
  source_table: string;
  source_id: string;
  target_language: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  error_message: string | null;
}

interface EmbeddingJob {
  id: string;
  organization_id: string;
  source_table: string;
  source_id: string;
  status: string;
  priority: number;
  created_at: string;
  completed_at: string | null;
  error_message: string | null;
}

type TabType = 'translation' | 'embedding';

export default function JobsMonitorPage() {
  return (
    <DashboardPageShell title="ジョブ監視" requiredRole="admin">
      <JobsMonitorContent />
    </DashboardPageShell>
  );
}

function JobsMonitorContent() {
  const [activeTab, setActiveTab] = useState<TabType>('translation');
  const [translationJobs, setTranslationJobs] = useState<TranslationJob[]>([]);
  const [embeddingJobs, setEmbeddingJobs] = useState<EmbeddingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchJobs() {
      setLoading(true);
      setError(null);
      try {
        const supabase = createClient();

        if (activeTab === 'translation') {
          const { data, error } = await supabase
            .from('translation_jobs')
            .select('id, organization_id, source_table, source_id, source_field, source_lang, target_lang, target_language, status, error_message, completed_at, created_at, updated_at')
            .order('created_at', { ascending: false })
            .limit(100);
          if (error) throw error;
          setTranslationJobs(data || []);
        } else {
          const { data, error } = await supabase
            .from('embedding_jobs')
            .select('id, organization_id, source_table, source_id, source_field, status, priority, error_message, retry_count, completed_at, created_at, updated_at')
            .order('created_at', { ascending: false })
            .limit(100);
          if (error) throw error;
          setEmbeddingJobs(data || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'データ取得エラー');
      } finally {
        setLoading(false);
      }
    }
    fetchJobs();
  }, [activeTab]);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-[var(--aio-warning-muted)] text-[var(--aio-warning)]',
      processing: 'bg-[var(--aio-muted)] text-[var(--aio-primary)]',
      completed: 'bg-[var(--aio-success-muted)] text-[var(--aio-success)]',
      failed: 'bg-[var(--aio-danger-muted)] text-[var(--aio-danger)]',
    };
    return styles[status] || 'bg-[var(--aio-surface)] text-[var(--color-text-primary)]';
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
            <li className="text-[var(--color-text-primary)] font-medium">ジョブ監視</li>
          </ol>
        </nav>

        <div className="bg-white rounded-lg shadow-sm border border-[var(--dashboard-card-border)]">
          <div className="px-6 py-4 border-b border-[var(--dashboard-card-border)]">
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">ジョブ監視</h1>
            <p className="text-sm text-[var(--color-text-tertiary)] mt-1">翻訳・埋め込みジョブの状態を監視</p>
          </div>

          {/* タブ */}
          <div className="border-b border-[var(--dashboard-card-border)]">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('translation')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'translation'
                    ? 'border-[var(--aio-primary)] text-[var(--aio-primary)]'
                    : 'border-transparent text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'
                }`}
              >
                翻訳ジョブ
              </button>
              <button
                onClick={() => setActiveTab('embedding')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'embedding'
                    ? 'border-[var(--aio-primary)] text-[var(--aio-primary)]'
                    : 'border-transparent text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'
                }`}
              >
                埋め込みジョブ
              </button>
            </nav>
          </div>

          <div className="p-6" data-testid="jobs-list">
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
                {activeTab === 'translation' ? (
                  <table className="min-w-full divide-y divide-[var(--dashboard-card-border)]">
                    <thead className="bg-[var(--aio-surface)]">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase">ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase">ソース</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase">言語</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase">状態</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase">作成日時</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase">完了日時</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-[var(--dashboard-card-border)]">
                      {translationJobs.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-[var(--color-text-tertiary)]">
                            翻訳ジョブがありません
                          </td>
                        </tr>
                      ) : (
                        translationJobs.map((job) => (
                          <tr key={job.id}>
                            <td className="px-4 py-4 text-sm text-[var(--color-text-tertiary)] font-mono">
                              {job.id.slice(0, 8)}...
                            </td>
                            <td className="px-4 py-4 text-sm text-[var(--color-text-primary)]">
                              {job.source_table}
                            </td>
                            <td className="px-4 py-4 text-sm text-[var(--color-text-primary)]">
                              {job.target_language}
                            </td>
                            <td className="px-4 py-4">
                              <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(job.status)}`}>
                                {job.status}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm text-[var(--color-text-tertiary)]">
                              {new Date(job.created_at).toLocaleString('ja-JP')}
                            </td>
                            <td className="px-4 py-4 text-sm text-[var(--color-text-tertiary)]">
                              {job.completed_at ? new Date(job.completed_at).toLocaleString('ja-JP') : '-'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                ) : (
                  <table className="min-w-full divide-y divide-[var(--dashboard-card-border)]">
                    <thead className="bg-[var(--aio-surface)]">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase">ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase">ソース</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase">優先度</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase">状態</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase">作成日時</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase">完了日時</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-[var(--dashboard-card-border)]">
                      {embeddingJobs.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-[var(--color-text-tertiary)]">
                            埋め込みジョブがありません
                          </td>
                        </tr>
                      ) : (
                        embeddingJobs.map((job) => (
                          <tr key={job.id}>
                            <td className="px-4 py-4 text-sm text-[var(--color-text-tertiary)] font-mono">
                              {job.id.slice(0, 8)}...
                            </td>
                            <td className="px-4 py-4 text-sm text-[var(--color-text-primary)]">
                              {job.source_table}
                            </td>
                            <td className="px-4 py-4 text-sm text-[var(--color-text-primary)]">
                              {job.priority}
                            </td>
                            <td className="px-4 py-4">
                              <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(job.status)}`}>
                                {job.status}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm text-[var(--color-text-tertiary)]">
                              {new Date(job.created_at).toLocaleString('ja-JP')}
                            </td>
                            <td className="px-4 py-4 text-sm text-[var(--color-text-tertiary)]">
                              {job.completed_at ? new Date(job.completed_at).toLocaleString('ja-JP') : '-'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
