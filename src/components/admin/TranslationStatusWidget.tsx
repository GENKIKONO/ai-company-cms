/**
 * Translation Status Widget
 * P4-3: 翻訳ジョブ状況の簡易表示ウィジェット
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ClockIcon, 
  PlayIcon, 
  CheckCircleIcon, 
  ExclamationCircleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import type { TranslationMetrics } from '@/lib/translation-client';

interface TranslationMetricsResponse {
  success: boolean;
  data: TranslationMetrics;
  error?: string;
}

export default function TranslationStatusWidget() {
  const [metrics, setMetrics] = useState<TranslationMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/admin/translations/metrics');
      const result: TranslationMetricsResponse = await response.json();

      if (result.success && result.data) {
        setMetrics(result.data);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error fetching translation metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    
    // 30秒間隔で自動更新
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-2">翻訳ジョブ状況</h3>
        <p className="text-sm text-gray-500">データを取得できませんでした</p>
      </div>
    );
  }

  const hasActiveJobs = metrics.pending_jobs + metrics.in_progress_jobs > 0;

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-900">翻訳ジョブ状況</h3>
          <Link
            href="/admin/translations"
            className="text-xs text-blue-600 hover:text-blue-500 flex items-center"
          >
            詳細
            <ArrowRightIcon className="w-3 h-3 ml-1" />
          </Link>
        </div>

        {/* サマリー */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {metrics.total_jobs.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">総ジョブ数</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">
              {metrics.success_rate_percent}%
            </div>
            <div className="text-xs text-gray-500">成功率</div>
          </div>
        </div>

        {/* 状況別カウント */}
        <div className="space-y-2">
          {metrics.pending_jobs > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <ClockIcon className="w-4 h-4 text-yellow-500 mr-2" />
                <span className="text-sm text-gray-700">待機中</span>
              </div>
              <span className="text-sm font-medium text-yellow-600">
                {metrics.pending_jobs.toLocaleString()}
              </span>
            </div>
          )}

          {metrics.in_progress_jobs > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <PlayIcon className="w-4 h-4 text-blue-500 mr-2" />
                <span className="text-sm text-gray-700">処理中</span>
              </div>
              <span className="text-sm font-medium text-blue-600">
                {metrics.in_progress_jobs.toLocaleString()}
              </span>
            </div>
          )}

          {metrics.completed_jobs > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                <span className="text-sm text-gray-700">完了</span>
              </div>
              <span className="text-sm font-medium text-green-600">
                {metrics.completed_jobs.toLocaleString()}
              </span>
            </div>
          )}

          {metrics.failed_jobs > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <ExclamationCircleIcon className="w-4 h-4 text-red-500 mr-2" />
                <span className="text-sm text-gray-700">失敗</span>
              </div>
              <span className="text-sm font-medium text-red-600">
                {metrics.failed_jobs.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* アクティブなジョブがある場合の注意表示 */}
        {hasActiveJobs && (
          <div className="mt-3 p-2 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700">
              翻訳処理が実行中です。数分間隔でバッチ処理されます。
            </p>
          </div>
        )}

        {/* 平均処理時間（データがある場合のみ） */}
        {metrics.avg_processing_time_minutes && (
          <div className="mt-3 text-xs text-gray-500">
            平均処理時間: {Math.round(metrics.avg_processing_time_minutes)}分
          </div>
        )}

        {/* 最終更新時刻 */}
        {lastUpdate && (
          <div className="mt-2 text-xs text-gray-400">
            最終更新: {lastUpdate.toLocaleTimeString('ja-JP')}
          </div>
        )}
      </div>
    </div>
  );
}