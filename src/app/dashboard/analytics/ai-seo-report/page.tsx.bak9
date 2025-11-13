/**
 * AI × SEO 相関分析ダッシュボードページ
 * Feature Flags: ai_bot_analytics, ai_visibility_analytics, ai_reports
 * 対象プラン: Pro以上（Starterは機能制限表示）
 */

'use client';

import { Suspense } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { AISEODashboard } from '@/components/analytics/AISEODashboard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useOrganization } from '@/lib/hooks/useOrganization';

export default function AISEOReportPage() {
  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[var(--aio-surface)]">
        <Suspense fallback={<LoadingSpinner />}>
          <AISEOReportContent />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}

function AISEOReportContent() {
  // 組織スコープ取得
  const { user, organization, isLoading } = useOrganization();

  // ローディング中
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-[var(--text-muted)]">ユーザー情報を読み込み中...</span>
      </div>
    );
  }

  // ユーザーが認証されていない場合
  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
          ログインが必要です
        </h2>
        <p className="text-[var(--text-muted)]">
          このページを表示するにはログインしてください
        </p>
      </div>
    );
  }

  // 組織が見つからない場合
  if (!organization) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
          組織が設定されていません
        </h2>
        <p className="text-[var(--text-muted)]">
          組織を作成または参加してから再度アクセスしてください
        </p>
      </div>
    );
  }

  // プランチェック: freeとstarterは制限画面を表示
  const restrictedPlans = ['free', 'starter'];
  if (restrictedPlans.includes(organization.plan)) {
    return (
      <FeatureLocked
        title="AI × SEO 相関分析"
        description="AIボットのアクセス分析とSEOパフォーマンスの相関を可視化します"
        features={[
          'AIボットの流入データ分析',
          'AI Visibility Score 測定',
          'Google Search Console 連携',
          'AI×SEO 4象限マトリクス',
          'パフォーマンストレンド分析',
          'レポートエクスポート機能'
        ]}
        requiredPlan="Business"
        currentPlan={organization.plan}
      />
    );
  }

  // 最低限の機能フラグチェック
  const hasBasicAnalytics = 
    organization.feature_flags?.ai_bot_analytics || 
    organization.feature_flags?.ai_visibility_analytics;
  
  if (!hasBasicAnalytics) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
          機能が有効化されていません
        </h2>
        <p className="text-[var(--text-muted)]">
          AI分析機能を有効化するため、管理者にお問い合わせください
        </p>
      </div>
    );
  }

  // ダッシュボード表示
  return (
    <div className="space-y-6 p-6">
      {/* ページヘッダー */}
      <div className="border-b border-[var(--aio-border)] pb-4">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
          AI × SEO 相関分析
        </h1>
        <p className="text-[var(--text-muted)]">
          AIボットのアクセス状況とSEOパフォーマンスの関係を分析し、最適化機会を発見します
        </p>
      </div>

      {/* メインダッシュボード */}
      <AISEODashboard 
        orgId={organization.id} 
        features={{
          ai_bot_analytics: organization.feature_flags?.ai_bot_analytics || false,
          ai_visibility_analytics: organization.feature_flags?.ai_visibility_analytics || false,
          ai_reports: organization.feature_flags?.ai_reports || false
        }} 
      />
    </div>
  );
}

/**
 * フィーチャーロック画面コンポーネント
 * Starterプランで表示される制限画面
 */
interface FeatureLockedProps {
  title: string;
  description: string;
  features: string[];
  requiredPlan: string;
  currentPlan: string;
}

function FeatureLocked({ title, description, features, requiredPlan, currentPlan }: FeatureLockedProps) {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-[var(--aio-surface)] rounded-lg border border-[var(--aio-border)] p-8 text-center">
        {/* アイコン */}
        <div className="w-16 h-16 mx-auto mb-6 bg-[var(--aio-surface-hover)] rounded-full flex items-center justify-center">
          <svg 
            className="w-8 h-8 text-[var(--aio-primary)]" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
            />
          </svg>
        </div>

        {/* タイトル・説明 */}
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
          {title}
        </h2>
        <p className="text-[var(--text-muted)] mb-8 max-w-2xl mx-auto">
          {description}
        </p>

        {/* 機能リスト */}
        <div className="grid md:grid-cols-2 gap-4 mb-8 text-left">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start space-x-3">
              <svg 
                className="w-5 h-5 text-[var(--aio-success)] mt-0.5 flex-shrink-0" 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path 
                  fillRule="evenodd" 
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                  clipRule="evenodd" 
                />
              </svg>
              <span className="text-[var(--text-muted)]">{feature}</span>
            </div>
          ))}
        </div>

        {/* プラン情報 */}
        <div className="bg-[var(--aio-surface-hover)] rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center text-sm">
            <span className="text-[var(--text-muted)]">現在のプラン:</span>
            <span className="font-medium text-[var(--text-primary)] capitalize">
              {currentPlan}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm mt-2">
            <span className="text-[var(--text-muted)]">必要なプラン:</span>
            <span className="font-medium text-[var(--aio-primary)]">
              {requiredPlan} 以上
            </span>
          </div>
        </div>

        {/* 注記 */}
        <p className="text-sm text-[var(--text-muted)]">
          この機能は{requiredPlan}以上のプランで利用できます。<br />
          プラン変更については管理者にお問い合わせください。
        </p>
      </div>
    </div>
  );
}