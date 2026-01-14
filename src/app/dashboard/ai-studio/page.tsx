'use client';

/**
 * AI Studio 入口ページ
 * AIインタビュー、企業専用AIチャットへの導線を提供
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

const SparklesIcon = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const ChatBubbleIcon = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const MicrophoneIcon = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
  </svg>
);

// =====================================================
// MAIN PAGE
// =====================================================

export default function AiStudioPage() {
  return (
    <DashboardPageShell
      title="AI Studio"
      requiredRole="viewer"
    >
      <AiStudioContent />
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
}

function FeatureCard({ href, icon, title, description }: FeatureCardProps) {
  return (
    <Link href={href} className="block">
      <DashboardCard className="h-full hover:border-[var(--aio-primary)] transition-colors duration-200 cursor-pointer">
        <DashboardCardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[var(--aio-primary-muted)] flex items-center justify-center text-[var(--aio-primary)]">
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

function AiStudioContent() {
  return (
    <>
      <DashboardPageHeader
        title="AI Studio"
        description="AIを活用したコンテンツ作成・分析ツール"
        backLink={{ href: ROUTES.dashboard, label: 'ダッシュボード' }}
      />

      <div className="mb-8">
        <DashboardCard>
          <DashboardCardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--aio-primary)] to-[var(--aio-purple)] flex items-center justify-center text-white">
                <SparklesIcon />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                  AI Studio へようこそ
                </h2>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  AIの力でビジネスを加速させましょう
                </p>
              </div>
            </div>
          </DashboardCardContent>
        </DashboardCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FeatureCard
          href={ROUTES.dashboardInterview}
          icon={<MicrophoneIcon />}
          title="AIインタビュー"
          description="AIがあなたの代わりにヒアリングを実施。効率的に情報を収集し、レポートを自動生成します。"
        />

        <FeatureCard
          href={ROUTES.dashboardOrgAiChat}
          icon={<ChatBubbleIcon />}
          title="企業専用AIチャット"
          description="あなたの企業データに基づいてカスタマイズされたAIチャット。社内の知識をすぐに検索できます。"
        />
      </div>
    </>
  );
}
