'use client';

/**
 * ダッシュボードメインコンテンツ
 *
 * NOTE: [CORE_ARCHITECTURE] DashboardPageShell の children として使用
 * - 認証・権限・エラーハンドリングは Shell が担当
 * - このコンポーネントはコンテンツ表示のみを責務とする
 */

import Link from 'next/link';
import Image from 'next/image';
import { useDashboardPageContext } from '@/components/dashboard/DashboardPageShell';
import { getOrganizationStatsSafe, getCaseStudiesStatsSafe } from '@/lib/safeData';
import PublishToggle from './PublishToggle';
import DashboardClient from '@/components/dashboard/DashboardClient';
import PerformanceMetrics from './PerformanceMetrics';
import DashboardActions from './DashboardActions';
import AIVisibilityCard from './AIVisibilityCard';
import { FirstTimeUserOnboarding } from '@/components/dashboard/FirstTimeUserOnboarding';
import { logger } from '@/lib/utils/logger';
import { useEffect, useState } from 'react';
import {
  BarChartIcon,
  DocumentIcon,
  BriefcaseIcon,
  CheckIcon,
} from '@/components/icons/HIGIcons';
import {
  DashboardSection,
  DashboardMetricCard,
  DashboardLoadingState,
  DashboardAlert,
} from '@/components/dashboard/ui';

interface DashboardStats {
  total: number;
  draft: number;
  published: number;
  archived: number;
}

interface CaseStudiesStats {
  total: number;
  published: number;
}

// Dashboard用の拡張組織型
interface DashboardOrganization {
  id: string;
  name: string;
  slug?: string;
  plan?: string | null;
  logo_url?: string | null;
  is_published?: boolean;
}

export default function DashboardMain() {
  // Shell コンテキストから取得（エラー時は Shell がハンドル済み）
  const { user, organization, organizations } = useDashboardPageContext();

  // 組織の最終チェック：organizationsに組織があるのにorganizationが未設定の場合の対処
  // NOTE: 境界で一度キャストし、以降は型安全にアクセス
  const currentOrganization = (organization ||
    (organizations.length > 0 ? organizations[0] : null)) as DashboardOrganization | null;

  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    draft: 0,
    published: 0,
    archived: 0,
  });
  const [caseStudiesStats, setCaseStudiesStats] = useState<CaseStudiesStats>({
    total: 0,
    published: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  // 統計データの取得
  useEffect(() => {
    if (currentOrganization?.id) {
      const fetchStats = async () => {
        try {
          setStatsLoading(true);
          setStatsError(null);
          const [statsResult, caseStudiesResult] = await Promise.all([
            getOrganizationStatsSafe(),
            getCaseStudiesStatsSafe(currentOrganization.id),
          ]);

          setStats(statsResult.data || { total: 0, draft: 0, published: 0, archived: 0 });
          setCaseStudiesStats(caseStudiesResult.data || { total: 0, published: 0 });
        } catch (error) {
          logger.error('Failed to fetch dashboard stats:', { error });
          setStatsError('統計データの読み込みに失敗しました。');
        } finally {
          setStatsLoading(false);
        }
      };

      fetchStats();
    } else {
      // 組織がない場合は統計ローディングを止める
      setStatsLoading(false);
    }
  }, [currentOrganization?.id]);

  // Shell がすでに isReallyEmpty をハンドルしているが、念のための最終フォールバック
  if (!currentOrganization) {
    return (
      <DashboardLoadingState
        fullScreen
        message="組織情報を確認しています"
        subMessage="組織データの処理中です..."
      />
    );
  }

  logger.debug(
    `[Dashboard] Rendering dashboard UI for user ${user?.id}, org: ${currentOrganization.id}`
  );

  return (
    <>
      {/* Modern Hero Section */}
      <DashboardSection spacing="lg" className="relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-[var(--status-info-bg)]/30" />

        <div className="relative text-center">
          {/* Organization badge */}
          <div className="inline-flex items-center gap-3 glass-card backdrop-blur-sm border border-[var(--dashboard-card-border)] rounded-full px-6 py-3 mb-8 spring-bounce">
            {currentOrganization.logo_url ? (
              <Image
                src={currentOrganization.logo_url}
                alt={`${currentOrganization.name}のロゴ`}
                width={24}
                height={24}
                className="w-6 h-6 object-contain rounded"
              />
            ) : (
              <div className="w-6 h-6 bg-[var(--aio-primary)] rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {currentOrganization.name.charAt(0)}
                </span>
              </div>
            )}
            <span
              className="text-[var(--color-text-primary)] font-medium"
              data-testid="organization-name"
            >
              {currentOrganization.name}
            </span>
            <div
              className={`w-2 h-2 rounded-full ${currentOrganization.is_published ? 'bg-[var(--status-success)] animate-pulse' : 'bg-[var(--color-text-tertiary)]'}`}
            ></div>
          </div>

          {/* Main headline */}
          <h1 className="text-4xl lg:text-5xl font-bold text-[var(--color-text-primary)] mb-6">
            企業情報ダッシュボード
          </h1>
          <p className="text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto leading-relaxed">
            公開状況の管理、統計の確認、コンテンツの管理を一箇所で行えます
          </p>

          {/* Quick actions */}
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <PublishToggle
              organizationId={currentOrganization.id}
              isPublished={currentOrganization.is_published}
              organizationName={currentOrganization.name}
            />
            <Link
              href={`/organizations/${currentOrganization.id}`}
              className="flex-1 text-center px-4 py-2 rounded-lg border border-[var(--dashboard-card-border)] bg-[var(--dashboard-card-bg)] text-[var(--color-text-primary)] font-medium hover:bg-[var(--aio-muted)] transition-colors"
            >
              企業ページを編集
            </Link>
          </div>

          {/* Status overview */}
          {statsError ? (
            <div className="mt-12 max-w-md mx-auto">
              <DashboardAlert variant="warning">
                <div className="text-center">
                  <div className="text-sm mb-3">{statsError}</div>
                  <button
                    onClick={() => window.location.reload()}
                    className="text-sm text-[var(--aio-primary)] hover:text-[var(--aio-primary-hover)] underline"
                  >
                    再読み込み
                  </button>
                </div>
              </DashboardAlert>
            </div>
          ) : (
            !statsLoading && (
              <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
                <DashboardMetricCard
                  label="総コンテンツ数"
                  value={stats.total}
                  icon={<BarChartIcon className="w-5 h-5" aria-hidden />}
                />
                <DashboardMetricCard
                  label="公開済み"
                  value={stats.published}
                  icon={<CheckIcon className="w-5 h-5" aria-hidden />}
                />
                <DashboardMetricCard
                  label="下書き"
                  value={stats.draft}
                  icon={<DocumentIcon className="w-5 h-5" aria-hidden />}
                />
                <DashboardMetricCard
                  label="事例"
                  value={caseStudiesStats.total}
                  icon={<BriefcaseIcon className="w-5 h-5" aria-hidden />}
                />
              </div>
            )
          )}
        </div>
      </DashboardSection>

      {/* Rest of the dashboard content */}
      <DashboardSection spacing="lg">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left column */}
          <div className="space-y-8">
            <PerformanceMetrics organizationId={currentOrganization.id} />
            <AIVisibilityCard organizationId={currentOrganization.id} />
          </div>

          {/* Right column */}
          <div className="space-y-8">
            <DashboardActions organization={organization} />
            <FirstTimeUserOnboarding
              organization={organization as DashboardOrganization}
            />
          </div>
        </div>

        {/* Bottom section */}
        <div className="mt-12">
          <DashboardClient
            organizationId={currentOrganization.id}
            organizationName={currentOrganization.name}
            isPublished={currentOrganization.is_published}
          />
        </div>
      </DashboardSection>
    </>
  );
}
