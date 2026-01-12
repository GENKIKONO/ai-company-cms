/**
 * Dashboard専用エラーバウンダリ
 * - Supabaseエラーに特化した処理
 * - レイアウト（サイドバー）を維持したままエラー表示
 * - 標準化されたエラーメッセージ
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '@/lib/log';
import { isStandardError, type StandardError } from '@/lib/error-mapping';
import { HIGButton } from '@/design-system';

// アクション種別の一元管理
type ActionKind = 'login' | 'back' | 'reload' | 'retry';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: StandardError | Error;
}

export class DashboardErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logger.error('DashboardErrorBoundary caught an error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    // エラー監視システムへの送信
    this.sendErrorToMonitoring(error, errorInfo);
  }

  private async sendErrorToMonitoring(error: Error, errorInfo: ErrorInfo): Promise<void> {
    try {
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
          component: 'DashboardErrorBoundary',
          timestamp: new Date().toISOString()
        },
        severity: 'HIGH',
        type: 'CLIENT'
      };

      if (typeof window !== 'undefined') {
        fetch('/api/log/error', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(errorData),
        }).catch(fetchError => {
          logger.warn('Failed to send error to monitoring system:', { data: fetchError });
        });
      }
    } catch (monitoringError) {
      logger.warn('Error monitoring system failed:', { data: monitoringError });
    }
  }

  private getErrorDisplay(error: StandardError | Error): {
    title: string;
    message: string;
    showDetails: boolean;
    details?: string;
    action: ActionKind;
  } {
    if (isStandardError(error)) {
      return {
        title: this.getErrorTitle(error.status),
        message: error.message,
        showDetails: error.status >= 500,
        details: error.details,
        action: this.getErrorAction(error.status)
      };
    }

    return {
      title: 'システムエラー',
      message: 'システムエラーが発生しました。しばらく後に再度お試しください。',
      showDetails: process.env.NODE_ENV === 'development',
      details: error.message,
      action: 'reload'
    };
  }

  private getErrorTitle(status: number): string {
    switch (status) {
      case 401:
        return 'ログインが必要です';
      case 403:
        return 'アクセス権限がありません';
      case 404:
        return 'ページが見つかりません';
      case 409:
        return 'データの競合が発生しました';
      case 422:
        return '入力データに問題があります';
      default:
        return 'システムエラー';
    }
  }

  private getErrorAction(status: number): ActionKind {
    switch (status) {
      case 401:
        return 'login';
      case 403:
      case 404:
        return 'back';
      case 409:
      case 422:
        return 'retry';
      default:
        return 'reload';
    }
  }

  private handleAction(action: ActionKind) {
    switch (action) {
      case 'login':
        window.location.href = '/auth/login';
        break;
      case 'back':
        window.history.back();
        break;
      case 'reload':
        window.location.reload();
        break;
      case 'retry':
        this.setState({ hasError: false });
        break;
    }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // カスタムフォールバック UI がある場合はそれを使用
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorDisplay = this.getErrorDisplay(this.state.error);

      // ダッシュボード内でのエラー表示（レイアウト維持）
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="glass-card backdrop-blur-sm rounded-3xl border border-[var(--status-error)] p-8 max-w-md w-full spring-bounce">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-[var(--aio-danger-muted)] rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 text-[var(--aio-danger)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>

              <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">
                {errorDisplay.title}
              </h2>

              <p className="text-[var(--color-text-secondary)] mb-6 leading-relaxed">
                {errorDisplay.message}
              </p>
              
              <div className="space-y-3">
                <HIGButton
                  onClick={() => this.handleAction(errorDisplay.action)}
                  className="w-full"
                  variant="primary"
                >
                  {this.getActionLabel(errorDisplay.action)}
                </HIGButton>
                
                {errorDisplay.action !== 'retry' && (
                  <HIGButton
                    onClick={() => this.setState({ hasError: false })}
                    className="w-full"
                    variant="secondary"
                  >
                    もう一度試す
                  </HIGButton>
                )}
              </div>
              
              {errorDisplay.showDetails && errorDisplay.details && (
                <details className="mt-6 text-left">
                  <summary className="text-sm text-[var(--color-text-tertiary)] cursor-pointer hover:text-[var(--color-text-secondary)]">
                    詳細情報
                  </summary>
                  <div className="mt-2 p-4 bg-[var(--aio-surface)] rounded-lg text-xs font-mono text-[var(--color-text-primary)] overflow-auto max-h-32">
                    <pre className="whitespace-pre-wrap">{errorDisplay.details}</pre>
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

  private getActionLabel(action: ActionKind): string {
    switch (action) {
      case 'login':
        return 'ログインページへ';
      case 'back':
        return '前のページに戻る';
      case 'reload':
        return 'ページを再読み込み';
      case 'retry':
        return 'もう一度試す';
    }
  }
}

// Hook版のエラー境界（関数コンポーネント用）
export function withDashboardErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WrappedComponent(props: P) {
    return (
      <DashboardErrorBoundary fallback={fallback}>
        <Component {...props} />
      </DashboardErrorBoundary>
    );
  };
}

export default DashboardErrorBoundary;