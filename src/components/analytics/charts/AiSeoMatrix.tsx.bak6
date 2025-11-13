/**
 * AI × SEO パフォーマンスマトリクス
 * 
 * 4象限表示:
 * - AI強 × SEO強: 理想的パフォーマンス
 * - AI強 × SEO弱: SEO最適化で効果期待
 * - AI弱 × SEO強: 構造化データ改善で効果期待  
 * - AI弱 × SEO弱: 包括的改善が必要
 * 
 * API: GET /api/analytics/ai/combined
 */

'use client';

import { useState } from 'react';
import { type AiSeoCombinedData, type FeatureFlags } from '@/lib/hooks/useAiSeoAnalytics';

interface AiSeoMatrixProps {
  data?: AiSeoCombinedData;
  features: FeatureFlags;
  error?: Error;
}

export function AiSeoMatrix({ data, features, error }: AiSeoMatrixProps) {
  const [selectedQuadrant, setSelectedQuadrant] = useState<string | null>(null);

  // 機能が無効な場合
  if (!features.ai_visibility_analytics) {
    return (
      <div className="bg-[var(--aio-surface)] border border-[var(--aio-border)] rounded-lg p-8">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          AI × SEO パフォーマンスマトリクス
        </h3>
        <div className="text-center py-12">
          <div className="text-[var(--text-muted)]">
            AI×SEO相関分析は現在のプランでは利用できません
          </div>
        </div>
      </div>
    );
  }

  // エラー状態
  if (error) {
    return (
      <div className="bg-[var(--aio-surface)] border border-[var(--aio-border)] rounded-lg p-8">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          AI × SEO パフォーマンスマトリクス
        </h3>
        <div className="text-center py-12">
          <div className="text-[var(--aio-error)] mb-2">⚠️ データ取得エラー</div>
          <div className="text-[var(--text-muted)] text-sm">
            ネットワーク接続を確認してください
          </div>
        </div>
      </div>
    );
  }

  // ローディング状態
  if (!data) {
    return (
      <div className="bg-[var(--aio-surface)] border border-[var(--aio-border)] rounded-lg p-8">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          AI × SEO パフォーマンスマトリクス
        </h3>
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-[var(--aio-primary)] border-t-transparent rounded-full mx-auto mb-4"></div>
          <div className="text-[var(--text-muted)]">相関分析中...</div>
        </div>
      </div>
    );
  }

  const quadrants = data.quadrants;
  const correlation = data.ai_seo_correlation;

  return (
    <div className="bg-[var(--aio-surface)] border border-[var(--aio-border)] rounded-lg p-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            AI × SEO パフォーマンスマトリクス
          </h3>
          <div className="flex items-center space-x-4 text-sm text-[var(--text-muted)]">
            <span>相関係数: {correlation.correlation_score.toFixed(2)}</span>
            <span>強度: {getCorrelationLabel(correlation.correlation_strength)}</span>
            <span>サンプル: {correlation.sample_size} URL</span>
          </div>
        </div>
      </div>

      {/* 4象限マトリクス */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* AI強 × SEO強 */}
        <QuadrantCard
          title="理想的パフォーマンス"
          subtitle="AI強 × SEO強"
          data={quadrants.ai_strong_seo_strong}
          color="success"
          icon="🌟"
          isSelected={selectedQuadrant === 'ai_strong_seo_strong'}
          onClick={() => setSelectedQuadrant(
            selectedQuadrant === 'ai_strong_seo_strong' ? null : 'ai_strong_seo_strong'
          )}
        />

        {/* AI弱 × SEO強 */}
        <QuadrantCard
          title="AI最適化で改善"
          subtitle="AI弱 × SEO強"
          data={quadrants.ai_weak_seo_strong}
          color="warning"
          icon="🔧"
          isSelected={selectedQuadrant === 'ai_weak_seo_strong'}
          onClick={() => setSelectedQuadrant(
            selectedQuadrant === 'ai_weak_seo_strong' ? null : 'ai_weak_seo_strong'
          )}
        />

        {/* AI強 × SEO弱 */}
        <QuadrantCard
          title="SEO最適化で改善"
          subtitle="AI強 × SEO弱"
          data={quadrants.ai_strong_seo_weak}
          color="primary"
          icon="📈"
          isSelected={selectedQuadrant === 'ai_strong_seo_weak'}
          onClick={() => setSelectedQuadrant(
            selectedQuadrant === 'ai_strong_seo_weak' ? null : 'ai_strong_seo_weak'
          )}
        />

        {/* AI弱 × SEO弱 */}
        <QuadrantCard
          title="包括的改善が必要"
          subtitle="AI弱 × SEO弱"
          data={quadrants.ai_weak_seo_weak}
          color="error"
          icon="⚠️"
          isSelected={selectedQuadrant === 'ai_weak_seo_weak'}
          onClick={() => setSelectedQuadrant(
            selectedQuadrant === 'ai_weak_seo_weak' ? null : 'ai_weak_seo_weak'
          )}
        />
      </div>

      {/* 詳細表示 */}
      {selectedQuadrant && (
        <QuadrantDetail
          quadrant={selectedQuadrant}
          data={quadrants[selectedQuadrant as keyof typeof quadrants]}
          onClose={() => setSelectedQuadrant(null)}
        />
      )}

      {/* サマリー */}
      <div className="pt-4 border-t border-[var(--aio-border)]">
        <div className="text-sm text-[var(--text-muted)]">
          <strong>{data.summary.total_analyzed_urls}</strong> URLを分析 • 
          平均AIスコア <strong>{data.summary.ai_visibility_avg.toFixed(0)}</strong> • 
          平均SEO順位 <strong>{data.summary.seo_position_avg.toFixed(1)}</strong>位
        </div>
      </div>
    </div>
  );
}

/**
 * 象限カードコンポーネント
 */
interface QuadrantCardProps {
  title: string;
  subtitle: string;
  data: Array<{
    url: string;
    title?: string;
    ai_score: number;
    seo_position: number;
    combined_score: number;
  }>;
  color: 'success' | 'warning' | 'primary' | 'error';
  icon: string;
  isSelected: boolean;
  onClick: () => void;
}

function QuadrantCard({ title, subtitle, data, color, icon, isSelected, onClick }: QuadrantCardProps) {
  const colorClasses = {
    success: 'bg-[var(--aio-success-light)] border-[var(--aio-success)] text-[var(--aio-success)]',
    warning: 'bg-[var(--aio-warning-light)] border-[var(--aio-warning)] text-[var(--aio-warning)]',
    primary: 'bg-[var(--aio-primary-light)] border-[var(--aio-primary)] text-[var(--aio-primary)]',
    error: 'bg-[var(--aio-error-light)] border-[var(--aio-error)] text-[var(--aio-error)]'
  };

  return (
    <button
      className={`
        relative p-4 rounded-lg border-2 text-left transition-all hover:shadow-md
        ${isSelected ? colorClasses[color] : 'bg-[var(--aio-surface-hover)] border-[var(--aio-border)] hover:border-[var(--aio-border-hover)]'}
      `}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0 flex-1">
          <h4 className={`font-semibold text-sm ${isSelected ? '' : 'text-[var(--text-primary)]'}`}>
            {title}
          </h4>
          <p className={`text-xs ${isSelected ? 'opacity-80' : 'text-[var(--text-muted)]'}`}>
            {subtitle}
          </p>
        </div>
        <span className="text-lg ml-2">{icon}</span>
      </div>

      <div className={`text-2xl font-bold ${isSelected ? '' : 'text-[var(--text-primary)]'}`}>
        {data.length}
      </div>
      <div className={`text-xs ${isSelected ? 'opacity-80' : 'text-[var(--text-muted)]'}`}>
        URL
      </div>

      {isSelected && (
        <div className="absolute top-2 right-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </button>
  );
}

/**
 * 象限詳細表示
 */
interface QuadrantDetailProps {
  quadrant: string;
  data: Array<{
    url: string;
    title?: string;
    ai_score: number;
    seo_position: number;
    combined_score: number;
  }>;
  onClose: () => void;
}

function QuadrantDetail({ quadrant, data, onClose }: QuadrantDetailProps) {
  const titles = {
    ai_strong_seo_strong: 'AI強 × SEO強 - 理想的パフォーマンス',
    ai_strong_seo_weak: 'AI強 × SEO弱 - SEO最適化で改善',
    ai_weak_seo_strong: 'AI弱 × SEO強 - AI最適化で改善',
    ai_weak_seo_weak: 'AI弱 × SEO弱 - 包括的改善が必要'
  };

  return (
    <div className="bg-[var(--aio-surface-hover)] rounded-lg p-4 border border-[var(--aio-border)]">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-semibold text-[var(--text-primary)]">
          {titles[quadrant as keyof typeof titles]}
        </h4>
        <button
          onClick={onClose}
          className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          ✕
        </button>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-4 text-[var(--text-muted)]">
          該当するURLはありません
        </div>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {data.slice(0, 10).map((item, index) => (
            <div key={index} className="flex justify-between items-center p-2 bg-[var(--aio-surface)] rounded text-sm">
              <div className="min-w-0 flex-1">
                <div className="font-medium text-[var(--text-primary)] truncate">
                  {item.title || item.url.split('/').pop() || 'ページ'}
                </div>
                <div className="text-xs text-[var(--text-muted)] truncate">
                  {item.url}
                </div>
              </div>
              <div className="text-right ml-4 space-x-3 text-xs">
                <span className="text-[var(--text-muted)]">
                  AI: {item.ai_score}
                </span>
                <span className="text-[var(--text-muted)]">
                  SEO: {item.seo_position.toFixed(1)}位
                </span>
                <span className="font-semibold text-[var(--text-primary)]">
                  総合: {item.combined_score}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * 相関強度ラベル取得
 */
function getCorrelationLabel(strength: string): string {
  switch (strength) {
    case 'strong': return '強い相関';
    case 'moderate': return '中程度の相関';
    case 'weak': return '弱い相関';
    case 'none': return '相関なし';
    default: return '不明';
  }
}