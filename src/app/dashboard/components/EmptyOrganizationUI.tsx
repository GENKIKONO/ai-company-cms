'use client';

/**
 * 組織未作成時のオンボーディングUI
 * NOTE: [CORE_ARCHITECTURE] DashboardPageShell の onEmptyOrganization 拡張ポイント用
 */

import Link from 'next/link';
import { BuildingIcon } from '@/components/icons/HIGIcons';
import { DashboardCard, DashboardAlert } from '@/components/dashboard/ui';
import type { AppUser } from '@/types/legacy/database';

interface EmptyOrganizationUIProps {
  user: AppUser | null;
}

export function EmptyOrganizationUI({ user }: EmptyOrganizationUIProps) {
  if (!user) return null;

  return (
    <div className="min-h-screen bg-[var(--dashboard-bg)] flex items-center justify-center">
      <DashboardCard className="max-w-lg w-full mx-4">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-[var(--status-info-bg)] rounded-full flex items-center justify-center mx-auto mb-4">
            <BuildingIcon className="w-8 h-8 text-[var(--status-info)]" aria-hidden />
          </div>
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">
            企業情報をまだ登録していません
          </h2>
          <DashboardAlert variant="info" className="text-left mb-4">
            <p className="text-sm mb-2">
              <strong>AIOHub をご利用いただくには:</strong>
            </p>
            <ul className="text-sm ml-4 space-y-1">
              <li>• 企業情報の登録が必要です</li>
              <li>• 登録は3〜5分程度で完了します</li>
              <li>• 登録後すぐにAI機能をお使いいただけます</li>
            </ul>
          </DashboardAlert>
          <p className="text-sm text-[var(--color-text-secondary)]">
            企業名、業界、基本的な情報を入力するだけで、
            <br />
            すぐにAI可視性分析を開始できます。
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/organizations/new"
            className="w-full bg-[var(--aio-primary)] hover:bg-[var(--aio-primary-hover)] text-white font-medium py-3 px-4 rounded-lg text-center block transition-colors"
            data-testid="create-organization"
          >
            企業を作成する
          </Link>

          <div className="text-center">
            <p className="text-xs text-[var(--color-text-tertiary)] mb-2">
              既に企業に招待されている場合
            </p>
            <button
              onClick={() => window.location.reload()}
              className="text-sm text-[var(--aio-primary)] hover:text-[var(--aio-primary-hover)] underline"
            >
              ページを再読み込み
            </button>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-[var(--dashboard-card-border)] text-center">
          <p className="text-xs text-[var(--color-text-secondary)]">
            ユーザーID: {user.email}
          </p>
        </div>
      </DashboardCard>
    </div>
  );
}
