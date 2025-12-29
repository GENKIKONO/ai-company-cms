/**
 * @deprecated このファイルはレガシーです。
 * 正本は @/lib/core/error-boundary を使用してください。
 *
 * 移行方法:
 * - import { ErrorBoundary } from '@/components/ErrorBoundary'
 * + import { ErrorBoundary } from '@/lib/core/error-boundary'
 *
 * このファイルは後方互換性のため残存していますが、
 * 新規コードでの使用は禁止です。
 */
'use client';

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { errorMonitor, ErrorCategory, logger } from '@/lib/monitoring';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  category?: ErrorCategory;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorId?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = this.state.errorId || 'unknown';
    
    // エラー監視システムに送信
    errorMonitor.captureError(error, {
      errorId,
      category: this.props.category || ErrorCategory.SYSTEM,
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });

    // 詳細ログ記録
    logger.error('ErrorBoundary caught an error', {
      error,
      errorId,
      componentStack: errorInfo.componentStack,
      props: this.props,
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorId: undefined });
  };

  handleReportError = () => {
    if (this.state.error) {
      const userDescription = prompt('エラーが発生した時の状況を教えてください（任意）:');
      
      logger.info('User reported error', {
        errorMessage: this.state.error.message,
        userDescription: userDescription || 'No description provided',
        errorId: this.state.errorId,
        userAgent: navigator.userAgent,
        url: window.location.href,
      });

      alert('エラー報告をありがとうございます。開発チームが調査いたします。');
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <ExclamationTriangleIcon className="mx-auto h-16 w-16 text-red-500" />
              <h2 className="mt-6 text-3xl font-bold text-gray-900">
                エラーが発生しました
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                申し訳ございません。予期しないエラーが発生しました。
              </p>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md text-left">
                  <h3 className="text-sm font-medium text-red-800 mb-2">
                    Development Error Details:
                  </h3>
                  <p className="text-xs text-red-700 font-mono">
                    {this.state.error.message}
                  </p>
                  {this.state.error.stack && (
                    <pre className="mt-2 text-xs text-red-600 overflow-auto max-h-32">
                      {this.state.error.stack}
                    </pre>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <button
                onClick={this.handleRetry}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                再試行
              </button>

              <button
                onClick={this.handleReportError}
                className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                エラーを報告
              </button>

              <button
                onClick={() => window.location.href = '/'}
                className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                ホームに戻る
              </button>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                Error ID: {this.state.errorId}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                問題が続く場合は、サポートチームにお問い合わせください。
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Simpler functional error boundary for specific components
interface SimpleErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
}

export function SimpleErrorBoundary({ 
  children, 
  fallback,
  componentName = 'Unknown Component'
}: SimpleErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={
        fallback || (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error in {componentName}
                </h3>
                <p className="mt-1 text-sm text-red-700">
                  This component encountered an error and couldn't render properly.
                </p>
              </div>
            </div>
          </div>
        )
      }
      onError={(error, errorInfo) => {
        // errorMonitoring.captureException(error, {
        //   component: componentName,
        //   action: 'simple_error_boundary',
        //   metadata: {
        //     componentStack: errorInfo.componentStack || '',
        //   },
        // });
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

export default ErrorBoundary;