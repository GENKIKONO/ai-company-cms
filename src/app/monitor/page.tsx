'use client';

import { useState, useEffect } from 'react';

interface MonitorData {
  timestamp: string;
  responseTime: number;
  status: 'healthy' | 'degraded' | 'down' | 'error';
  checks: {
    supabase: CheckResult;
    stripe: CheckResult;
    resend: CheckResult;
    system: CheckResult;
  };
}

interface CheckResult {
  healthy: boolean;
  status: string;
  message: string;
}

export default function MonitorPage() {
  const [data, setData] = useState<MonitorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  const fetchMonitorData = async () => {
    try {
      const response = await fetch('/api/monitor');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const result = await response.json();
      setData(result);
      setLastUpdate(new Date().toLocaleTimeString());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitorData();
    const interval = setInterval(fetchMonitorData, 30000); // 30秒ごとに更新
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50 border-green-200';
      case 'degraded': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'down': return 'text-red-600 bg-red-50 border-red-200';
      case 'error': return 'text-purple-600 bg-purple-50 border-purple-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusEmoji = (healthy: boolean) => {
    return healthy ? '✅' : '❌';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">監視データを読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🔍 Production Monitor</h1>
              <p className="text-gray-600 mt-2">AIoHub システム監視ダッシュボード</p>
            </div>
            <div className="text-right">
              <button
                onClick={fetchMonitorData}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                🔄 更新
              </button>
              {lastUpdate && (
                <p className="text-sm text-gray-500 mt-1">最終更新: {lastUpdate}</p>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">❌ エラー: {error}</p>
          </div>
        )}

        {data && (
          <>
            {/* Overall Status */}
            <div className={`mb-6 p-6 rounded-lg border-2 ${getStatusColor(data.status)}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">
                    システム全体: {data.status.toUpperCase()}
                  </h2>
                  <p className="text-sm opacity-75 mt-1">
                    応答時間: {data.responseTime}ms | 
                    生成時刻: {new Date(data.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="text-4xl">
                  {data.status === 'healthy' ? '✅' : 
                   data.status === 'degraded' ? '⚠️' : 
                   data.status === 'down' ? '❌' : '💥'}
                </div>
              </div>
            </div>

            {/* Service Status Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {Object.entries(data.checks).map(([service, check]) => (
                <div
                  key={service}
                  className={`p-6 rounded-lg border-2 transition-all hover:shadow-md ${
                    check.healthy 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 capitalize">
                      {service === 'supabase' ? 'Database' :
                       service === 'stripe' ? 'Payments' :
                       service === 'resend' ? 'Email' :
                       service === 'system' ? 'System' : service}
                    </h3>
                    <span className="text-2xl">{getStatusEmoji(check.healthy)}</span>
                  </div>
                  <p className={`text-sm ${check.healthy ? 'text-green-700' : 'text-red-700'}`}>
                    ステータス: {check.status}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">{check.message}</p>
                </div>
              ))}
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🔗 クイックアクセス</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <a
                  href="https://aiohub.jp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 border rounded-md hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium">🏠 メインサイト</div>
                  <div className="text-sm text-gray-600">aiohub.jp</div>
                </a>
                <a
                  href="/api/health"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 border rounded-md hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium">🩺 ヘルスAPI</div>
                  <div className="text-sm text-gray-600">/api/health</div>
                </a>
                <a
                  href="/api/monitor?format=markdown"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 border rounded-md hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium">📄 レポート</div>
                  <div className="text-sm text-gray-600">Markdown形式</div>
                </a>
              </div>
            </div>

            {/* Technical Details */}
            <div className="mt-6 bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🔧 技術詳細</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="font-medium text-gray-700">データベース</div>
                  <div className="text-gray-600">Supabase PostgreSQL</div>
                </div>
                <div>
                  <div className="font-medium text-gray-700">決済システム</div>
                  <div className="text-gray-600">Stripe API</div>
                </div>
                <div>
                  <div className="font-medium text-gray-700">メール配信</div>
                  <div className="text-gray-600">Resend API</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}