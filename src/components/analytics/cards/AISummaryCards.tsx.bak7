/**
 * AI × SEO サマリーカード群
 * 
 * 4つのカードを横並び表示（モバイルは縦並び）:
 * 1. 今月のAI Bot Hits (API: /api/analytics/ai/summary)
 * 2. 構造化データ整備率 (API: /api/analytics/ai/visibility)
 * 3. SEOインプレッション (API: /api/analytics/seo/gsc)
 * 4. AI Visibility Score (API: /api/analytics/ai/visibility)
 */

'use client';

import { 
  type AiBotSummaryData, 
  type AiVisibilityData, 
  type SeoGscData,
  type AiSeoCombinedData,
  type FeatureFlags 
} from '@/lib/hooks/useAiSeoAnalytics';

interface AISummaryCardsProps {
  botSummary?: AiBotSummaryData;
  aiVisibility?: AiVisibilityData;
  seoGsc?: SeoGscData;
  aiSeoCombined?: AiSeoCombinedData;
  features: FeatureFlags;
  errors: {
    botSummary?: Error;
    aiVisibility?: Error;
    seoGsc?: Error;
    aiSeoCombined?: Error;
  };
}

export function AISummaryCards({ 
  botSummary, 
  aiVisibility, 
  seoGsc, 
  aiSeoCombined,
  features,
  errors 
}: AISummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* 1. AI Bot Hits Card */}
      <SummaryCard
        title="今月のAI Bot Hits"
        value={botSummary?.metrics?.total_bot_hits || 0}
        subtitle={`${botSummary?.metrics?.unique_bots || 0} 種類のボット`}
        icon="🤖"
        enabled={features.ai_bot_analytics}
        loading={!botSummary && !errors.botSummary}
        error={errors.botSummary}
        disabledMessage="AI Botの流入データは現在のプランでは取得していません"
        trend={getBotHitsTrend(botSummary)}
      />

      {/* 2. 構造化データ整備率 Card */}
      <SummaryCard
        title="構造化データ整備率"
        value={getStructuredDataCoverage(aiVisibility)}
        subtitle="JSON-LD実装済み"
        icon="📋"
        enabled={features.ai_visibility_analytics}
        loading={!aiVisibility && !errors.aiVisibility}
        error={errors.aiVisibility}
        disabledMessage="AI可視性スコアはPro以上で利用できます"
        isPercentage={true}
        trend={getStructuredDataTrend(aiVisibility)}
      />

      {/* 3. SEOインプレッション Card */}
      <SummaryCard
        title="SEOインプレッション"
        value={seoGsc?.metrics?.total_impressions || 0}
        subtitle={`平均掲載順位 ${(seoGsc?.metrics?.average_position || 0).toFixed(1)}位`}
        icon="🔍"
        enabled={!!seoGsc?.success || features.ai_visibility_analytics}
        loading={!seoGsc && !errors.seoGsc}
        error={errors.seoGsc}
        disabledMessage="GSCデータ取得中です"
        trend={getSeoImpressionsTrend(seoGsc)}
      />

      {/* 4. AI Visibility Score Card */}
      <SummaryCard
        title="AI Visibility Score"
        value={aiVisibility?.overall_score || aiVisibility?.analysis?.avg_visibility_score || 0}
        subtitle={getVisibilityScoreSubtitle(aiVisibility)}
        icon="⚡"
        enabled={features.ai_visibility_analytics}
        loading={!aiVisibility && !errors.aiVisibility}
        error={errors.aiVisibility}
        disabledMessage="AI可視性スコアはPro以上で利用できます"
        isScore={true}
        trend={getVisibilityScoreTrend(aiVisibility)}
      />
    </div>
  );
}

/**
 * 個別サマリーカードコンポーネント
 */
interface SummaryCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: string;
  enabled: boolean;
  loading: boolean;
  error?: Error;
  disabledMessage: string;
  isPercentage?: boolean;
  isScore?: boolean;
  trend?: 'up' | 'down' | 'stable' | null;
}

function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  enabled,
  loading,
  error,
  disabledMessage,
  isPercentage = false,
  isScore = false,
  trend
}: SummaryCardProps) {
  return (
    <div className="bg-[var(--aio-surface)] border border-[var(--aio-border)] rounded-lg p-6 hover:shadow-md transition-shadow">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-[var(--text-muted)]">
          {title}
        </h3>
        <span className="text-2xl">{icon}</span>
      </div>

      {/* メイン値 */}
      <div className="space-y-2">
        {!enabled ? (
          <DisabledState message={disabledMessage} />
        ) : loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState />
        ) : (
          <ValueDisplay 
            value={value} 
            subtitle={subtitle}
            isPercentage={isPercentage}
            isScore={isScore}
            trend={trend}
          />
        )}
      </div>
    </div>
  );
}

/**
 * 値表示コンポーネント
 */
interface ValueDisplayProps {
  value: number;
  subtitle: string;
  isPercentage: boolean;
  isScore: boolean;
  trend?: 'up' | 'down' | 'stable' | null;
}

function ValueDisplay({ value, subtitle, isPercentage, isScore, trend }: ValueDisplayProps) {
  const formatValue = () => {
    if (isPercentage) {
      return `${value.toFixed(1)}%`;
    } else if (isScore) {
      return value.toFixed(0);
    } else {
      return value.toLocaleString();
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <span className="text-[var(--aio-success)]">↗️</span>;
      case 'down':
        return <span className="text-[var(--aio-error)]">↘️</span>;
      case 'stable':
        return <span className="text-[var(--text-muted)]">➡️</span>;
      default:
        return null;
    }
  };

  return (
    <>
      <div className="flex items-end space-x-2">
        <span className="text-2xl font-bold text-[var(--text-primary)]">
          {formatValue()}
        </span>
        {getTrendIcon()}
      </div>
      <p className="text-sm text-[var(--text-muted)]">
        {subtitle}
      </p>
    </>
  );
}

/**
 * 無効状態表示
 */
function DisabledState({ message }: { message: string }) {
  return (
    <>
      <div className="text-2xl font-bold text-[var(--text-muted)]">--</div>
      <p className="text-sm text-[var(--text-muted)]">{message}</p>
    </>
  );
}

/**
 * ローディング状態表示
 */
function LoadingState() {
  return (
    <>
      <div className="text-2xl font-bold text-[var(--text-muted)]">
        <div className="animate-pulse bg-[var(--aio-surface-hover)] h-8 w-16 rounded"></div>
      </div>
      <p className="text-sm text-[var(--text-muted)]">データ収集中...</p>
    </>
  );
}

/**
 * エラー状態表示
 */
function ErrorState() {
  return (
    <>
      <div className="text-2xl font-bold text-[var(--aio-error)]">!</div>
      <p className="text-sm text-[var(--text-muted)]">取得エラー</p>
    </>
  );
}

/**
 * ユーティリティ関数群
 */

// 構造化データカバレッジ算出
function getStructuredDataCoverage(data?: AiVisibilityData): number {
  if (!data?.content_scores || data.content_scores.length === 0) return 0;
  
  const totalUrls = data.content_scores.length;
  const structuredUrls = data.content_scores.filter(
    score => score.structured_data_score >= 80 // 80点以上を「整備済み」とみなす
  ).length;
  
  return (structuredUrls / totalUrls) * 100;
}

// AI Visibility Score サブタイトル生成
function getVisibilityScoreSubtitle(data?: AiVisibilityData): string {
  if (!data?.content_scores) return 'データ収集中';
  
  const totalUrls = data.content_scores.length;
  return `${totalUrls} URLを分析済み`;
}

// Bot Hits トレンド判定（仮実装）
function getBotHitsTrend(data?: AiBotSummaryData): 'up' | 'down' | 'stable' | null {
  // 実装: 前期比較データがある場合はここで計算
  return null;
}

// 構造化データトレンド判定（仮実装）
function getStructuredDataTrend(data?: AiVisibilityData): 'up' | 'down' | 'stable' | null {
  // 実装: score_trendから判定
  return null;
}

// SEOインプレッショントレンド判定（仮実装）
function getSeoImpressionsTrend(data?: SeoGscData): 'up' | 'down' | 'stable' | null {
  // 実装: 過去データ比較があれば計算
  return null;
}

// Visibilityスコアトレンド判定
function getVisibilityScoreTrend(data?: AiVisibilityData): 'up' | 'down' | 'stable' | null {
  if (!data?.score_trend || data.score_trend.length < 2) return null;
  
  const recent = data.score_trend.slice(-2);
  const diff = recent[1].score - recent[0].score;
  
  if (diff > 5) return 'up';
  if (diff < -5) return 'down';
  return 'stable';
}