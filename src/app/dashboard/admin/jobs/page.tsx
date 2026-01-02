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
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-[var(--aio-muted)] text-[var(--aio-primary)]',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

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
            <li className="text-gray-900 font-medium">ジョブ監視</li>
          </ol>
        </nav>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">ジョブ監視</h1>
            <p className="text-sm text-gray-500 mt-1">翻訳・埋め込みジョブの状態を監視</p>
          </div>

          {/* タブ */}
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('translation')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'translation'
                    ? 'border-[var(--aio-primary)] text-[var(--aio-primary)]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                翻訳ジョブ
              </button>
              <button
                onClick={() => setActiveTab('embedding')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'embedding'
                    ? 'border-[var(--aio-primary)] text-[var(--aio-primary)]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
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
                <p className="text-gray-500 mt-4">読み込み中...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-700">{error}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {activeTab === 'translation' ? (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ソース</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">言語</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状態</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">作成日時</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">完了日時</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {translationJobs.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                            翻訳ジョブがありません
                          </td>
                        </tr>
                      ) : (
                        translationJobs.map((job) => (
                          <tr key={job.id}>
                            <td className="px-4 py-4 text-sm text-gray-500 font-mono">
                              {job.id.slice(0, 8)}...
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900">
                              {job.source_table}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900">
                              {job.target_language}
                            </td>
                            <td className="px-4 py-4">
                              <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(job.status)}`}>
                                {job.status}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-500">
                              {new Date(job.created_at).toLocaleString('ja-JP')}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-500">
                              {job.completed_at ? new Date(job.completed_at).toLocaleString('ja-JP') : '-'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ソース</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">優先度</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状態</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">作成日時</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">完了日時</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {embeddingJobs.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                            埋め込みジョブがありません
                          </td>
                        </tr>
                      ) : (
                        embeddingJobs.map((job) => (
                          <tr key={job.id}>
                            <td className="px-4 py-4 text-sm text-gray-500 font-mono">
                              {job.id.slice(0, 8)}...
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900">
                              {job.source_table}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900">
                              {job.priority}
                            </td>
                            <td className="px-4 py-4">
                              <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(job.status)}`}>
                                {job.status}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-500">
                              {new Date(job.created_at).toLocaleString('ja-JP')}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-500">
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
