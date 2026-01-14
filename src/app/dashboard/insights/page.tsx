'use client';

/**
 * Insights 入口ページ
 * Q&A統計、分析レポート、AIレポート、AI引用への導線を提供
 */

import Link from 'next/link';
import {
  DashboardPageShell,
} from '@/components/dashboard';
import {
  DashboardPageHeader,
  DashboardCard,
  DashboardCardContent,
} from '@/components/dashboard/ui';
import { ROUTES } from '@/lib/routes';

// =====================================================
// ICONS
// =====================================================

const ChartBarIcon = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const PresentationChartIcon = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
  </svg>
);

const DocumentChartIcon = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const LinkIcon = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
);

const QuestionMarkIcon = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// =====================================================
// MAIN PAGE
// =====================================================

export default function InsightsPage() {
  return (
    <DashboardPageShell
      title="Insights"
      requiredRole="viewer"
    >
      <InsightsContent />
    </DashboardPageShell>
  );
}

// =====================================================
// CONTENT
// =====================================================

interface FeatureCardProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  colorClass?: string;
}

function FeatureCard({ href, icon, title, description, colorClass = 'bg-[var(--aio-primary-muted)] text-[var(--aio-primary)]' }: FeatureCardProps) {
  return (
    <Link href={href} className="block">
      <DashboardCard className="h-full hover:border-[var(--aio-primary)] transition-colors duration-200 cursor-pointer">
        <DashboardCardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${colorClass}`}>
              {icon}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                {title}
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {description}
              </p>
            </div>
          </div>
        </DashboardCardContent>
      </DashboardCard>
    </Link>
  );
}

function InsightsContent() {
  return (
    <>
      <DashboardPageHeader
        title="Insights"
        description="データ分析とパフォーマンス指標を確認"
        backLink={{ href: ROUTES.dashboard, label: 'ダッシュボード' }}
      />

      <div className="mb-8">
        <DashboardCard>
          <DashboardCardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--aio-info)] to-[var(--aio-purple)] flex items-center justify-center text-white">
                <PresentationChartIcon />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                  Insights へようこそ
                </h2>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  データに基づいた意思決定をサポートします
                </p>
              </div>
            </div>
          </DashboardCardContent>
        </DashboardCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FeatureCard
          href={ROUTES.dashboardQnaStats}
          icon={<QuestionMarkIcon />}
          title="Q&A統計"
          description="ユーザーからの質問と回答のパフォーマンスを分析。よくある質問や改善点を把握できます。"
        />

        <FeatureCard
          href={ROUTES.dashboardAiSeoReport}
          icon={<ChartBarIcon />}
          title="分析レポート"
          description="AI SEOの効果を測定。検索エンジンでの表示回数やクリック率を確認できます。"
          colorClass="bg-[var(--aio-success-muted)] text-[var(--aio-success)]"
        />

        <FeatureCard
          href={ROUTES.dashboardAiReports}
          icon={<DocumentChartIcon />}
          title="AIレポート"
          description="AIが自動生成する詳細なレポート。週次・月次のパフォーマンスサマリーを確認できます。"
          colorClass="bg-[var(--aio-purple-muted)] text-[var(--aio-purple)]"
        />

        <FeatureCard
          href={ROUTES.dashboardAiCitations}
          icon={<LinkIcon />}
          title="AI引用"
          description="あなたのコンテンツがAIにどのように引用されているかを追跡。AI可視性を向上させましょう。"
          colorClass="bg-[var(--aio-indigo-muted)] text-[var(--aio-indigo)]"
        />
      </div>
    </>
  );
}
