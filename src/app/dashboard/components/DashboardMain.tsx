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
  const { user, organization, isLoading, error } = useOrganization();
  const [stats, setStats] = useState<DashboardStats>({ total: 0, draft: 0, published: 0, archived: 0 });
  const [caseStudiesStats, setCaseStudiesStats] = useState<CaseStudiesStats>({ total: 0, published: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  // 統計データの取得
  useEffect(() => {
    if (organization?.id) {
      const fetchStats = async () => {
        try {
          setStatsLoading(true);
          setStatsError(null);
          const [statsResult, caseStudiesResult] = await Promise.all([
            getOrganizationStatsSafe(),
            getCaseStudiesStatsSafe(organization.id)
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
    } else if (!isLoading && user && !organization) {
      // 認証済みかつ組織がないことが確定した場合は統計ローディングを止める
      setStatsLoading(false);
    }
  }, [organization?.id, isLoading, user]);

  // ローディング中の判定を明確化
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            データを読み込み中...
          </p>
          <p className="mt-2 text-sm text-gray-400">
            しばらくお待ちください
          </p>
        </div>
      </div>
    );
  }

  // データ取得エラーの場合
  if (error && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-red-600 mb-4">データ読み込みエラー</h2>
          <p className="text-gray-600 mb-4">
            ユーザー情報の取得に失敗しました。
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  // 未認証
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <h2 className="jp-heading text-xl font-semibold text-gray-900 mb-4">サインインしてください</h2>
          <p className="text-gray-600 mb-4">ダッシュボードにアクセスするにはログインが必要です。</p>
          <Link
            href="/auth/login"
            className="w-full bg-[var(--color-blue-600)] hover:bg-[var(--color-blue-700)] focus:ring-2 focus:ring-[var(--color-blue-300)] text-white font-medium py-2 px-4 rounded-md text-center block"
          >
            ログインページへ
          </Link>
        </div>
      </div>
    );
  }

  // パターンB: userあり & org 0件 - 組織がない場合のオンボーディング
  if (user && (!organization || !organization.id)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🏢</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">企業情報を登録しましょう</h2>
            <p className="text-gray-600 text-sm">
              AIOHub をご利用いただくには企業情報の登録が必要です。<br/>
              数分で完了する簡単な手続きです。
            </p>
          </div>
          
          <div className="space-y-3">
            <Link
              href="/organizations/new"
              className="w-full bg-[var(--color-blue-600)] hover:bg-[var(--color-blue-700)] focus:ring-2 focus:ring-[var(--color-blue-300)] text-white font-medium py-3 px-4 rounded-md text-center block transition-colors"
              data-testid="create-organization"
            >
              企業を作成する
            </Link>
            
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-2">既に企業に招待されている場合</p>
              <button
                onClick={() => window.location.reload()}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                ページを再読み込み
              </button>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">
              ユーザーID: {user.email}
            </p>
          </div>
        </div>
      </div>
    );
  }

  logger.debug(`[Dashboard] Rendering dashboard UI for user ${user.id}, org: ${organization.id}`);

  return (
    <>
      {/* Modern Hero Section */}
      <section className="relative section-spacing overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-blue-50/30" />
        
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center">
            {/* Organization badge */}
            <div className="inline-flex items-center gap-3 glass-card backdrop-blur-sm border border-gray-200 rounded-full px-6 py-3 mb-8 spring-bounce">
              {(organization as any).logo_url ? (
                <Image
                  src={(organization as any).logo_url}
                  alt={`${organization.name}のロゴ`}
                  width={24}
                  height={24}
                  className="w-6 h-6 object-contain rounded"
                />
              ) : (
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {organization.name.charAt(0)}
                  </span>
                </div>
              )}
              <span className="text-gray-700 font-medium" data-testid="organization-name">
                {organization.name}
              </span>
              <div className={`w-2 h-2 rounded-full ${(organization as any).is_published ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            </div>
            
            {/* Main headline */}
            <h1 className="jp-heading text-4xl lg:text-5xl font-bold text-gray-900 mb-6 gradient-text">
              企業情報ダッシュボード
            </h1>
            <p className="jp-text text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              公開状況の管理、統計の確認、コンテンツの管理を一箇所で行えます
            </p>
            
            {/* Quick actions */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <PublishToggle organizationId={organization.id} isPublished={(organization as any).is_published} organizationName={organization.name} />
              <Link
                href={`/organizations/${organization.id}`}
                className="btn-secondary flex-1 text-center"
              >
                企業ページを編集
              </Link>
            </div>

            {/* Status overview */}
            {statsError ? (
              <div className="mt-12 max-w-md mx-auto">
                <div className="glass-card p-6 text-center border-yellow-200 bg-yellow-50">
                  <div className="text-2xl mb-2">⚠️</div>
                  <div className="text-sm text-gray-700 mb-3">{statsError}</div>
                  <button
                    onClick={() => window.location.reload()}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    再読み込み
                  </button>
                </div>
              </div>
            ) : !statsLoading && (
              <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
                {[
                  { label: "総コンテンツ数", value: stats.total, icon: "📊" },
                  { label: "公開済み", value: stats.published, icon: "✅" },
                  { label: "下書き", value: stats.draft, icon: "📝" },
                  { label: "事例", value: caseStudiesStats.total, icon: "💼" }
                ].map((item, index) => (
                  <div key={index} className="glass-card p-6 text-center">
                    <div className="text-2xl mb-2">{item.icon}</div>
                    <div className="text-2xl font-bold text-gray-900">{item.value}</div>
                    <div className="text-sm text-gray-500">{item.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Rest of the dashboard content */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left column */}
          <div className="space-y-8">
            <PerformanceMetrics organizationId={organization.id} />
            <AIVisibilityCard organizationId={organization.id} />
          </div>
          
          {/* Right column */}
          <div className="space-y-8">
            <DashboardActions organization={organization} />
            <FirstTimeUserOnboarding organization={organization as any} />
          </div>
        </div>
        
        {/* Bottom section */}
        <div className="mt-12">
          <DashboardClient organizationId={organization.id} organizationName={organization.name} isPublished={(organization as any).is_published} />
        </div>
      </div>
    </>
  );
}