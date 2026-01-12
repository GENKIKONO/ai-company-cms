'use client';

/**
 * 権限エラー時のUI
 * NOTE: [CORE_ARCHITECTURE] DashboardPageShell の onPermissionError 拡張ポイント用
 */

import Link from 'next/link';
import { LockIcon } from '@/components/icons/HIGIcons';
import { DashboardCard, DashboardAlert } from '@/components/dashboard/ui';
import type { AppUser } from '@/types/legacy/database';

interface PermissionErrorUIProps {
  user: AppUser | null;
}

export function PermissionErrorUI({ user }: PermissionErrorUIProps) {
  if (!user) return null;

  return (
    <div className="min-h-screen bg-[var(--dashboard-bg)] flex items-center justify-center">
      <DashboardCard className="max-w-lg w-full mx-4">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-[var(--status-error-bg)] rounded-full flex items-center justify-center mx-auto mb-4">
            <LockIcon className="w-8 h-8 text-[var(--status-error)]" aria-hidden />
          </div>
          <h2 className="text-xl font-semibold text-[var(--status-error)] mb-3">
            企業情報にアクセスできません
          </h2>
          <DashboardAlert variant="error" className="text-left mb-4">
            <p className="text-sm mb-2">
              <strong>問題:</strong> 企業のデータベースにアクセスする権限がありません
            </p>
            <p className="text-sm mb-2">
              <strong>考えられる原因:</strong>
            </p>
            <ul className="text-xs ml-4 space-y-1">
              <li>• 企業メンバーから除外された可能性があります</li>
              <li>• 一時的なシステムエラーの可能性があります</li>
              <li>• アカウントの設定に問題がある可能性があります</li>
            </ul>
          </DashboardAlert>
          <p className="text-sm text-[var(--color-text-secondary)]">
            企業の管理者にご連絡いただくか、
            <br />
            一度ログアウトして再度ログインをお試しください。
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-[var(--aio-primary)] hover:bg-[var(--aio-primary-hover)] text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            ページを再読み込みする
          </button>

          <Link
            href="/auth/logout"
            className="w-full bg-[var(--dashboard-card-border)] hover:bg-[var(--aio-muted)] text-[var(--color-text-primary)] font-medium py-2 px-4 rounded-lg text-center block transition-colors"
          >
            ログアウトして再度ログイン
          </Link>
        </div>

        <div className="mt-6 pt-4 border-t border-[var(--dashboard-card-border)] text-center">
          <p className="text-xs text-[var(--color-text-secondary)]">
            ログインユーザー: {user.email}
          </p>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
            問題が解決しない場合は、このメールアドレスを管理者にお伝えください
          </p>
        </div>
      </DashboardCard>
    </div>
  );
}
