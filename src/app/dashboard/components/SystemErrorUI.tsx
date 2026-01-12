'use client';

/**
 * システムエラー時のUI
 * NOTE: [CORE_ARCHITECTURE] DashboardPageShell の onSystemError 拡張ポイント用
 */

import Link from 'next/link';
import { AlertTriangleIcon } from '@/components/icons/HIGIcons';
import { DashboardCard, DashboardAlert } from '@/components/dashboard/ui';
import type { AppUser } from '@/types/legacy/database';

interface SystemErrorUIProps {
  user: AppUser | null;
  requestId: string;
}

export function SystemErrorUI({ user, requestId }: SystemErrorUIProps) {
  return (
    <div className="min-h-screen bg-[var(--dashboard-bg)] flex items-center justify-center">
      <DashboardCard className="max-w-lg w-full mx-4">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-[var(--status-warning-bg)] rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangleIcon className="w-8 h-8 text-[var(--status-warning)]" aria-hidden />
          </div>
          <h2 className="text-xl font-semibold text-[var(--status-warning)] mb-3">
            データベースエラー
          </h2>
          <DashboardAlert variant="warning" className="text-left mb-4">
            <p className="text-sm mb-2">
              <strong>状況:</strong>{' '}
              組織のメンバーシップは確認できていますが、組織の詳細情報の取得中にエラーが発生しています
            </p>
            <p className="text-sm">
              <strong>対処:</strong>{' '}
              一時的なシステムエラーの可能性があります。しばらく待ってから再度お試しください
            </p>
          </DashboardAlert>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-[var(--status-warning)] hover:opacity-90 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            ページを再読み込みする
          </button>

          <Link
            href="/"
            className="w-full bg-[var(--dashboard-card-border)] hover:bg-[var(--aio-muted)] text-[var(--color-text-primary)] font-medium py-2 px-4 rounded-lg text-center block transition-colors"
          >
            ホームページに戻る
          </Link>
        </div>

        {user && (
          <div className="mt-6 pt-4 border-t border-[var(--dashboard-card-border)] text-center">
            <p className="text-xs text-[var(--color-text-secondary)]">
              ログインユーザー: {user.email}
            </p>
            <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
              エラーが継続する場合は、このメールアドレスを添えてサポートにお問い合わせください
            </p>
            <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
              リクエストID: {requestId}
            </p>
          </div>
        )}
      </DashboardCard>
    </div>
  );
}
