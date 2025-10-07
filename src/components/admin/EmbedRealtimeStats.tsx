'use client';

/**
 * リアルタイム埋め込み統計表示コンポーネント
 * 現在のアクティブ状況とパフォーマンスを監視
 */

import React, { useState, useEffect, useRef } from 'react';

interface RealtimeStats {
  totalActiveWidgets: number;
  currentOnlineUsers: number;
  todayTotalViews: number;
  todayTotalClicks: number;
  todayErrorCount: number;
  averageResponseTime: number;
  topPerformingOrg: {
    name: string;
    views: number;
  } | null;
  systemStatus: 'healthy' | 'warning' | 'critical';
  lastUpdated: string;
}

interface PerformanceMetric {
  timestamp: string;
  responseTime: number;
  errorRate: number;
  requestCount: number;
}

export function EmbedRealtimeStats() {
  const [stats, setStats] = useState<RealtimeStats>({
    totalActiveWidgets: 0,
    currentOnlineUsers: 0,
    todayTotalViews: 0,
    todayTotalClicks: 0,
    todayErrorCount: 0,
    averageResponseTime: 0,
    topPerformingOrg: null,
    systemStatus: 'healthy',
    lastUpdated: new Date().toISOString()
  });
  
  const [performanceHistory, setPerformanceHistory] = useState<PerformanceMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchRealtimeStats();
    
    // 30秒ごとに更新
    intervalRef.current = setInterval(fetchRealtimeStats, 30000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const fetchRealtimeStats = async () => {
    try {
      const response = await fetch('/api/admin/embed/realtime-stats');
      
      if (!response.ok) {
        throw new Error('リアルタイム統計の取得に失敗しました');
      }

      const result = await response.json();
      setStats(result.stats);
      
      // パフォーマンス履歴を更新（最新20件まで保持）
      const newMetric: PerformanceMetric = {
        timestamp: new Date().toISOString(),
        responseTime: result.stats.averageResponseTime,
        errorRate: result.stats.todayErrorCount / Math.max(result.stats.todayTotalViews, 1) * 100,
        requestCount: result.stats.todayTotalViews
      };
      
      setPerformanceHistory(prev => 
        [...prev, newMetric].slice(-20)
      );
      
      setError(null);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラー');
      console.error('Failed to fetch realtime stats:', err);
      setLoading(false);
    }
  };

  const getStatusColor = (status: RealtimeStats['systemStatus']) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  const getStatusIcon = (status: RealtimeStats['systemStatus']) => {
    switch (status) {
      case 'healthy': return '✅';
      case 'warning': return '⚠️';
      case 'critical': return '🚨';
    }
  };

  const formatResponseTime = (ms: number): string => {
    if (ms < 100) return `${ms.toFixed(0)}ms`;
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const calculateTrend = (history: PerformanceMetric[], key: keyof PerformanceMetric): 'up' | 'down' | 'stable' => {
    if (history.length < 2) return 'stable';
    
    const recent = history.slice(-3);
    const values = recent.map(h => typeof h[key] === 'number' ? h[key] as number : 0);
    
    if (values.length < 2) return 'stable';
    
    const trend = values[values.length - 1] - values[0];
    if (Math.abs(trend) < 0.1) return 'stable';
    
    return trend > 0 ? 'up' : 'down';
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable', isGoodWhenUp: boolean = true) => {
    if (trend === 'stable') return '➡️';
    if (trend === 'up') return isGoodWhenUp ? '📈' : '📉';
    return isGoodWhenUp ? '📉' : '📈';
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        ))}
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
            onClick={fetchRealtimeStats}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* システム状態 */}
      <div className={`p-4 rounded-lg border ${getStatusColor(stats.systemStatus)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl">{getStatusIcon(stats.systemStatus)}</span>
            <span className="font-semibold">
              システム状態: {stats.systemStatus === 'healthy' ? '正常' : 
                              stats.systemStatus === 'warning' ? '警告' : '異常'}
            </span>
          </div>
          <div className="text-sm">
            最終更新: {new Date(stats.lastUpdated).toLocaleTimeString('ja-JP')}
          </div>
        </div>
      </div>

      {/* メイン統計 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* アクティブWidget数 */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">アクティブWidget</h3>
            <span className="text-2xl">🎯</span>
          </div>
          <div className="text-3xl font-bold text-blue-600 mb-1">
            {stats.totalActiveWidgets.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500">
            現在稼働中
          </div>
        </div>

        {/* 今日の総ビュー数 */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">今日のビュー</h3>
            <span className="text-xl">{getTrendIcon(calculateTrend(performanceHistory, 'requestCount'))}</span>
          </div>
          <div className="text-3xl font-bold text-green-600 mb-1">
            {stats.todayTotalViews.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500">
            クリック: {stats.todayTotalClicks.toLocaleString()}
          </div>
        </div>

        {/* エラー率 */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">エラー率</h3>
            <span className="text-xl">{getTrendIcon(calculateTrend(performanceHistory, 'errorRate'), false)}</span>
          </div>
          <div className="text-3xl font-bold text-red-600 mb-1">
            {stats.todayTotalViews > 0 ? 
              ((stats.todayErrorCount / stats.todayTotalViews) * 100).toFixed(2) : '0.00'
            }%
          </div>
          <div className="text-sm text-gray-500">
            エラー: {stats.todayErrorCount.toLocaleString()}件
          </div>
        </div>

        {/* 平均レスポンス時間 */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">応答速度</h3>
            <span className="text-xl">{getTrendIcon(calculateTrend(performanceHistory, 'responseTime'), false)}</span>
          </div>
          <div className="text-3xl font-bold text-purple-600 mb-1">
            {formatResponseTime(stats.averageResponseTime)}
          </div>
          <div className="text-sm text-gray-500">
            平均レスポンス時間
          </div>
        </div>
      </div>

      {/* パフォーマンストレンド */}
      {performanceHistory.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            パフォーマンストレンド（過去10分）
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* レスポンス時間 */}
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-2">レスポンス時間</h4>
              <div className="h-20 flex items-end space-x-1">
                {performanceHistory.slice(-10).map((metric, index) => {
                  const height = Math.max((metric.responseTime / 1000) * 100, 2);
                  return (
                    <div
                      key={index}
                      className="flex-1 bg-purple-500 rounded-t"
                      style={{ height: `${Math.min(height, 100)}%` }}
                      title={`${formatResponseTime(metric.responseTime)} at ${new Date(metric.timestamp).toLocaleTimeString()}`}
                    />
                  );
                })}
              </div>
            </div>

            {/* エラー率 */}
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-2">エラー率</h4>
              <div className="h-20 flex items-end space-x-1">
                {performanceHistory.slice(-10).map((metric, index) => {
                  const height = Math.max(metric.errorRate * 10, 2);
                  return (
                    <div
                      key={index}
                      className="flex-1 bg-red-500 rounded-t"
                      style={{ height: `${Math.min(height, 100)}%` }}
                      title={`${metric.errorRate.toFixed(2)}% at ${new Date(metric.timestamp).toLocaleTimeString()}`}
                    />
                  );
                })}
              </div>
            </div>

            {/* リクエスト数 */}
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-2">累積リクエスト</h4>
              <div className="h-20 flex items-end space-x-1">
                {performanceHistory.slice(-10).map((metric, index) => {
                  const maxRequests = Math.max(...performanceHistory.map(h => h.requestCount));
                  const height = maxRequests > 0 ? (metric.requestCount / maxRequests) * 100 : 2;
                  return (
                    <div
                      key={index}
                      className="flex-1 bg-blue-500 rounded-t"
                      style={{ height: `${Math.max(height, 2)}%` }}
                      title={`${metric.requestCount.toLocaleString()} requests at ${new Date(metric.timestamp).toLocaleTimeString()}`}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* トップパフォーマー */}
      {stats.topPerformingOrg && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            🏆 今日のトップパフォーマー
          </h3>
          <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div>
              <div className="font-semibold text-gray-900">
                {stats.topPerformingOrg.name}
              </div>
              <div className="text-sm text-gray-600">
                本日 {stats.topPerformingOrg.views.toLocaleString()} ビュー
              </div>
            </div>
            <div className="text-2xl">🎉</div>
          </div>
        </div>
      )}
    </div>
  );
}