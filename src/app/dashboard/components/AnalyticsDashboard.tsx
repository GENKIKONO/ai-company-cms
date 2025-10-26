'use client';

import { useState, useEffect } from 'react';
import { Brain, TrendingUp, Users, Eye, AlertCircle, Crown } from 'lucide-react';
import StructuredDataScore from '@/components/analytics/StructuredDataScore';
import AIVisibilityReport from '@/components/analytics/AIVisibilityReport';
import TeamManagement from '@/components/team/TeamManagement';
import { getTrialStatus, type TrialStatus } from '@/lib/trial-manager';
import type { Organization } from '@/types/database';
import { PLAN_LIMITS } from '@/lib/plan-limits';

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

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Check trial status
        const trial = getTrialStatus(organization);
        setTrialStatus(trial);

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
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [organization]);

  const planLimits = PLAN_LIMITS[organization.plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.starter;
  const hasStructuredScoreFeature = planLimits.structured_score;
  const hasAIVisibilityFeature = planLimits.ai_visibility_reports;
  const hasTeamManagement = planLimits.team_management;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
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
            ? 'bg-red-50 border-red-200' 
            : trialStatus.daysRemaining <= 3 
              ? 'bg-yellow-50 border-yellow-200' 
              : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-center gap-3">
            <AlertCircle className={`w-5 h-5 ${
              trialStatus.isExpired 
                ? 'text-red-600' 
                : trialStatus.daysRemaining <= 3 
                  ? 'text-yellow-600' 
                  : 'text-blue-600'
            }`} />
            <div>
              <div className="font-medium">
                {trialStatus.isExpired 
                  ? 'トライアル期間が終了しました' 
                  : `トライアル期間残り${trialStatus.daysRemaining}日`}
              </div>
              <div className="text-sm text-gray-600">
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
          <div className="text-2xl font-bold text-blue-600 mb-1">
            {stats?.contentCount.services || 0}
          </div>
          <div className="text-sm text-gray-600">サービス</div>
          <div className="text-xs text-gray-500 mt-1">
            / {planLimits.services === Number.POSITIVE_INFINITY ? '無制限' : planLimits.services}
          </div>
        </div>

        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-green-600 mb-1">
            {stats?.contentCount.faqs || 0}
          </div>
          <div className="text-sm text-gray-600">FAQ</div>
          <div className="text-xs text-gray-500 mt-1">
            / {planLimits.qa_items === Number.POSITIVE_INFINITY ? '無制限' : planLimits.qa_items}
          </div>
        </div>

        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-purple-600 mb-1">
            {stats?.contentCount.caseStudies || 0}
          </div>
          <div className="text-sm text-gray-600">導入事例</div>
          <div className="text-xs text-gray-500 mt-1">
            / {planLimits.case_studies === Number.POSITIVE_INFINITY ? '無制限' : planLimits.case_studies}
          </div>
        </div>

        {hasStructuredScoreFeature && (
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-orange-600 mb-1">
              {stats?.structuredScore || 0}
            </div>
            <div className="text-sm text-gray-600">構造化スコア</div>
            <div className="text-xs text-gray-500 mt-1">/ 100</div>
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
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-neutral-900">最近の更新</h3>
          </div>
          
          {stats?.recentActivity && stats.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {stats.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'service' ? 'bg-blue-500' :
                    activity.type === 'faq' ? 'bg-green-500' : 'bg-purple-500'
                  }`} />
                  <div className="flex-1">
                    <div className="font-medium text-sm text-neutral-900">
                      {activity.title}
                    </div>
                    <div className="text-xs text-neutral-600">
                      {new Date(activity.date).toLocaleDateString('ja-JP')}
                    </div>
                  </div>
                  <div className="text-xs text-neutral-500 capitalize">
                    {activity.type === 'service' ? 'サービス' :
                     activity.type === 'faq' ? 'FAQ' : '導入事例'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Eye className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>最近の更新はありません</p>
            </div>
          )}
        </div>

        {/* Plan Features */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Crown className="w-5 h-5 text-yellow-600" />
            <h3 className="text-lg font-semibold text-neutral-900">
              現在のプラン: {organization.plan?.toUpperCase() || 'STARTER'}
            </h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-700">構造化スコア表示</span>
              <span className={`text-sm font-medium ${hasStructuredScoreFeature ? 'text-green-600' : 'text-gray-400'}`}>
                {hasStructuredScoreFeature ? '利用可能' : '未対応'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-700">AI Visibilityレポート</span>
              <span className={`text-sm font-medium ${hasAIVisibilityFeature ? 'text-green-600' : 'text-gray-400'}`}>
                {hasAIVisibilityFeature ? '利用可能' : 'Business以上'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-700">チーム管理</span>
              <span className={`text-sm font-medium ${hasTeamManagement ? 'text-green-600' : 'text-gray-400'}`}>
                {hasTeamManagement ? '利用可能' : 'Business以上'}
              </span>
            </div>
          </div>

          {(!hasAIVisibilityFeature || !hasTeamManagement) && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
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