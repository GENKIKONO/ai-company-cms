/**
 * AI × SEO 相関分析 クライアントコンポーネント
 *
 * NOTE: [FEATUREGATE_MIGRATION] プラン名ハードコード判定を廃止済み
 * [FEATUREGATE_PHASE2] featureGate(getEffectiveFeatures + Subject)経由に移行完了
 * - 旧: restrictedPlans = ['free', 'starter'] でプラン名判定
 * - 旧: feature_flags JSONB 直接読み取り
 * - 新: featureGate.getEffectiveFeatures(subject) で統一判定
 */

'use client';

import { useEffect, useState } from 'react';
import { AISEODashboard } from '@/components/analytics/AISEODashboard';
import { DashboardLoadingState } from '@/components/dashboard/ui';
import { useOrganization } from '@/lib/hooks/useOrganization';
import { createClient } from '@/lib/supabase/client';
import { getEffectiveFeatures, type EffectiveFeature } from '@/lib/featureGate';
import { FeatureLocked } from '@/components/feature/FeatureLocked';

/** 機能フラグの型（featureGate経由で取得） */
interface AnalyticsFeatureFlags {
  ai_bot_analytics: boolean;
  ai_visibility_analytics: boolean;
  ai_reports: boolean;
}

/**
 * EffectiveFeature[] から対象キーの有効状態を取得
 * NOTE: [FEATUREGATE_PHASE2] featureGate統一API経由
 */
function getAnalyticsFlagsFromFeatures(
  features: EffectiveFeature[]
): AnalyticsFeatureFlags {
  const getEnabled = (key: string): boolean => {
    const feature = features.find(f => f.feature_key === key);
    return feature?.is_enabled === true || feature?.enabled === true;
  };

  return {
    ai_bot_analytics: getEnabled('ai_bot_analytics'),
    ai_visibility_analytics: getEnabled('ai_visibility_analytics'),
    ai_reports: getEnabled('ai_reports'),
  };
}

export function AISEOReportClient() {
  // 組織スコープ取得
  const { user, organization, isLoading } = useOrganization();

  // featureGate 経由で機能フラグを取得（Subject型API）
  const [analyticsFlags, setAnalyticsFlags] = useState<AnalyticsFeatureFlags | null>(null);
  const [isFeaturesLoading, setIsFeaturesLoading] = useState(true);

  useEffect(() => {
    if (!organization?.id) {
      setIsFeaturesLoading(false);
      return;
    }

    const fetchFeatures = async () => {
      try {
        const supabase = createClient();
        // featureGate.getEffectiveFeatures (Subject型API)
        const features = await getEffectiveFeatures(supabase, {
          type: 'org',
          id: organization.id,
        });
        setAnalyticsFlags(getAnalyticsFlagsFromFeatures(features));
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[AISEOReportClient] Failed to fetch features:', err);
        // エラー時はすべて無効として扱う
        setAnalyticsFlags({ ai_bot_analytics: false, ai_visibility_analytics: false, ai_reports: false });
      } finally {
        setIsFeaturesLoading(false);
      }
    };

    fetchFeatures();
  }, [organization?.id]);

  // ローディング中（組織情報 or 機能フラグ）
  if (isLoading || isFeaturesLoading) {
    return (
      <DashboardLoadingState
        message="ユーザー情報を読み込み中"
        className="min-h-[50vh] flex items-center justify-center"
      />
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

  // 機能フラグ判定（featureGate統一API経由）
  // NOTE: [FEATUREGATE_PHASE2] getEffectiveFeatures(subject) 経由
  const hasBasicAnalytics = analyticsFlags?.ai_bot_analytics || analyticsFlags?.ai_visibility_analytics;

  // 機能が無効な場合はロック画面を表示
  if (!hasBasicAnalytics) {
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
      />
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
        features={analyticsFlags ?? { ai_bot_analytics: false, ai_visibility_analytics: false, ai_reports: false }}
      />
    </div>
  );
}
