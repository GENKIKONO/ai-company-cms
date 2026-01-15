'use client';

/**
 * NOTE: [FEATUREGATE_PHASE3] API経由でfeatureGate取得に移行完了
 * - 旧: featureGate.ts を直接インポート（cookies() エラーの原因）
 * - 新: /api/my/features/effective API経由で取得
 */

import { useState, useEffect } from 'react';
import { Brain, TrendingUp, Users, Eye, AlertCircle, Crown } from 'lucide-react';
import StructuredDataScore from '@/components/analytics/StructuredDataScore';
import AIVisibilityReport from '@/components/analytics/AIVisibilityReport';
import TeamManagement from '@/components/team/TeamManagement';
import { getTrialStatus, type TrialStatus } from '@/lib/trial-manager';
import type { Organization } from '@/types/legacy/database';
import { PLAN_LIMITS } from '@/config/plans';
import { logger } from '@/lib/utils/logger';

/** API から返される EffectiveFeature 型 */
interface EffectiveFeature {
  feature_key: string;
  is_enabled?: boolean;
  enabled?: boolean;
  limits?: Record<string, { value: number; period: string | null }>;
}

/** UI制限の型 */
interface PlanUiLimits {
  services: number;
  qa_items: number;
  case_studies: number;
}

/** 機能が有効かどうかを判定（クライアント用ヘルパー） */
function getFeatureEnabled(features: EffectiveFeature[], featureKey: string): boolean {
  const feature = features.find(f => f.feature_key === featureKey);
  return feature?.is_enabled === true || feature?.enabled === true;
}

/** features からUI制限を取得（クライアント用ヘルパー） */
function getPlanUiLimitsFromFeatures(features: EffectiveFeature[]): PlanUiLimits | null {
  const limitsFeature = features.find(f => f.feature_key === 'ui_limits');
  if (!limitsFeature?.limits) return null;
  const limits = limitsFeature.limits;
  return {
    services: limits.services?.value ?? 5,
    qa_items: limits.qa_items?.value ?? 20,
    case_studies: limits.case_studies?.value ?? 3,
  };
}

interface AnalyticsDashboardProps {
  organization: Organization;
  userRole: 'admin' | 'editor' | 'viewer';
}

interface DashboardStats {
  structuredScore: number;
  aiVisibilityIndex: number;
  contentCount: {
    services: number;
    faqs: number;
    caseStudies: number;
  };
  recentActivity: {
    type: 'service' | 'faq' | 'case_study';
    title: string;
    date: string;
  }[];
}

export default function AnalyticsDashboard({ organization, userRole }: AnalyticsDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);

  // NOTE: [FEATUREGATE_PHASE2] featureGate 経由で機能フラグ・制限を取得
  const [features, setFeatures] = useState<EffectiveFeature[]>([]);
  const [uiLimits, setUiLimits] = useState<PlanUiLimits | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Check trial status
        const trial = getTrialStatus(organization);
        setTrialStatus(trial);

        // API経由でfeatureGateを呼び出し（Server-sideでcookies()実行）
        if (organization.id) {
          try {
            const res = await fetch(`/api/my/features/effective?org_id=${organization.id}`);
            if (res.ok) {
              const { data: effectiveFeatures } = await res.json();
              setFeatures(effectiveFeatures || []);
              setUiLimits(getPlanUiLimitsFromFeatures(effectiveFeatures || []));
            } else {
              logger.warn('Failed to fetch features from API', { status: res.status });
            }
          } catch (err) {
            logger.warn('Failed to fetch features from API, using fallback', { error: err });
            // フォールバック: 空配列のままにして PLAN_LIMITS を使用
          }
        }

        // Mock analytics data - in real implementation, fetch from API
        await new Promise(resolve => setTimeout(resolve, 1000));

        const mockStats: DashboardStats = {
          structuredScore: Math.floor(Math.random() * 40) + 60,
          aiVisibilityIndex: Math.floor(Math.random() * 30) + 70,
          contentCount: {
            services: organization.services?.length || 0,
            faqs: organization.faqs?.length || 0,
            caseStudies: organization.case_studies?.length || 0,
          },
          recentActivity: [
            { type: 'service', title: 'Webアプリケーション開発', date: '2024-01-15' },
            { type: 'faq', title: 'プロジェクトの進行について', date: '2024-01-14' },
            { type: 'case_study', title: 'EC サイトリニューアル事例', date: '2024-01-13' }
          ]
        };

        setStats(mockStats);
      } catch (error) {
        logger.error('Failed to fetch dashboard data', { data: error instanceof Error ? error : new Error(String(error)) });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [organization]);

  // NOTE: [FEATUREGATE_PHASE2] featureGate 優先、フォールバックで PLAN_LIMITS
  const staticPlanLimits = PLAN_LIMITS[organization.plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.starter;
  const planLimits = {
    services: uiLimits?.services ?? staticPlanLimits.services,
    qa_items: uiLimits?.qa_items ?? staticPlanLimits.qa_items,
    case_studies: uiLimits?.case_studies ?? staticPlanLimits.case_studies,
  };

  // NOTE: [FEATUREGATE_PHASE2] featureGate 経由で機能判定、フォールバックなし（DB未対応なら false）
  const hasStructuredScoreFeature = getFeatureEnabled(features, 'structured_data_output');
  const hasAIVisibilityFeature = getFeatureEnabled(features, 'ai_visibility_analytics');
  const hasTeamManagement = getFeatureEnabled(features, 'team_management');

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-[var(--dashboard-card-border)] rounded w-1/3 mb-4"></div>
                <div className="h-8 bg-[var(--dashboard-card-border)] rounded w-1/2 mb-2"></div>
                <div className="h-20 bg-[var(--dashboard-card-border)] rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Trial Status Banner */}
      {trialStatus?.isTrialing && (
        <div className={`p-4 rounded-lg border ${
          trialStatus.isExpired
            ? 'bg-[var(--aio-danger-muted)] border-[var(--status-error)]'
            : trialStatus.daysRemaining <= 3
              ? 'bg-[var(--aio-warning-muted)] border-[var(--status-warning)]'
              : 'bg-[var(--aio-muted)] border-[var(--aio-primary)]/30'
        }`}>
          <div className="flex items-center gap-3">
            <AlertCircle className={`w-5 h-5 ${
              trialStatus.isExpired
                ? 'text-[var(--aio-danger)]'
                : trialStatus.daysRemaining <= 3
                  ? 'text-[var(--aio-warning)]'
                  : 'text-[var(--aio-primary)]'
            }`} />
            <div>
              <div className="font-medium">
                {trialStatus.isExpired
                  ? 'トライアル期間が終了しました'
                  : `トライアル期間残り${trialStatus.daysRemaining}日`}
              </div>
              <div className="text-sm text-[var(--color-text-secondary)]">
                {trialStatus.isExpired
                  ? 'Starterプランで継続利用できます。'
                  : 'トライアル期間終了後はStarterプランに自動移行します。'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overview Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-[var(--aio-primary)] mb-1">
            {stats?.contentCount.services || 0}
          </div>
          <div className="text-sm text-[var(--color-text-secondary)]">サービス</div>
          <div className="text-xs text-[var(--color-text-tertiary)] mt-1">
            / {planLimits.services === Number.POSITIVE_INFINITY ? '無制限' : planLimits.services}
          </div>
        </div>

        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-[var(--aio-success)] mb-1">
            {stats?.contentCount.faqs || 0}
          </div>
          <div className="text-sm text-[var(--color-text-secondary)]">FAQ</div>
          <div className="text-xs text-[var(--color-text-tertiary)] mt-1">
            / {planLimits.qa_items === Number.POSITIVE_INFINITY ? '無制限' : planLimits.qa_items}
          </div>
        </div>

        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-[var(--aio-purple)] mb-1">
            {stats?.contentCount.caseStudies || 0}
          </div>
          <div className="text-sm text-[var(--color-text-secondary)]">導入事例</div>
          <div className="text-xs text-[var(--color-text-tertiary)] mt-1">
            / {planLimits.case_studies === Number.POSITIVE_INFINITY ? '無制限' : planLimits.case_studies}
          </div>
        </div>

        {hasStructuredScoreFeature && (
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-[var(--aio-pending)] mb-1">
              {stats?.structuredScore || 0}
            </div>
            <div className="text-sm text-[var(--color-text-secondary)]">構造化スコア</div>
            <div className="text-xs text-[var(--color-text-tertiary)] mt-1">/ 100</div>
          </div>
        )}
      </div>

      {/* Main Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Structured Data Score */}
        {hasStructuredScoreFeature && (
          <StructuredDataScore organization={organization} />
        )}

        {/* AI Visibility Report */}
        {hasAIVisibilityFeature && (
          <AIVisibilityReport organization={organization} />
        )}

        {/* Recent Activity */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-5 h-5 text-[var(--aio-primary)]" />
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">最近の更新</h3>
          </div>
          
          {stats?.recentActivity && stats.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {stats.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--aio-surface)]">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'service' ? 'bg-[var(--aio-primary)]' :
                    activity.type === 'faq' ? 'bg-[var(--status-success)]' : 'bg-[var(--aio-purple)]'
                  }`} />
                  <div className="flex-1">
                    <div className="font-medium text-sm text-[var(--color-text-primary)]">
                      {activity.title}
                    </div>
                    <div className="text-xs text-[var(--color-text-secondary)]">
                      {new Date(activity.date).toLocaleDateString('ja-JP')}
                    </div>
                  </div>
                  <div className="text-xs text-[var(--color-text-tertiary)] capitalize">
                    {activity.type === 'service' ? 'サービス' :
                     activity.type === 'faq' ? 'FAQ' : '導入事例'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-[var(--color-text-tertiary)]">
              <Eye className="w-8 h-8 mx-auto mb-2 text-[var(--color-icon-muted)]" />
              <p>最近の更新はありません</p>
            </div>
          )}
        </div>

        {/* Plan Features */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Crown className="w-5 h-5 text-[var(--aio-warning)]" />
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
              現在のプラン: {organization.plan?.toUpperCase() || 'STARTER'}
            </h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-text-secondary)]">構造化スコア表示</span>
              <span className={`text-sm font-medium ${hasStructuredScoreFeature ? 'text-[var(--aio-success)]' : 'text-[var(--color-icon-muted)]'}`}>
                {hasStructuredScoreFeature ? '利用可能' : '未対応'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-text-secondary)]">AI Visibilityレポート</span>
              <span className={`text-sm font-medium ${hasAIVisibilityFeature ? 'text-[var(--aio-success)]' : 'text-[var(--color-icon-muted)]'}`}>
                {hasAIVisibilityFeature ? '利用可能' : 'Business以上'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-text-secondary)]">チーム管理</span>
              <span className={`text-sm font-medium ${hasTeamManagement ? 'text-[var(--aio-success)]' : 'text-[var(--color-icon-muted)]'}`}>
                {hasTeamManagement ? '利用可能' : 'Business以上'}
              </span>
            </div>
          </div>

          {(!hasAIVisibilityFeature || !hasTeamManagement) && (
            <div className="mt-4 p-3 bg-[var(--aio-muted)] rounded-lg">
              <p className="text-sm text-[var(--aio-primary)]">
                より多くの機能をご利用いただくにはBusinessプランにアップグレードしてください。
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Team Management - Business plan only */}
      {hasTeamManagement && (
        <TeamManagement 
          organizationId={organization.id} 
          currentUserRole={userRole}
        />
      )}
    </div>
  );
}