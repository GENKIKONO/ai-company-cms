/**
 * Phase 4 - ErrorBoundary連携監視システム
 * 開発者向けエラーログビューアコンポーネント
 * 
 * 🔍 【監視機能】グループ: ErrorBoundary監視システム
 * 📊 使用場面: 開発環境でのフロントエンドエラー監視ダッシュボード
 * 🔧 関連ファイル: 
 *   - src/components/common/AppErrorBoundary.tsx (エラー捕捉)
 *   - src/app/api/log/error/route.ts (エラーログAPI)
 * ⚡ アクセス制限: 開発環境のみ利用可能
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { ErrorType, ErrorSeverity } from '@/lib/error-handling';

import { logger } from '@/lib/log';
// エラーログエントリの型定義
interface ErrorLogEntry {
  id: string;
  timestamp: string;
  error: {
    message: string;
    stack?: string;
    componentStack?: string;
    name?: string;
  };
  context: {
    url: string;
    userAgent?: string;
    userId?: string;
    sessionId?: string;
    component?: string;
  };
  severity: ErrorSeverity;
  type: ErrorType;
  buildInfo?: {
    version?: string;
    commit?: string;
  };
}

// 重要度によるカラーマッピング
const severityColors = {
  [ErrorSeverity.LOW]: 'bg-blue-50 text-blue-800 border-blue-200',
  [ErrorSeverity.MEDIUM]: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  [ErrorSeverity.HIGH]: 'bg-orange-50 text-orange-800 border-orange-200',
  [ErrorSeverity.CRITICAL]: 'bg-red-50 text-red-800 border-red-200'
};

const severityIcons = {
  [ErrorSeverity.LOW]: 'ℹ️',
  [ErrorSeverity.MEDIUM]: '⚠️',
  [ErrorSeverity.HIGH]: '🔥',
  [ErrorSeverity.CRITICAL]: '🚨'
};

export default function ErrorLogViewer() {
  const [errorLogs, setErrorLogs] = useState<ErrorLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedError, setSelectedError] = useState<ErrorLogEntry | null>(null);
  const [filter, setFilter] = useState<{
    severity?: ErrorSeverity;
    type?: ErrorType;
    timeRange?: 'hour' | 'day' | 'week';
  }>({});

  // 開発環境チェック
  const isDevelopment = process.env.NODE_ENV === 'development';

  const loadErrorLogs = useCallback(async () => {
    try {
      setIsLoading(true);

      // Phase 4基礎実装: 模擬データ
      // 本来は実際のAPIエンドポイントからデータを取得
      const mockErrorLogs: ErrorLogEntry[] = [
        {
          id: '1',
          timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5分前
          error: {
            name: 'TypeError',
            message: 'Cannot read property \'map\' of undefined',
            stack: 'TypeError: Cannot read property \'map\' of undefined\n    at Component.render',
            componentStack: 'in Component\n    in div\n    in App'
          },
          context: {
            url: '/dashboard',
            component: 'DashboardStats',
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
          },
          severity: ErrorSeverity.HIGH,
          type: ErrorType.CLIENT,
          buildInfo: {
            version: '1.0.0',
            commit: 'abc123'
          }
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15分前
          error: {
            name: 'ChunkLoadError',
            message: 'Loading chunk 2 failed',
            stack: 'ChunkLoadError: Loading chunk 2 failed.'
          },
          context: {
            url: '/pricing',
            component: 'PricingTable'
          },
          severity: ErrorSeverity.MEDIUM,
          type: ErrorType.NETWORK
        }
      ];

      // フィルタリング適用
      let filteredLogs = mockErrorLogs;
      if (filter.severity) {
        filteredLogs = filteredLogs.filter(log => log.severity === filter.severity);
      }
      if (filter.type) {
        filteredLogs = filteredLogs.filter(log => log.type === filter.type);
      }

      setErrorLogs(filteredLogs);
    } catch (error) {
      logger.error('Failed to load error logs:', { data: error });
    } finally {
      setIsLoading(false);
    }
  }, [filter.severity, filter.type]);

  useEffect(() => {
    if (!isDevelopment) return;

    // 模擬データでのデモンストレーション（Phase 4基礎実装）
    // 実際の実装では /api/log/error からデータを取得
    loadErrorLogs();
  }, [loadErrorLogs, isDevelopment]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    return date.toLocaleDateString();
  };

  // 開発環境以外では表示しない
  if (!isDevelopment) {
    return (
      <div className="glass-card backdrop-blur-sm rounded-3xl p-8 m-4 max-w-lg mx-auto text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          🔒 エラーログビューア
        </h3>
        <p className="text-gray-600">
          エラーログビューアは開発環境でのみ利用可能です。
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="glass-card backdrop-blur-sm rounded-3xl border border-gray-200/60 p-6">
        {/* ヘッダー */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            🔍 ErrorBoundary監視システム
          </h2>
          <p className="text-gray-600">
            Phase 4 - フロントエンドエラー監視ダッシュボード（開発環境）
          </p>
        </div>

        {/* フィルタ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <select
            value={filter.severity || ''}
            onChange={(e) => setFilter({ ...filter, severity: e.target.value as ErrorSeverity || undefined })}
            className="form-select rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
          >
            <option value="">すべての重要度</option>
            <option value={ErrorSeverity.CRITICAL}>🚨 Critical</option>
            <option value={ErrorSeverity.HIGH}>🔥 High</option>
            <option value={ErrorSeverity.MEDIUM}>⚠️ Medium</option>
            <option value={ErrorSeverity.LOW}>ℹ️ Low</option>
          </select>

          <select
            value={filter.type || ''}
            onChange={(e) => setFilter({ ...filter, type: e.target.value as ErrorType || undefined })}
            className="form-select rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
          >
            <option value="">すべてのタイプ</option>
            <option value={ErrorType.CLIENT}>Client</option>
            <option value={ErrorType.NETWORK}>Network</option>
            <option value={ErrorType.AUTHENTICATION}>Authentication</option>
            <option value={ErrorType.VALIDATION}>Validation</option>
          </select>

          <button
            onClick={loadErrorLogs}
            className="bg-[var(--aio-primary)] hover:bg-[var(--aio-primary-hover)] text-white px-4 py-2 rounded-lg transition-colors duration-200"
          >
            🔄 更新
          </button>
        </div>

        {/* エラーログリスト */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--aio-primary)]"></div>
              <p className="mt-2 text-gray-600">ログを読み込み中...</p>
            </div>
          ) : errorLogs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">エラーログが見つかりませんでした。</p>
            </div>
          ) : (
            errorLogs.map((log) => (
              <div
                key={log.id}
                className={`faq-surface-card border-l-4 ${severityColors[log.severity]} cursor-pointer spring-bounce transition-all duration-200 hover:shadow-lg`}
                onClick={() => setSelectedError(selectedError?.id === log.id ? null : log)}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-lg">{severityIcons[log.severity]}</span>
                        <span className="font-semibold text-gray-900">
                          {log.error.name || 'Error'}
                        </span>
                        <span className="text-sm text-gray-500">
                          {log.type}
                        </span>
                      </div>
                      <p className="text-gray-800 mb-2">
                        {log.error.message}
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <span>📍 {log.context.component || 'Unknown component'}</span>
                        <span>🌐 {new URL(log.context.url).pathname}</span>
                        <span>⏰ {formatTimestamp(log.timestamp)}</span>
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                      {selectedError?.id === log.id ? '▼' : '▶'}
                    </button>
                  </div>

                  {/* 詳細情報（展開時） */}
                  {selectedError?.id === log.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">スタックトレース</h4>
                          <pre className="bg-gray-100 rounded-lg p-3 text-xs overflow-auto max-h-48">
                            {log.error.stack || 'スタックトレースなし'}
                          </pre>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">コンポーネントスタック</h4>
                          <pre className="bg-gray-100 rounded-lg p-3 text-xs overflow-auto max-h-48">
                            {log.error.componentStack || 'コンポーネントスタックなし'}
                          </pre>
                        </div>
                      </div>

                      <div className="mt-4">
                        <h4 className="font-semibold text-gray-900 mb-2">コンテキスト情報</h4>
                        <div className="bg-gray-50 rounded-lg p-3 text-sm">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div><strong>URL:</strong> {log.context.url}</div>
                            <div><strong>ユーザーエージェント:</strong> {log.context.userAgent || 'Unknown'}</div>
                            <div><strong>タイムスタンプ:</strong> {new Date(log.timestamp).toLocaleString()}</div>
                            {log.buildInfo?.version && (
                              <div><strong>バージョン:</strong> {log.buildInfo.version}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* フッター情報 */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
          <p>
            🔧 Phase 4 ErrorBoundary監視システム - 開発環境専用
          </p>
          <p className="mt-1">
            エラーは /api/log/error エンドポイントに自動送信されます
          </p>
        </div>
      </div>
    </div>
  );
}