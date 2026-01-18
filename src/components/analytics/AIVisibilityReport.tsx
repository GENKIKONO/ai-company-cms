'use client';

import { useState, useEffect } from 'react';
import { Brain, TrendingUp, Search, Eye, RefreshCw } from 'lucide-react';
import type { Organization } from '@/types/legacy/database';;
import { logger } from '@/lib/utils/logger';

interface AIVisibilityMetrics {
  overallScore: number;
  structuredDataScore: number;
  aiAccessScore: number;
  seoPerformanceScore: number;
  totalAnalyzedUrls: number;
  topPerformingUrls: number;
  improvementNeededUrls: number;
  lastUpdated: string | null;
  hasData: boolean;
}

interface AIVisibilityReportProps {
  organization: Organization;
  className?: string;
}

export function AIVisibilityReport({ organization, className = '' }: AIVisibilityReportProps) {
  const [metrics, setMetrics] = useState<AIVisibilityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    generateReport();
  }, [organization.id]);

  const generateReport = async () => {
    setGenerating(true);
    try {
      // 実際のAPIからデータを取得
      const response = await fetch(`/api/analytics/ai/visibility?organization_id=${organization.id}`);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      // APIレスポンスが空またはデータなしの場合
      if (!data || data.is_fallback || data.summary?.total_analyzed_urls === 0) {
        setMetrics({
          overallScore: 0,
          structuredDataScore: 0,
          aiAccessScore: 0,
          seoPerformanceScore: 0,
          totalAnalyzedUrls: 0,
          topPerformingUrls: 0,
          improvementNeededUrls: 0,
          lastUpdated: null,
          hasData: false,
        });
        return;
      }

      // content_scoresから平均スコアを計算
      const contentScores = data.content_scores || [];
      let avgStructuredData = 0;
      let avgAiAccess = 0;
      let avgSeoPerformance = 0;

      if (contentScores.length > 0) {
        let sumStructured = 0, sumAi = 0, sumSeo = 0;
        for (const score of contentScores) {
          sumStructured += score.component_scores?.structured_data || 0;
          sumAi += score.component_scores?.ai_access || 0;
          sumSeo += score.component_scores?.seo_performance || 0;
        }
        avgStructuredData = Math.round(sumStructured / contentScores.length);
        avgAiAccess = Math.round(sumAi / contentScores.length);
        avgSeoPerformance = Math.round(sumSeo / contentScores.length);
      }

      setMetrics({
        overallScore: data.overall_score || 0,
        structuredDataScore: avgStructuredData,
        aiAccessScore: avgAiAccess,
        seoPerformanceScore: avgSeoPerformance,
        totalAnalyzedUrls: data.summary?.total_analyzed_urls || 0,
        topPerformingUrls: data.summary?.top_performing_urls || 0,
        improvementNeededUrls: data.summary?.improvement_needed_urls || 0,
        lastUpdated: data.summary?.last_calculation || null,
        hasData: true,
      });
    } catch (error) {
      logger.error('Failed to fetch AI visibility report', { data: error instanceof Error ? error : new Error(String(error)) });
      // エラー時は空データを設定
      setMetrics({
        overallScore: 0,
        structuredDataScore: 0,
        aiAccessScore: 0,
        seoPerformanceScore: 0,
        totalAnalyzedUrls: 0,
        topPerformingUrls: 0,
        improvementNeededUrls: 0,
        lastUpdated: null,
        hasData: false,
      });
    } finally {
      setLoading(false);
      setGenerating(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-[var(--aio-primary)]';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };


  if (loading) {
    return (
      <div className={`card p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-6">
          <Brain className="w-6 h-6 text-purple-600" />
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">AI Visibilityレポート</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-[var(--color-icon-muted)] animate-spin mx-auto mb-4" />
              <p className="text-[var(--color-text-secondary)]">分析データを取得中...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // データがない場合のUI
  if (!metrics || !metrics.hasData) {
    return (
      <div className={`card p-6 ${className}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Brain className="w-6 h-6 text-purple-600" />
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">AI Visibilityレポート</h3>
          </div>
          <button
            onClick={generateReport}
            disabled={generating}
            className="btn btn-secondary btn-small"
          >
            <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
            更新
          </button>
        </div>

        <div className="text-center py-8">
          <Eye className="w-12 h-12 text-[var(--color-icon-muted)] mx-auto mb-4" />
          <p className="text-[var(--color-text-secondary)] mb-2">分析データがまだありません</p>
          <p className="text-sm text-[var(--color-text-tertiary)]">
            コンテンツを追加すると、AI Visibility分析が利用可能になります
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`card p-6 ${className}`}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Brain className="w-6 h-6 text-purple-600" />
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">AI Visibilityレポート</h3>
        </div>
        <button
          onClick={generateReport}
          disabled={generating}
          className="btn btn-secondary btn-small"
        >
          <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
          更新
        </button>
      </div>

      {/* 総合スコア */}
      <div className="mb-6 p-4 rounded-lg bg-purple-50">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-purple-900 mb-1">総合スコア</div>
            <div className={`text-3xl font-bold ${getScoreColor(metrics.overallScore)}`}>
              {metrics.overallScore}/100
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-[var(--color-text-tertiary)]">分析URL数</div>
            <div className="text-lg font-semibold text-[var(--color-text-primary)]">
              {metrics.totalAnalyzedUrls}件
            </div>
          </div>
        </div>
      </div>

      {/* メトリクス概要 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-[var(--aio-surface)]">
          <div className="flex items-center gap-3 mb-2">
            <Brain className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-[var(--color-text-secondary)]">構造化データ</span>
          </div>
          <div className={`text-2xl font-bold ${getScoreColor(metrics.structuredDataScore)}`}>
            {metrics.structuredDataScore}/100
          </div>
        </div>

        <div className="p-4 rounded-lg bg-[var(--aio-surface)]">
          <div className="flex items-center gap-3 mb-2">
            <Search className="w-5 h-5 text-[var(--aio-primary)]" />
            <span className="text-sm font-medium text-[var(--color-text-secondary)]">AIアクセス</span>
          </div>
          <div className={`text-2xl font-bold ${getScoreColor(metrics.aiAccessScore)}`}>
            {metrics.aiAccessScore}/100
          </div>
        </div>

        <div className="p-4 rounded-lg bg-[var(--aio-surface)]">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-[var(--color-text-secondary)]">SEOパフォーマンス</span>
          </div>
          <div className={`text-2xl font-bold ${getScoreColor(metrics.seoPerformanceScore)}`}>
            {metrics.seoPerformanceScore}/100
          </div>
        </div>
      </div>

      {/* サマリー */}
      <div className="mb-6 p-4 rounded-lg bg-slate-50">
        <h4 className="font-medium text-[var(--color-text-primary)] mb-3">パフォーマンスサマリー</h4>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-[var(--color-text-tertiary)] mb-1">高パフォーマンス（80点以上）</div>
            <div className="text-lg font-bold text-green-600">
              {metrics.topPerformingUrls}件
            </div>
          </div>

          <div>
            <div className="text-sm text-[var(--color-text-tertiary)] mb-1">改善が必要（50点以下）</div>
            <div className="text-lg font-bold text-[var(--aio-warning)]">
              {metrics.improvementNeededUrls}件
            </div>
          </div>
        </div>
      </div>

      {/* フッター */}
      {metrics.lastUpdated && (
        <div className="text-xs text-[var(--color-text-tertiary)] border-t pt-4">
          最終更新: {new Date(metrics.lastUpdated).toLocaleString('ja-JP')}
        </div>
      )}
    </div>
  );
}

export default AIVisibilityReport;