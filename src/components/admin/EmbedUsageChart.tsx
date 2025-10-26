'use client';

/**
 * 埋め込み使用状況チャートコンポーネント
 * 過去30日間の使用状況をビジュアル表示
 */

import React, { useState, useEffect } from 'react';

interface UsageData {
  date: string;
  widgetLoads: number;
  iframeLoads: number;
  totalClicks: number;
  errorCount: number;
}

interface ChartProps {
  organizationId?: string; // 指定すると特定組織のみ
  days?: number; // 表示日数（デフォルト30日）
}

export function EmbedUsageChart({ organizationId, days = 30 }: ChartProps) {
  const [data, setData] = useState<UsageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<'loads' | 'clicks' | 'errors'>('loads');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsageData();
  }, [organizationId, days]);

  const fetchUsageData = async () => {
    try {
      setLoading(true);
      setError(null);

      const endDate = new Date();
      const startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - days);
      
      const params = new URLSearchParams({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      });
      
      if (organizationId) {
        params.set('organizationId', organizationId);
      }

      const response = await fetch(`/api/admin/embed/usage-stats?${params}`);
      
      if (!response.ok) {
        throw new Error('使用状況データの取得に失敗しました');
      }

      const result = await response.json();
      setData(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラー');
      console.error('Failed to fetch usage data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getMaxValue = () => {
    if (data.length === 0) return 100;
    
    switch (selectedMetric) {
      case 'loads':
        return Math.max(...data.map(d => d.widgetLoads + d.iframeLoads));
      case 'clicks':
        return Math.max(...data.map(d => d.totalClicks));
      case 'errors':
        return Math.max(...data.map(d => d.errorCount));
      default:
        return 100;
    }
  };

  const getBarHeight = (item: UsageData): number => {
    const maxValue = getMaxValue();
    let value = 0;
    
    switch (selectedMetric) {
      case 'loads':
        value = item.widgetLoads + item.iframeLoads;
        break;
      case 'clicks':
        value = item.totalClicks;
        break;
      case 'errors':
        value = item.errorCount;
        break;
    }
    
    return Math.max((value / maxValue) * 100, 1); // 最小1%
  };

  const getMetricColor = (): string => {
    switch (selectedMetric) {
      case 'loads': return 'bg-blue-500';
      case 'clicks': return 'bg-green-500';
      case 'errors': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatTooltipValue = (item: UsageData): string => {
    switch (selectedMetric) {
      case 'loads':
        return `Widget: ${item.widgetLoads.toLocaleString()}, iframe: ${item.iframeLoads.toLocaleString()}`;
      case 'clicks':
        return `${item.totalClicks.toLocaleString()} クリック`;
      case 'errors':
        return `${item.errorCount.toLocaleString()} エラー`;
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="text-center py-8">
          <div className="text-red-500 mb-2">⚠️</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchUsageData}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      {/* メトリクス選択 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex space-x-1">
          {[
            { key: 'loads' as const, label: '読み込み数', color: 'blue' },
            { key: 'clicks' as const, label: 'クリック数', color: 'green' },
            { key: 'errors' as const, label: 'エラー数', color: 'red' }
          ].map((metric) => (
            <button
              key={metric.key}
              onClick={() => setSelectedMetric(metric.key)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                selectedMetric === metric.key
                  ? `bg-blue-100 text-blue-700 border border-blue-300`
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {metric.label}
            </button>
          ))}
        </div>
        
        <div className="text-sm text-gray-500">
          過去{days}日間
        </div>
      </div>

      {/* チャート */}
      {data.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          表示するデータがありません
        </div>
      ) : (
        <div className="relative">
          {/* Y軸ラベル */}
          <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-xs text-gray-400">
            <span>{getMaxValue().toLocaleString()}</span>
            <span>{Math.floor(getMaxValue() / 2).toLocaleString()}</span>
            <span>0</span>
          </div>
          
          {/* チャート本体 */}
          <div className="ml-14 mr-2">
            <div className="flex items-end justify-between h-64 border-l border-b border-gray-200">
              {data.map((item, index) => (
                <div
                  key={item.date}
                  className="flex-1 flex flex-col items-center group cursor-pointer"
                  title={formatTooltipValue(item)}
                >
                  {/* バー */}
                  <div className="w-full max-w-8 mb-2 relative">
                    <div
                      className={`w-full ${getMetricColor()} rounded-t transition-all duration-300 group-hover:opacity-80`}
                      style={{ height: `${getBarHeight(item)}%` }}
                    />
                    
                    {/* ツールチップ */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                        <div className="font-medium">
                          {new Date(item.date).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}
                        </div>
                        <div>{formatTooltipValue(item)}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 日付ラベル */}
                  <div className="text-xs text-gray-400 transform -rotate-45 origin-top-left">
                    {new Date(item.date).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 統計サマリー */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
        {[
          {
            label: '総読み込み数',
            value: data.reduce((sum, item) => sum + item.widgetLoads + item.iframeLoads, 0),
            color: 'text-blue-600'
          },
          {
            label: '総クリック数',
            value: data.reduce((sum, item) => sum + item.totalClicks, 0),
            color: 'text-green-600'
          },
          {
            label: '総エラー数',
            value: data.reduce((sum, item) => sum + item.errorCount, 0),
            color: 'text-red-600'
          },
          {
            label: 'エラー率',
            value: data.length > 0 ? 
              ((data.reduce((sum, item) => sum + item.errorCount, 0) / 
                data.reduce((sum, item) => sum + item.widgetLoads + item.iframeLoads, 0)) * 100) : 0,
            color: 'text-orange-600',
            suffix: '%'
          }
        ].map((stat, index) => (
          <div key={index} className="text-center">
            <div className={`text-2xl font-bold ${stat.color}`}>
              {typeof stat.value === 'number' ? 
                (stat.suffix === '%' ? 
                  stat.value.toFixed(2) : 
                  stat.value.toLocaleString()
                ) : stat.value
              }
              {stat.suffix}
            </div>
            <div className="text-sm text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}