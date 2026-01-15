/**
 * Phase 4 - ErrorBoundary連携監視システム
 * Reactアプリケーション全体のエラー境界コンポーネント
 * 
 * 🔍 【監視機能】グループ: ErrorBoundary監視システム
 * 📊 使用場面: 全ページ共通のエラーハンドリングとモニタリング
 * 🔧 関連ファイル:
 *   - src/components/admin/error-log-viewer.tsx (管理画面)
 *   - src/app/api/log/error/route.ts (ログ収集API)
 * ⚡ 監視連携: /api/log/error への自動エラー送信機能内蔵
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '@/lib/log';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // エラーが発生したら state を更新してフォールバック UI を表示
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // エラーをログに記録
    logger.error('AppErrorBoundary caught an error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    // Phase 4: 監視システムへのエラー送信
    this.sendErrorToMonitoring(error, errorInfo);

    // 開発環境ではコンソールにも出力
    if (process.env.NODE_ENV === 'development') {
      logger.error('AppErrorBoundary Error:', { data: error });
      logger.error('Component Stack:', { data: errorInfo.componentStack });
    }
  }

  // Phase 4: エラー監視システムへの送信
  private async sendErrorToMonitoring(error: Error, errorInfo: ErrorInfo): Promise<void> {
    try {
      // エラーデータの構築
      const errorData = {
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
          componentStack: errorInfo.componentStack
        },
        context: {
          url: typeof window !== 'undefined' ? window.location.href : 'unknown',
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
          component: 'AppErrorBoundary',
          timestamp: new Date().toISOString()
        },
        severity: 'HIGH', // ErrorBoundaryでキャッチされたエラーは重要度高
        type: 'CLIENT'
      };

      // 監視システムへの送信（非同期・失敗してもメインフローに影響しない）
      if (typeof window !== 'undefined') {
        fetch('/api/log/error', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(errorData),
        }).catch(fetchError => {
          // 監視システムへの送信失敗はサイレントに処理
          logger.warn('Failed to send error to monitoring system:', { data: fetchError });
        });
      }

    } catch (monitoringError) {
      // 監視システム自体でエラーが発生してもメインエラーハンドリングに影響させない
      logger.warn('Error monitoring system failed:', { data: monitoringError });
    }
  }

  render() {
    if (this.state.hasError) {
      // カスタムフォールバック UI がある場合はそれを使用
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // デフォルトのエラー UI
      return (
        <div className="min-h-screen bg-[var(--aio-page-bg, #f3f4f6)] flex items-center justify-center p-6">
          <div className="glass-card backdrop-blur-sm rounded-3xl border border-red-200 p-8 max-w-md w-full spring-bounce">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                問題が発生しました
              </h2>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                AIOHubで問題が発生しました。<br />
                再読み込みするか、数分後にもう一度お試しください。
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-[var(--aio-primary)] hover:bg-[var(--aio-primary-hover)] text-[var(--text-on-primary)] font-medium py-3 px-6 rounded-xl transition-colors duration-200 spring-bounce"
                >
                  ページを再読み込み
                </button>
                
                <button
                  onClick={() => this.setState({ hasError: false })}
                  className="w-full bg-[var(--aio-surface)] hover:bg-[var(--aio-muted)] text-[var(--text-primary)] border border-[var(--border-light)] font-medium py-3 px-6 rounded-xl transition-colors duration-200 spring-bounce"
                >
                  もう一度試す
                </button>
              </div>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-6 text-left">
                  <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                    開発者向け詳細情報
                  </summary>
                  <div className="mt-2 p-4 bg-gray-100 rounded-lg text-xs font-mono text-gray-800 overflow-auto max-h-32">
                    <p className="font-semibold mb-2">Error: {this.state.error.message}</p>
                    <pre className="whitespace-pre-wrap">{this.state.error.stack}</pre>
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook版のエラー境界（関数コンポーネント用）
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WrappedComponent(props: P) {
    return (
      <AppErrorBoundary fallback={fallback}>
        <Component {...props} />
      </AppErrorBoundary>
    );
  };
}

export default AppErrorBoundary;