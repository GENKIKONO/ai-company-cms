/**
 * Translation Analytics Page
 * P4-3: 翻訳システム分析・運用監視
 */

'use client';

import { useState, useEffect } from 'react';
import { 
  ArrowTrendingUpIcon,
  LanguageIcon,
  DocumentTextIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import type { TranslationMetrics } from '@/lib/translation-client';

interface AnalyticsData {
  metrics: TranslationMetrics;
  hourly_stats: { hour: number; completed: number; failed: number }[];
  language_distribution: { language: string; count: number; success_rate: number }[];
  content_type_distribution: { type: string; count: number; avg_processing_time: number }[];
}

export default function TranslationAnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDateRange, setSelectedDateRange] = useState<'24h' | '7d' | '30d'>('24h');

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // メトリクス取得
      const metricsResponse = await fetch('/api/admin/translations/metrics');
      const metricsData = await metricsResponse.json();

      if (metricsData.success) {
        // 実データベースの分析データ生成
        const analyticsData: AnalyticsData = {
          metrics: metricsData.data,
          hourly_stats: [], // 時間別統計は今後実装予定
          language_distribution: Object.entries(metricsData.data.jobs_by_language).map(([lang, count]) => ({
            language: lang,
            count: count as number,
            success_rate: 95 // デフォルト成功率（今後実データに置換）
          })),
          content_type_distribution: Object.entries(metricsData.data.jobs_by_table).map(([type, count]) => ({
            type,
            count: count as number,
            avg_processing_time: 3 // デフォルト処理時間（今後実データに置換）
          }))
        };

        setAnalyticsData(analyticsData);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchAnalytics();
  }, [selectedDateRange]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">分析データを取得できませんでした</p>
        </div>
      </div>
    );
  }

  const { metrics } = analyticsData;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">翻訳システム分析</h1>
              <p className="mt-2 text-gray-600">翻訳パイプラインの運用状況とパフォーマンス</p>
            </div>

            <div className="flex gap-2">
              {(['24h', '7d', '30d'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setSelectedDateRange(range)}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    selectedDateRange === range
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {range === '24h' && '24時間'}
                  {range === '7d' && '7日間'}
                  {range === '30d' && '30日間'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* KPIカード */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="w-8 h-8 text-blue-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">総処理数</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {metrics.total_jobs.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArrowTrendingUpIcon className="w-8 h-8 text-green-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">成功率</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {metrics.success_rate_percent}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="w-8 h-8 text-purple-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">平均処理時間</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {metrics.avg_processing_time_minutes 
                    ? `${Math.round(metrics.avg_processing_time_minutes)}分`
                    : 'N/A'
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <LanguageIcon className="w-8 h-8 text-orange-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">対応言語数</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {Object.keys(metrics.jobs_by_language).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* チャート・分析 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 言語別分布 */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">言語別翻訳状況</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {analyticsData.language_distribution.map((lang) => (
                  <div key={lang.language} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900 min-w-[3rem]">
                        {lang.language.toUpperCase()}
                      </span>
                      <div className="ml-4 flex-1">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ 
                              width: `${Math.min((lang.count / Math.max(...analyticsData.language_distribution.map(l => l.count))) * 100, 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {lang.count.toLocaleString()}件
                      </div>
                      <div className="text-xs text-gray-500">
                        成功率 {Math.round(lang.success_rate)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* コンテンツタイプ別分布 */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">コンテンツタイプ別状況</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {analyticsData.content_type_distribution.map((type) => (
                  <div key={type.type} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900 min-w-[5rem]">
                        {type.type}
                      </span>
                      <div className="ml-4 flex-1">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ 
                              width: `${Math.min((type.count / Math.max(...analyticsData.content_type_distribution.map(t => t.count))) * 100, 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {type.count.toLocaleString()}件
                      </div>
                      <div className="text-xs text-gray-500">
                        平均 {Math.round(type.avg_processing_time)}分
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 現在の処理状況 */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">現在の処理状況</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600 mb-2">
                  {metrics.pending_jobs}
                </div>
                <div className="text-sm text-gray-600">待機中のジョブ</div>
                <div className="mt-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    キュー待機
                  </span>
                </div>
              </div>

              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {metrics.in_progress_jobs}
                </div>
                <div className="text-sm text-gray-600">処理中のジョブ</div>
                <div className="mt-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    実行中
                  </span>
                </div>
              </div>

              <div className="text-center">
                <div className="text-3xl font-bold text-red-600 mb-2">
                  {metrics.failed_jobs}
                </div>
                <div className="text-sm text-gray-600">失敗したジョブ</div>
                <div className="mt-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    要対応
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}