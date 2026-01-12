'use client';

import { ReactNode } from 'react';
import Link from 'next/link';

interface RequireOrganizationProps {
  organization?: any;
  children: ReactNode;
  loading?: boolean;
  error?: string;
}

export function RequireOrganization({ 
  organization, 
  children, 
  loading = false, 
  error 
}: RequireOrganizationProps) {
  // ローディング中
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--aio-surface)] flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-[var(--dashboard-card-border)] rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-[var(--dashboard-card-border)] rounded w-full mb-2"></div>
            <div className="h-4 bg-[var(--dashboard-card-border)] rounded w-2/3 mb-4"></div>
            <div className="h-10 bg-[var(--dashboard-card-border)] rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  // エラーまたは組織が見つからない場合
  if (error || !organization?.id) {
    return (
      <div className="min-h-screen bg-[var(--aio-surface)] flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-[var(--aio-warning-muted)] mb-4">
              <svg className="h-6 w-6 text-[var(--aio-warning)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
              {error ? 'エラーが発生しました' : '企業が見つかりません'}
            </h2>
            
            <p className="text-sm text-[var(--color-text-secondary)] mb-6">
              {error 
                ? 'データの取得中にエラーが発生しました。しばらく待ってから再度お試しください。'
                : 'ダッシュボードを使用するには、まず企業を作成してください。作成完了後、その他の機能が順次有効になります。'
              }
            </p>

            {error ? (
              <div className="space-y-3">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-[var(--aio-primary)] hover:bg-[var(--aio-primary-hover)] text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  再読み込み
                </button>
                <Link
                  href="/dashboard"
                  className="block w-full bg-[var(--aio-surface)] hover:bg-[var(--dashboard-card-border)] text-[var(--color-text-secondary)] font-medium py-2 px-4 rounded-md text-center transition-colors"
                >
                  ダッシュボードに戻る
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <Link
                  href="/organizations/new"
                  className="block w-full bg-[var(--aio-primary)] hover:bg-[var(--aio-primary-hover)] text-white font-medium py-2 px-4 rounded-md text-center transition-colors"
                >
                  企業を作成する
                </Link>
                <Link
                  href="/auth/logout"
                  className="block w-full bg-[var(--aio-surface)] hover:bg-[var(--dashboard-card-border)] text-[var(--color-text-secondary)] font-medium py-2 px-4 rounded-md text-center transition-colors"
                >
                  ログアウト
                </Link>
              </div>
            )}

            {!error && (
              <div className="mt-6 pt-6 border-t border-[var(--dashboard-card-border)]">
                <div className="text-xs text-[var(--color-text-tertiary)]">
                  <p className="mb-2">企業作成後に利用可能になる機能：</p>
                  <ul className="text-left space-y-1">
                    <li>• サービス管理</li>
                    <li>• 記事投稿（ベーシック以上）</li>
                    <li>• 導入事例作成</li>
                    <li>• FAQ管理</li>
                    <li>• データエクスポート</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 組織が存在する場合は子コンポーネントを表示
  return <>{children}</>;
}