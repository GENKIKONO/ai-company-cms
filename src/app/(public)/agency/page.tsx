/**
 * Agency Dashboard Page
 * 代理店ダッシュボード（将来実装）
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Agency Dashboard - AIOHub',
  description: '代理店ダッシュボード',
};

export default function AgencyDashboardPage() {
  // TODO: Phase 2で実装予定
  // - 代理店認証チェック
  // - 配下顧客一覧表示
  // - 売上レポート
  // - 顧客管理機能

  return (
    <div className="min-h-screen bg-[var(--aio-background)] flex items-center justify-center">
      <div className="max-w-md w-full mx-auto p-6">
        <div className="bg-[var(--aio-surface)] rounded-lg border border-[var(--aio-border)] p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto h-16 w-16 rounded-full bg-[var(--aio-primary)] bg-opacity-10 flex items-center justify-center">
              <svg className="h-8 w-8 text-[var(--aio-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          
          <h1 className="text-xl font-semibold text-[var(--aio-text)] mb-2">
            Agency Dashboard
          </h1>
          
          <p className="text-sm text-[var(--aio-text-muted)] mb-6">
            代理店管理機能は準備中です
          </p>
          
          <div className="space-y-4 text-left">
            <div className="bg-[var(--aio-surface-secondary)] rounded-md p-3">
              <h3 className="text-sm font-medium text-[var(--aio-text)] mb-1">
                Phase 2で実装予定
              </h3>
              <ul className="text-xs text-[var(--aio-text-muted)] space-y-1">
                <li>• 配下顧客管理</li>
                <li>• 売上レポート</li>
                <li>• プラン管理</li>
                <li>• 課金設定</li>
              </ul>
            </div>
            
            <div className="bg-[var(--aio-warning)] bg-opacity-10 border border-[var(--aio-warning)] border-opacity-20 rounded-md p-3">
              <p className="text-xs text-[var(--aio-text)]">
                <strong>権限が必要です:</strong> 代理店アカウントでのログインが必要です
              </p>
            </div>
          </div>
          
          <div className="mt-6">
            <a
              href="/admin"
              className="inline-flex items-center px-4 py-2 border border-[var(--aio-border)] rounded-md text-sm font-medium text-[var(--aio-text)] bg-[var(--aio-surface)] hover:bg-[var(--aio-surface-secondary)] transition-colors"
            >
              管理画面に戻る
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}