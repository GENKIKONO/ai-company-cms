/* eslint-disable no-console */
/**
 * Translation Jobs Management Page
 * P4-3: 翻訳ジョブ管理画面
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronUpDownIcon, PlayIcon, PauseIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import type { TranslationJob, TranslationJobFilter, TranslationMetrics } from '@/lib/translation-client';

interface TranslationJobsResponse {
  success: boolean;
  data: TranslationJob[];
  total: number;
  filter: TranslationJobFilter;
  error?: string;
}

interface TranslationMetricsResponse {
  success: boolean;
  data: TranslationMetrics;
  error?: string;
}

export default function TranslationsManagementPage() {
  const [jobs, setJobs] = useState<TranslationJob[]>([]);
  const [metrics, setMetrics] = useState<TranslationMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingDrain, setProcessingDrain] = useState(false);
  const [filter, setFilter] = useState<TranslationJobFilter>({
    limit: 50,
    offset: 0
  });
  const [total, setTotal] = useState(0);

  // データ取得
  const fetchJobs = useCallback(async (newFilter?: TranslationJobFilter) => {
    try {
      const currentFilter = newFilter || filter;
      const params = new URLSearchParams();
      
      Object.entries(currentFilter).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });

      const response = await fetch(`/api/admin/translations?${params}`);
      const result: TranslationJobsResponse = await response.json();

      if (result.success) {
        setJobs(result.data);
        setTotal(result.total);
        if (newFilter) setFilter(newFilter);
      } else {
        console.error('Failed to fetch jobs:', result.error);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  }, [filter]);

  const fetchMetrics = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/translations/metrics');
      const result: TranslationMetricsResponse = await response.json();

      if (result.success && result.data) {
        setMetrics(result.data);
      } else {
        console.error('Failed to fetch metrics:', result.error);
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  }, []);

  // バッチ処理実行
  const handleDrainJobs = async () => {
    setProcessingDrain(true);
    try {
      const response = await fetch('/api/admin/translations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'drain' })
      });

      const result = await response.json();

      if (result.success) {
        alert(`処理完了: ${result.processed_count}件のジョブを処理しました`);
        await Promise.all([fetchJobs(), fetchMetrics()]);
      } else {
        alert(`エラー: ${result.error}`);
      }
    } catch (error) {
      alert(`エラー: ${error}`);
    } finally {
      setProcessingDrain(false);
    }
  };

  // 初期データ読み込み
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchJobs(), fetchMetrics()]);
      setLoading(false);
    };

    loadData();
  }, [fetchJobs, fetchMetrics]);

  // ステータス別の色設定
  const getStatusColor = (status: TranslationJob['status']) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'in_progress':
        return 'text-[var(--aio-info)] bg-[var(--aio-info-surface)]';
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      case 'cancelled':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  // フィルタ更新
  const updateFilter = (key: keyof TranslationJobFilter, value: any) => {
    const newFilter = {
      ...filter,
      [key]: value,
      offset: 0 // フィルタ変更時はページをリセット
    };
    fetchJobs(newFilter);
  };

  // ページネーション
  const handlePageChange = (newOffset: number) => {
    const newFilter = { ...filter, offset: newOffset };
    fetchJobs(newFilter);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--aio-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">翻訳ジョブ管理</h1>
              <p className="mt-2 text-gray-600">翻訳パイプラインの監視・管理</p>
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={() => Promise.all([fetchJobs(), fetchMetrics()])}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <ArrowPathIcon className="w-4 h-4 mr-2" />
                更新
              </button>
              
              <button
                onClick={handleDrainJobs}
                disabled={processingDrain}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--aio-primary)] hover:bg-[var(--aio-primary-hover)] disabled:opacity-50"
              >
                <PlayIcon className="w-4 h-4 mr-2" />
                {processingDrain ? '処理中...' : 'バッチ処理実行'}
              </button>
            </div>
          </div>
        </div>

        {/* メトリクス */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-600">総ジョブ数</div>
              <div className="text-2xl font-bold text-gray-900">{metrics.total_jobs.toLocaleString()}</div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-600">待機中</div>
              <div className="text-2xl font-bold text-yellow-600">{metrics.pending_jobs.toLocaleString()}</div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-600">処理中</div>
              <div className="text-2xl font-bold text-[var(--aio-info)]">{metrics.in_progress_jobs.toLocaleString()}</div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-600">完了</div>
              <div className="text-2xl font-bold text-green-600">{metrics.completed_jobs.toLocaleString()}</div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-600">成功率</div>
              <div className="text-2xl font-bold text-gray-900">{metrics.success_rate_percent}%</div>
            </div>
          </div>
        )}

        {/* フィルタ */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">フィルタ</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ステータス</label>
                <select
                  value={filter.status || ''}
                  onChange={(e) => updateFilter('status', e.target.value || undefined)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-[var(--aio-info)] focus:ring-[var(--aio-info)]"
                >
                  <option value="">すべて</option>
                  <option value="pending">待機中</option>
                  <option value="in_progress">処理中</option>
                  <option value="completed">完了</option>
                  <option value="failed">失敗</option>
                  <option value="cancelled">キャンセル</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">対象テーブル</label>
                <select
                  value={filter.source_table || ''}
                  onChange={(e) => updateFilter('source_table', e.target.value || undefined)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-[var(--aio-info)] focus:ring-[var(--aio-info)]"
                >
                  <option value="">すべて</option>
                  <option value="posts">投稿</option>
                  <option value="services">サービス</option>
                  <option value="faqs">FAQ</option>
                  <option value="case_studies">導入事例</option>
                  <option value="products">製品</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">翻訳先言語</label>
                <select
                  value={filter.target_lang || ''}
                  onChange={(e) => updateFilter('target_lang', e.target.value || undefined)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-[var(--aio-info)] focus:ring-[var(--aio-info)]"
                >
                  <option value="">すべて</option>
                  <option value="en">英語</option>
                  <option value="zh">中国語</option>
                  <option value="ko">韓国語</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">優先度(最小)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={filter.priority_min || ''}
                  onChange={(e) => updateFilter('priority_min', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-[var(--aio-info)] focus:ring-[var(--aio-info)]"
                  placeholder="1-10"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">表示件数</label>
                <select
                  value={filter.limit || 50}
                  onChange={(e) => updateFilter('limit', parseInt(e.target.value))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-[var(--aio-info)] focus:ring-[var(--aio-info)]"
                >
                  <option value="25">25件</option>
                  <option value="50">50件</option>
                  <option value="100">100件</option>
                  <option value="200">200件</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ジョブ一覧 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">翻訳ジョブ一覧</h2>
            <p className="text-sm text-gray-600 mt-1">
              {total.toLocaleString()}件中 {jobs.length.toLocaleString()}件を表示
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    対象
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    言語
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    優先度
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    原文
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    作成日時
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                        {job.status === 'pending' && '待機中'}
                        {job.status === 'in_progress' && '処理中'}
                        {job.status === 'completed' && '完了'}
                        {job.status === 'failed' && '失敗'}
                        {job.status === 'cancelled' && 'キャンセル'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>{job.source_table}/{job.source_field}</div>
                      <div className="text-xs text-gray-500">{job.source_id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {job.source_lang} → {job.target_lang}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-[var(--aio-info-muted)] text-[var(--aio-info)]">
                        {job.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate" title={job.source_text}>
                        {job.source_text}
                      </div>
                      {job.error_message && (
                        <div className="text-xs text-red-600 mt-1">{job.error_message}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(job.created_at).toLocaleString('ja-JP')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ページネーション */}
          {total > (filter.limit || 50) && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between items-center">
                <button
                  onClick={() => handlePageChange(Math.max(0, (filter.offset || 0) - (filter.limit || 50)))}
                  disabled={(filter.offset || 0) === 0}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  前へ
                </button>
                
                <span className="text-sm text-gray-700">
                  {((filter.offset || 0) + 1).toLocaleString()} - {Math.min((filter.offset || 0) + (filter.limit || 50), total).toLocaleString()} 件目
                </span>
                
                <button
                  onClick={() => handlePageChange((filter.offset || 0) + (filter.limit || 50))}
                  disabled={(filter.offset || 0) + (filter.limit || 50) >= total}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  次へ
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}