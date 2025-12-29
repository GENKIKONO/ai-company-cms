'use client';

/**
 * Services Info Page - 新アーキテクチャ版
 */

import Link from 'next/link';
import { PLAN_LIMITS } from '@/config/plans';
import {
  DashboardPageShell,
  useDashboardPageContext,
} from '@/components/dashboard';
import {
  DashboardPageHeader,
  DashboardCard,
  DashboardCardHeader,
  DashboardCardContent,
  DashboardButton,
} from '@/components/dashboard/ui';

// =====================================================
// MAIN PAGE
// =====================================================

export default function ServicesInfoPage() {
  return (
    <DashboardPageShell
      title="サービス紹介"
      requiredRole="viewer"
    >
      <ServicesInfoContent />
    </DashboardPageShell>
  );
}

// =====================================================
// CONTENT
// =====================================================

function ServicesInfoContent() {
  const { organization, user } = useDashboardPageContext();

  return (
    <>
      <DashboardPageHeader
        title="サービス紹介"
        description="AI Company CMSの機能とプランをご紹介します"
        backLink={{ href: '/dashboard', label: 'ダッシュボード' }}
      />

      {/* サービス概要 */}
      <DashboardCard className="mb-6">
        <DashboardCardHeader>
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">AI Company CMSとは</h2>
        </DashboardCardHeader>
        <DashboardCardContent>
          <p className="text-[var(--color-text-secondary)] leading-relaxed mb-4">
            AI Company CMSは、企業情報やサービス、導入事例を効率的に管理・公開できるコンテンツ管理システムです。
            AI技術を活用し、SEO最適化やコンテンツ生成をサポートします。
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-[var(--aio-muted)] rounded-lg">
              <div className="text-2xl font-bold text-[var(--color-text-secondary)] mb-2">企業管理</div>
              <p className="text-sm text-[var(--color-text-secondary)]">企業情報の一元管理</p>
            </div>
            <div className="text-center p-4 bg-[var(--aio-muted)] rounded-lg">
              <div className="text-2xl font-bold text-[var(--color-text-secondary)] mb-2">サービス管理</div>
              <p className="text-sm text-[var(--color-text-secondary)]">サービス情報の効率的管理</p>
            </div>
            <div className="text-center p-4 bg-[var(--aio-muted)] rounded-lg">
              <div className="text-2xl font-bold text-[var(--color-text-secondary)] mb-2">導入事例</div>
              <p className="text-sm text-[var(--color-text-secondary)]">成功事例の管理・公開</p>
            </div>
          </div>
        </DashboardCardContent>
      </DashboardCard>

      {/* プラン比較 */}
      <DashboardCard className="mb-6">
        <DashboardCardHeader>
          <h3 className="text-lg font-medium text-[var(--color-text-primary)]">プラン比較</h3>
        </DashboardCardHeader>
        <DashboardCardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[var(--dashboard-card-border)]">
              <thead className="bg-[var(--aio-muted)]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">機能</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Starter</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Pro</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Business</th>
                </tr>
              </thead>
              <tbody className="bg-[var(--dashboard-card-bg)] divide-y divide-[var(--dashboard-card-border)]">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-primary)]">サービス</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)]">{PLAN_LIMITS.starter.services}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)]">{PLAN_LIMITS.pro.services}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)]">無制限</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-primary)]">記事</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)]">{PLAN_LIMITS.starter.posts}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)]">{PLAN_LIMITS.pro.posts}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)]">無制限</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-primary)]">導入事例</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)]">{PLAN_LIMITS.starter.case_studies}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)]">{PLAN_LIMITS.pro.case_studies}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)]">無制限</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-primary)]">FAQ</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)]">{PLAN_LIMITS.starter.faqs}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)]">{PLAN_LIMITS.pro.faqs}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)]">無制限</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-primary)]">料金</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)]">¥2,980/月</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)]">¥8,000/月</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)]">¥15,000/月</td>
                </tr>
              </tbody>
            </table>
          </div>
        </DashboardCardContent>
      </DashboardCard>

      {/* アクションボタン */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {organization ? (
          <Link href="/dashboard">
            <DashboardButton variant="primary" size="lg">
              ダッシュボードに戻る
            </DashboardButton>
          </Link>
        ) : (
          <Link href="/organizations/new">
            <DashboardButton variant="primary" size="lg">
              企業情報を登録する
            </DashboardButton>
          </Link>
        )}
      </div>
    </>
  );
}
