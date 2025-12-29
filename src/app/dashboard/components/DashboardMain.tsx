'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useOrganization } from '@/lib/hooks/useOrganization';
import { getOrganizationStatsSafe, getCaseStudiesStatsSafe } from '@/lib/safeData';
import PublishToggle from './PublishToggle';
import DashboardClient from '@/components/dashboard/DashboardClient';
import PerformanceMetrics from './PerformanceMetrics';
import DashboardActions from './DashboardActions';
import AIVisibilityCard from './AIVisibilityCard';
import { FirstTimeUserOnboarding } from '@/components/dashboard/FirstTimeUserOnboarding';
import { logger } from '@/lib/utils/logger';
import { useEffect, useState } from 'react';
import { LockIcon, AlertTriangleIcon, BuildingIcon, BarChartIcon, DocumentIcon, BriefcaseIcon, CheckIcon } from '@/components/icons/HIGIcons';
import {
  DashboardCard,
  DashboardSection,
  DashboardPageHeader,
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

export default function DashboardMain() {
  const { 
    user, 
    organization, 
    organizations, 
    selectedOrganization, 
    isLoading, 
    error, 
    hasPermissionError,
    hasSystemError,
    isDataFetched,
    isReallyEmpty 
  } = useOrganization();
  
  // 組織の最終チェック：organizationsに組織があるのにorganizationが未設定の場合の対処
  const currentOrganization = organization || (organizations.length > 0 ? organizations[0] : null);
  
  const [stats, setStats] = useState<DashboardStats>({ total: 0, draft: 0, published: 0, archived: 0 });
  const [caseStudiesStats, setCaseStudiesStats] = useState<CaseStudiesStats>({ total: 0, published: 0 });
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
            getCaseStudiesStatsSafe(currentOrganization.id)
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
    } else if (!isLoading && user && !currentOrganization) {
      // 認証済みかつ組織がないことが確定した場合は統計ローディングを止める
      setStatsLoading(false);
    }
  }, [currentOrganization, isLoading, user]);

  // ローディング中の判定を明確化
  if (isLoading) {
    return (
      <DashboardLoadingState
        fullScreen
        message="データを読み込んでいます"
        subMessage="アカウント情報と企業情報を確認しています..."
      />
    );
  }

  // RLS権限エラーの場合（具体的な説明付き）
  if (hasPermissionError && user) {
    return (
      <div className="min-h-screen bg-[var(--dashboard-bg)] flex items-center justify-center">
        <DashboardCard className="max-w-lg w-full mx-4">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-[var(--status-error-bg)] rounded-full flex items-center justify-center mx-auto mb-4">
              <LockIcon className="w-8 h-8 text-[var(--status-error)]" aria-hidden />
            </div>
            <h2 className="text-xl font-semibold text-[var(--status-error)] mb-3">企業情報にアクセスできません</h2>
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
              企業の管理者にご連絡いただくか、<br/>
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

  // データ取得エラーの場合
  if (error && !user) {
    return (
      <div className="min-h-screen bg-[var(--dashboard-bg)] flex items-center justify-center">
        <DashboardCard className="max-w-md w-full mx-4">
          <h2 className="text-xl font-semibold text-[var(--status-error)] mb-4">データ読み込みエラー</h2>
          <p className="text-[var(--color-text-secondary)] mb-4">
            ユーザー情報の取得に失敗しました。
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-[var(--aio-primary)] hover:bg-[var(--aio-primary-hover)] text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            再読み込み
          </button>
        </DashboardCard>
      </div>
    );
  }

  // 未認証
  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--dashboard-bg)] flex items-center justify-center">
        <DashboardCard className="max-w-md w-full mx-4">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">サインインしてください</h2>
          <p className="text-[var(--color-text-secondary)] mb-4">ダッシュボードにアクセスするにはログインが必要です。</p>
          <Link
            href="/auth/login"
            className="w-full bg-[var(--aio-primary)] hover:bg-[var(--aio-primary-hover)] text-white font-medium py-2 px-4 rounded-lg text-center block transition-colors"
          >
            ログインページへ
          </Link>
        </DashboardCard>
      </div>
    );
  }

  // システム/DBエラーの場合（組織メンバーシップは確認できているが詳細取得失敗）
  if (hasSystemError && user) {
    return (
      <div className="min-h-screen bg-[var(--dashboard-bg)] flex items-center justify-center">
        <DashboardCard className="max-w-lg w-full mx-4">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-[var(--status-warning-bg)] rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangleIcon className="w-8 h-8 text-[var(--status-warning)]" aria-hidden />
            </div>
            <h2 className="text-xl font-semibold text-[var(--status-warning)] mb-3">データベースエラー</h2>
            <DashboardAlert variant="warning" className="text-left mb-4">
              <p className="text-sm mb-2">
                <strong>状況:</strong> 組織のメンバーシップは確認できていますが、組織の詳細情報の取得中にエラーが発生しています
              </p>
              <p className="text-sm mb-2">
                <strong>詳細:</strong> {error}
              </p>
              <p className="text-sm">
                <strong>対処:</strong> 一時的なシステムエラーの可能性があります。しばらく待ってから再度お試しください
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

          <div className="mt-6 pt-4 border-t border-[var(--dashboard-card-border)] text-center">
            <p className="text-xs text-[var(--color-text-secondary)]">
              ログインユーザー: {user.email}
            </p>
            <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
              エラーが継続する場合は、このメールアドレスを添えてサポートにお問い合わせください
            </p>
          </div>
        </DashboardCard>
      </div>
    );
  }

  // パターンB: userあり & org 0件 - 組織がない場合のオンボーディング（詳細説明付き）
  // データ取得完了後に組織が本当に0件の場合のみオンボーディングを表示
  if (user && isDataFetched && (!organizations || organizations.length === 0)) {
    return (
      <div className="min-h-screen bg-[var(--dashboard-bg)] flex items-center justify-center">
        <DashboardCard className="max-w-lg w-full mx-4">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-[var(--status-info-bg)] rounded-full flex items-center justify-center mx-auto mb-4">
              <BuildingIcon className="w-8 h-8 text-[var(--status-info)]" aria-hidden />
            </div>
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">企業情報をまだ登録していません</h2>
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
              企業名、業界、基本的な情報を入力するだけで、<br/>
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
              <p className="text-xs text-[var(--color-text-tertiary)] mb-2">既に企業に招待されている場合</p>
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

  // 最終的に現在の組織が決まっていない場合はローディング表示
  if (!currentOrganization) {
    return (
      <DashboardLoadingState
        fullScreen
        message="組織情報を確認しています"
        subMessage="組織データの処理中です..."
      />
    );
  }

  logger.debug(`[Dashboard] Rendering dashboard UI for user ${user.id}, org: ${currentOrganization.id}`);

  return (
    <>
      {/* Modern Hero Section */}
      <DashboardSection spacing="lg" className="relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-[var(--status-info-bg)]/30" />

        <div className="relative text-center">
          {/* Organization badge */}
          <div className="inline-flex items-center gap-3 glass-card backdrop-blur-sm border border-[var(--dashboard-card-border)] rounded-full px-6 py-3 mb-8 spring-bounce">
            {(currentOrganization as any).logo_url ? (
              <Image
                src={(currentOrganization as any).logo_url}
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
            <span className="text-[var(--color-text-primary)] font-medium" data-testid="organization-name">
              {currentOrganization.name}
            </span>
            <div className={`w-2 h-2 rounded-full ${(currentOrganization as any).is_published ? 'bg-[var(--status-success)] animate-pulse' : 'bg-[var(--color-text-tertiary)]'}`}></div>
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
            <PublishToggle organizationId={currentOrganization.id} isPublished={(currentOrganization as any).is_published} organizationName={currentOrganization.name} />
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
          ) : !statsLoading && (
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
            <FirstTimeUserOnboarding organization={organization as any} />
          </div>
        </div>

        {/* Bottom section */}
        <div className="mt-12">
          <DashboardClient organizationId={currentOrganization.id} organizationName={currentOrganization.name} isPublished={(currentOrganization as any).is_published} />
        </div>
      </DashboardSection>
    </>
  );
}