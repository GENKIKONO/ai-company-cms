/**
 * 監視ダッシュボード
 * 要件定義準拠: 運用監視、パフォーマンス計測、エラートラッキング
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/lib/design-system/components/ui/Card';
import { LoadingSpinner } from '@/lib/design-system/components/ui/LoadingSpinner';
import { usePerformanceTracking, useApiMonitoring } from '@/lib/monitoring/react-hooks';
import { performanceMonitor, errorMonitor, logger } from '@/lib/monitoring';
import type { SystemHealthStatus } from '@/lib/utils/monitoring-integration';

interface DashboardData {
  performance: {
    pageLoadTime?: number;
    memoryUsage?: number;
    errorCount: number;
    activeUsers: number;
  };
  errors: {
    recent: Array<{
      timestamp: Date;
      category: string;
      message: string;
      count: number;
    }>;
    byCategory: Record<string, number>;
  };
  system: {
    uptime: number;
    responseTime: number;
    throughput: number;
  };
  health?: SystemHealthStatus;
}

export default function MonitoringDashboard() {
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [lastUpdate, setLastUpdate] = React.useState<Date>(new Date());
  
  const { mark } = usePerformanceTracking('MonitoringDashboard');
  const { trackApiCall } = useApiMonitoring();

  // データ取得
  const fetchDashboardData = React.useCallback(async () => {
    try {
      mark('data-fetch-start');
      
      // 統合ヘルスチェックをAPIから取得
      let healthStatus: SystemHealthStatus | undefined;
      try {
        const healthResponse = await fetch('/api/ops/monitoring/health');
        if (healthResponse.ok) {
          const healthResult = await healthResponse.json();
          healthStatus = healthResult.data;
        }
      } catch (error) {
        console.error('Failed to fetch health status:', error);
      }
      
      // 模擬データ（実際の実装では API から取得）
      const mockData: DashboardData = {
        performance: {
          pageLoadTime: Math.random() * 2000 + 500,
          memoryUsage: Math.random() * 50 + 20,
          errorCount: Math.floor(Math.random() * 10),
          activeUsers: Math.floor(Math.random() * 100) + 50,
        },
        errors: {
          recent: [
            {
              timestamp: new Date(Date.now() - 60000),
              category: 'AUTHENTICATION',
              message: 'Login failed',
              count: 3,
            },
            {
              timestamp: new Date(Date.now() - 120000),
              category: 'DATABASE',
              message: 'Connection timeout',
              count: 1,
            },
          ],
          byCategory: errorMonitor.getErrorStats(),
        },
        system: {
          uptime: healthStatus?.metrics.uptimePercentage || 99.9,
          responseTime: healthStatus?.metrics.responseTimeP95 || Math.random() * 100 + 50,
          throughput: Math.random() * 1000 + 500,
        },
        health: healthStatus,
      };

      // 実際のメトリクスを混合
      const recentMetrics = performanceMonitor.getRecentMetrics(1);
      if (recentMetrics.length > 0) {
        const latest = recentMetrics[0];
        mockData.performance.errorCount = latest.errors.count;
        mockData.performance.memoryUsage = latest.system.memoryUsage;
      }

      setData(mockData);
      setLastUpdate(new Date());
      mark('data-fetch-complete');
      
      logger.info('Dashboard data refreshed', { timestamp: new Date() });
    } catch (error) {
      logger.error('Failed to fetch dashboard data', error as Error);
    } finally {
      setLoading(false);
    }
  }, [mark]);

  // 自動更新
  React.useEffect(() => {
    fetchDashboardData();
    
    const interval = setInterval(fetchDashboardData, 30000); // 30秒ごと
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // 手動更新
  const handleRefresh = () => {
    setLoading(true);
    fetchDashboardData();
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <LoadingSpinner size="lg" showLabel label="監視データを読み込んでいます..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">システム監視ダッシュボード</h1>
              <p className="text-gray-600 mt-2">
                最終更新: {lastUpdate.toLocaleString('ja-JP')}
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '更新中...' : '更新'}
            </button>
          </div>
        </div>

        {data && (
          <div className="space-y-6">
            {/* パフォーマンス指標 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-600">
                    ページ読み込み時間
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {data.performance.pageLoadTime?.toFixed(0) || 'N/A'}ms
                  </div>
                  <div className={`text-sm ${(data.performance.pageLoadTime || 0) > 1000 ? 'text-red-600' : 'text-green-600'}`}>
                    {(data.performance.pageLoadTime || 0) > 1000 ? '改善が必要' : '良好'}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-600">
                    メモリ使用量
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {data.performance.memoryUsage?.toFixed(1) || 'N/A'}MB
                  </div>
                  <div className={`text-sm ${(data.performance.memoryUsage || 0) > 100 ? 'text-red-600' : 'text-green-600'}`}>
                    {(data.performance.memoryUsage || 0) > 100 ? '高使用量' : '正常'}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-600">
                    エラー数（24時間）
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {data.performance.errorCount}
                  </div>
                  <div className={`text-sm ${data.performance.errorCount > 10 ? 'text-red-600' : 'text-green-600'}`}>
                    {data.performance.errorCount > 10 ? '要注意' : '正常'}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-600">
                    アクティブユーザー
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {data.performance.activeUsers}
                  </div>
                  <div className="text-sm text-blue-600">
                    現在オンライン
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 統合ヘルス状態 */}
            {data.health && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>システム統合ヘルス状態</span>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      data.health.overall === 'healthy' ? 'bg-green-100 text-green-800' :
                      data.health.overall === 'degraded' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {data.health.overall === 'healthy' ? '正常' :
                       data.health.overall === 'degraded' ? '劣化' : '異常'}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {Object.entries(data.health.services).map(([service, status]) => (
                      <div key={service} className="text-center">
                        <div className={`w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center ${
                          status === 'operational' ? 'bg-green-100' :
                          status === 'degraded' ? 'bg-yellow-100' : 'bg-red-100'
                        }`}>
                          <div className={`w-4 h-4 rounded-full ${
                            status === 'operational' ? 'bg-green-500' :
                            status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                          }`} />
                        </div>
                        <div className="text-xs font-medium text-gray-700 capitalize">
                          {service === 'database' ? 'DB' : service}
                        </div>
                        <div className="text-xs text-gray-500">
                          {status === 'operational' ? '正常' :
                           status === 'degraded' ? '劣化' : 'ダウン'}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {data.health.alerts && data.health.alerts.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">アクティブアラート</h4>
                      <div className="space-y-2">
                        {data.health.alerts.map((alert, index) => (
                          <div key={index} className={`p-3 rounded-lg ${
                            alert.severity === 'critical' ? 'bg-red-50 border border-red-200' :
                            'bg-yellow-50 border border-yellow-200'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-medium">
                                {alert.type.replace(/_/g, ' ').toUpperCase()}
                              </div>
                              <div className={`text-xs px-2 py-1 rounded ${
                                alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {alert.severity === 'critical' ? 'クリティカル' : '警告'}
                              </div>
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {alert.message}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-blue-600">
                          {data.health.metrics.webhookHealthScore.toFixed(0)}%
                        </div>
                        <div className="text-xs text-gray-500">Webhook健全性</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-purple-600">
                          {data.health.metrics.errorRate.toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-500">エラー/時</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-green-600">
                          {data.health.metrics.responseTimeP95.toFixed(0)}ms
                        </div>
                        <div className="text-xs text-gray-500">P95応答時間</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-indigo-600">
                          {data.health.metrics.uptimePercentage.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-500">稼働率</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* システム状態 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>システム稼働率</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {data.system.uptime}%
                  </div>
                  <div className="text-sm text-gray-600 mt-2">
                    過去30日間の平均稼働率
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>平均応答時間</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    {data.system.responseTime.toFixed(0)}ms
                  </div>
                  <div className="text-sm text-gray-600 mt-2">
                    API レスポンス時間
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>スループット</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">
                    {data.system.throughput.toFixed(0)}
                  </div>
                  <div className="text-sm text-gray-600 mt-2">
                    リクエスト/分
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* エラー分析 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>最近のエラー</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.errors.recent.length > 0 ? (
                      data.errors.recent.map((error, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                          <div>
                            <div className="font-medium text-red-800">
                              {error.category}
                            </div>
                            <div className="text-sm text-red-600">
                              {error.message}
                            </div>
                            <div className="text-xs text-gray-500">
                              {error.timestamp.toLocaleTimeString('ja-JP')}
                            </div>
                          </div>
                          <div className="text-lg font-bold text-red-600">
                            {error.count}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        最近のエラーはありません
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>エラーカテゴリ別統計</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(data.errors.byCategory).map(([category, count]) => (
                      <div key={category} className="flex items-center justify-between">
                        <div className="text-sm font-medium text-gray-700">
                          {category}
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="text-sm font-bold text-gray-900">
                            {count}
                          </div>
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-red-500 h-2 rounded-full"
                              style={{ 
                                width: `${Math.min((count / 10) * 100, 100)}%` 
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    {Object.keys(data.errors.byCategory).length === 0 && (
                      <div className="text-center py-4 text-gray-500">
                        エラー統計データがありません
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* アクションボタン */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => {
                  // 詳細ログの表示
                  logger.info('User accessed detailed logs', { userId: 'admin' });
                  alert('詳細ログ機能は実装予定です');
                }}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                詳細ログを表示
              </button>
              <button
                onClick={() => {
                  // アラート設定
                  logger.info('User accessed alert settings', { userId: 'admin' });
                  alert('アラート設定機能は実装予定です');
                }}
                className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              >
                アラート設定
              </button>
              <button
                onClick={() => {
                  // レポート生成
                  logger.info('User requested monitoring report', { userId: 'admin' });
                  alert('レポート機能は実装予定です');
                }}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                レポート生成
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}