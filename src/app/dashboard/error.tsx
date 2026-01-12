'use client';

/**
 * Dashboard Error Boundary
 * サイドナビの骨格を維持したまま、エラーメッセージを表示
 * reset()でページ状態をリセットして再試行可能
 */

import { useEffect } from 'react';
import { logger } from '@/lib/log';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // エラーをログに記録
    logger.error('Dashboard error boundary triggered', {
      error: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-[var(--status-error)] p-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-[var(--aio-danger-muted)] rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-[var(--aio-danger)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>

          <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
            ページの読み込みに失敗しました
          </h2>

          <p className="text-[var(--color-text-secondary)] mb-6">
            一時的なエラーが発生しました。もう一度お試しください。
          </p>

          <div className="flex justify-center space-x-4">
            <button
              onClick={reset}
              className="bg-[var(--aio-primary)] hover:bg-[var(--aio-primary-hover)] text-white font-medium py-2 px-6 rounded-lg transition-colors"
            >
              再試行
            </button>

            <button
              onClick={() => window.location.href = '/dashboard'}
              className="bg-[var(--aio-surface)] hover:bg-[var(--dashboard-card-border)] text-[var(--color-text-secondary)] font-medium py-2 px-6 rounded-lg transition-colors"
            >
              ダッシュボードに戻る
            </button>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <details className="mt-6 text-left max-w-lg mx-auto">
              <summary className="text-sm text-[var(--color-text-tertiary)] cursor-pointer hover:text-[var(--color-text-secondary)]">
                エラー詳細 (開発モード)
              </summary>
              <pre className="mt-2 p-4 bg-[var(--aio-surface)] rounded-lg text-xs font-mono text-[var(--color-text-primary)] overflow-auto max-h-32 whitespace-pre-wrap">
                {error.message}
                {error.stack && `\n\n${error.stack}`}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
