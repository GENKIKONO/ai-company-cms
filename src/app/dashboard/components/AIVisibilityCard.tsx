'use client';

// AIVisibilityCard - AI可視性スコア表示カード
// effective-features統合済み: サーバーサイドでcanUseFeature/getFeatureLevelを実行し、
// クライアント側ではその結果に基づいて表示制御を行う（プラン文字列フォールバック付き）

import { useState, useEffect, useCallback } from 'react';
import { type PlanType } from '@/config/plans';
import { CACHE_KEYS } from '@/lib/cache/keys';
import { logger } from '@/lib/utils/logger';

interface AIVisibilityCardProps {
  organizationId: string;
  organizationPlan?: PlanType;
}

interface VisibilityData {
  organization_id: string;
  overall_score: number;
  summary: {
    total_analyzed_urls: number;
    average_score: number;
    top_performing_urls: number;
    improvement_needed_urls: number;
    last_calculation: string | null;
  };
}

interface BotLogsData {
  logs: Array<{
    id: string;
    bot_name: string;
    accessed_at: string;
  }>;
  total_count: number;
}

interface AIFeatureStatus {
  hasAccess: boolean;
  level: string | null;
  plan: string;
  reason?: string;
}

export default function AIVisibilityCard({ organizationId, organizationPlan = 'starter' }: AIVisibilityCardProps) {
  const [visibilityData, setVisibilityData] = useState<VisibilityData | null>(null);
  const [botLogsData, setBotLogsData] = useState<BotLogsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // effective-features ベースの機能状態（API経由で取得）
  const [aiFeatureStatus, setAiFeatureStatus] = useState<AIFeatureStatus | null>(null);
  
  // effective-features ベースの表示制御
  const aiReportsLevel = aiFeatureStatus?.level || false;
  const showAdvancedFeatures = aiFeatureStatus?.hasAccess || false;

  // AI機能アクセス制御チェック（effective-features ベース）
  // サーバーサイドでcanUseFeature/getFeatureLevelを安全に実行し、
  // クライアント側ではその結果に基づいて表示制御を行う
  const loadAIFeatureStatus = useCallback(async () => {
    try {
      const featureResponse = await fetch('/api/my/features/ai-reports', {
        cache: 'no-store'
      });
      
      if (featureResponse.ok) {
        const featureData = await featureResponse.json().catch(() => ({}));
        logger.debug('AI feature status loaded via effective-features', {
          hasAccess: featureData.hasAccess,
          level: featureData.level,
          plan: featureData.plan,
          reason: featureData.reason
        });
        setAiFeatureStatus(featureData);
      } else {
        // フォールバック: プラン文字列ベースの制御（レガシー）
        logger.debug('AI feature check failed, using plan-based fallback', { 
          organizationPlan,
          status: featureResponse.status 
        });
        setAiFeatureStatus({
          hasAccess: organizationPlan === 'pro' || organizationPlan === 'business' || organizationPlan === 'enterprise',
          level: organizationPlan === 'pro' ? 'basic' : organizationPlan === 'business' || organizationPlan === 'enterprise' ? 'advanced' : null,
          plan: organizationPlan,
          reason: 'fallback_to_plan'
        });
      }
    } catch (error) {
      logger.error('Failed to load AI feature status', { data: error });
      // エラー時はプラン文字列フォールバック
      setAiFeatureStatus({
        hasAccess: organizationPlan === 'pro' || organizationPlan === 'business' || organizationPlan === 'enterprise',
        level: organizationPlan === 'pro' ? 'basic' : organizationPlan === 'business' || organizationPlan === 'enterprise' ? 'advanced' : null,
        plan: organizationPlan,
        reason: 'error_fallback'
      });
    }
  }, [organizationPlan]);

  const loadAIData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 0. AI機能アクセス制御チェック（effective-features ベース）を最初に実行
      await loadAIFeatureStatus();

      // アクセス権限がない場合はデータ取得をスキップ
      // （UIは権限に応じた表示になる）

      // 1. AI Visibility Score を取得
      const visibilityResponse = await fetch(
        CACHE_KEYS.analyticsVisibility(organizationId) + '&trend_days=30&limit=50',
        { cache: 'no-store' }
      );

      // 2. AI Bot Logs を取得
      const botLogsResponse = await fetch(
        CACHE_KEYS.analyticsBotLogs(organizationId),
        { cache: 'no-store' }
      );

      let visibilityResult = null;
      let botLogsResult = null;

      if (visibilityResponse.ok) {
        visibilityResult = await visibilityResponse.json().catch(() => null);
        setVisibilityData(visibilityResult);
      }

      if (botLogsResponse.ok) {
        botLogsResult = await botLogsResponse.json().catch(() => null);
        setBotLogsData(botLogsResult);
      }

      // どちらも失敗した場合のみログ出力（エラー状態にはしない）
      if (!visibilityResponse.ok && !botLogsResponse.ok) {
        logger.debug('Both AI APIs failed, showing placeholder data');
      }

    } catch (error) {
      logger.error('Failed to load AI data', { data: error instanceof Error ? error : new Error(String(error)) });
      // エラーがあってもプレースホルダーを表示
    } finally {
      setLoading(false);
    }
  }, [organizationId, loadAIFeatureStatus]);

  useEffect(() => {
    loadAIData();
  }, [loadAIData]);

  const formatScore = (score: number | undefined): string => {
    if (score === undefined || score === null) return '--';
    return Math.round(score).toString();
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '--';
    try {
      return new Date(dateString).toLocaleDateString('ja-JP');
    } catch {
      return '--';
    }
  };

  const getScoreColor = (score: number | undefined): string => {
    if (score === undefined || score === null) return 'text-[var(--color-icon-muted)]';
    if (score >= 80) return 'text-[var(--aio-success)]';
    if (score >= 60) return 'text-[var(--aio-info)]';
    if (score >= 40) return 'text-[var(--aio-warning)]';
    return 'text-[var(--aio-danger)]';
  };

  const getScoreBgColor = (score: number | undefined): string => {
    if (score === undefined || score === null) return 'bg-[var(--aio-surface)]';
    if (score >= 80) return 'bg-[var(--aio-success-muted)]';
    if (score >= 60) return 'bg-[var(--aio-muted)]';
    if (score >= 40) return 'bg-[var(--aio-warning-muted)]';
    return 'bg-[var(--aio-danger-muted)]';
  };

  return (
    <div className="group bg-white/90 backdrop-blur-sm rounded-3xl p-8 border border-[var(--dashboard-card-border)] hover:border-[var(--input-border)] hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="w-16 h-16 bg-[var(--aio-purple)] rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>

        {/* effective-features ベースの表示制御 */}
        <div className="text-right">
          {!showAdvancedFeatures && (
            <span className="text-xs bg-[var(--aio-surface)] text-[var(--color-text-secondary)] px-2 py-1 rounded-full">
              Proプラン以上
            </span>
          )}
        </div>
      </div>
      
      <div>
        <p className="text-sm font-medium text-[var(--color-text-tertiary)] mb-2">AI可視性スコア</p>
        
        {loading ? (
          <div className="space-y-3">
            <div className="h-8 bg-[var(--dashboard-card-border)] rounded animate-pulse"></div>
            <div className="h-4 bg-[var(--dashboard-card-border)] rounded w-3/4 animate-pulse"></div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${getScoreBgColor(visibilityData?.overall_score)}`}>
                <span className={`text-2xl font-bold ${getScoreColor(visibilityData?.overall_score)}`}>
                  {formatScore(visibilityData?.overall_score)}
                </span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-[var(--color-text-primary)]">
                  {visibilityData?.overall_score ? `${formatScore(visibilityData.overall_score)}点` : 'データ収集中'}
                </h3>
                <p className="text-sm text-[var(--color-text-tertiary)]">
                  {visibilityData?.summary?.last_calculation
                    ? `更新: ${formatDate(visibilityData.summary.last_calculation)}`
                    : '初回分析を準備中'
                  }
                </p>
              </div>
            </div>

            {/* 基本情報（全プラン表示） */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-text-secondary)]">分析対象URL</span>
                <span className="font-medium">{visibilityData?.summary?.total_analyzed_urls || 0}件</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-text-secondary)]">AI botアクセス</span>
                <span className="font-medium">{botLogsData?.total_count || 0}回</span>
              </div>
            </div>

            {/* Pro以上限定の詳細情報 */}
            {showAdvancedFeatures && visibilityData && (
              <div className="border-t border-[var(--dashboard-card-border)] pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-[var(--aio-success-muted)] rounded-lg p-3">
                    <div className="font-medium text-[var(--aio-success)] mb-1">高評価コンテンツ</div>
                    <div className="text-[var(--status-success)] font-semibold">
                      {visibilityData.summary?.top_performing_urls || 0}件
                    </div>
                    <div className="text-xs text-[var(--status-success)]">スコア80点以上</div>
                  </div>
                  <div className="bg-[var(--aio-warning-muted)] rounded-lg p-3">
                    <div className="font-medium text-[var(--aio-warning)] mb-1">要改善</div>
                    <div className="text-[var(--status-warning)] font-semibold">
                      {visibilityData.summary?.improvement_needed_urls || 0}件
                    </div>
                    <div className="text-xs text-[var(--status-warning)]">スコア50点以下</div>
                  </div>
                </div>
              </div>
            )}

            {/* プラン制限メッセージ */}
            {!showAdvancedFeatures && (
              <div className="border-t border-[var(--dashboard-card-border)] pt-4">
                <div className="bg-[var(--aio-muted)] rounded-lg p-3 text-sm">
                  <p className="text-[var(--aio-primary)] font-medium mb-1">詳細分析を利用するには</p>
                  <p className="text-[var(--aio-primary)]">Proプラン以上で、AI×SEO相関分析やトレンド分析などの高度な機能をご利用いただけます。</p>
                </div>
              </div>
            )}

            {/* データなし状態 */}
            {!loading && !visibilityData && !botLogsData && (
              <div className="text-center py-4">
                <div className="w-12 h-12 mx-auto bg-[var(--aio-surface)] rounded-2xl flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-[var(--color-icon-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-[var(--color-text-tertiary)] font-medium mb-1">データ収集中</p>
                <p className="text-xs text-[var(--color-icon-muted)]">公開コンテンツのAI分析を開始しています</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}