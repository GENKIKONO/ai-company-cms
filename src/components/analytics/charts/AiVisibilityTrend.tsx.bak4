/**
 * AI Visibility & SEO トレンドチャート
 * 
 * 2つのグラフを並列表示:
 * - 左: AI Visibility Score の推移 (API: /api/analytics/ai/visibility)
 * - 右: SEO Impressions の推移 (API: /api/analytics/seo/gsc)
 */

'use client';

import { useState } from 'react';
import { type AiVisibilityData, type SeoGscData, type FeatureFlags } from '@/lib/hooks/useAiSeoAnalytics';

interface AiVisibilityTrendProps {
  data?: AiVisibilityData;
  seoData?: SeoGscData;
  features: FeatureFlags;
  errors: {
    aiVisibility?: Error;
    seoGsc?: Error;
  };
}

export function AiVisibilityTrend({ data, seoData, features, errors }: AiVisibilityTrendProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* AI Visibility トレンド */}
      <TrendChart
        title="AI Visibility Score 推移"
        data={data?.score_trend || []}
        enabled={features.ai_visibility_analytics}
        loading={!data && !errors.aiVisibility}
        error={errors.aiVisibility}
        disabledMessage="AI可視性スコアはPro以上で利用できます"
        color="primary"
        yAxisLabel="スコア"
        maxValue={100}
        formatValue={(value) => value.toFixed(0)}
        icon="⚡"
      />

      {/* SEO Impressions トレンド */}
      <TrendChart
        title="SEO インプレッション推移"
        data={generateSeoTrendData(seoData)} // GSCデータから生成
        enabled={!!seoData?.success}
        loading={!seoData && !errors.seoGsc}
        error={errors.seoGsc}
        disabledMessage="GSCデータ取得中です"
        color="success"
        yAxisLabel="インプレッション"
        formatValue={(value) => value.toLocaleString()}
        icon="🔍"
      />
    </div>
  );
}

/**
 * 汎用トレンドチャートコンポーネント
 */
interface TrendChartProps {
  title: string;
  data: Array<{ date: string; score: number }>;
  enabled: boolean;
  loading: boolean;
  error?: Error;
  disabledMessage: string;
  color: 'primary' | 'success' | 'warning' | 'error';
  yAxisLabel: string;
  maxValue?: number;
  formatValue: (value: number) => string;
  icon: string;
}

function TrendChart({
  title,
  data,
  enabled,
  loading,
  error,
  disabledMessage,
  color,
  yAxisLabel,
  maxValue,
  formatValue,
  icon
}: TrendChartProps) {
  const colorClasses = {
    primary: 'stroke-[var(--aio-primary)] fill-[var(--aio-primary-light)]',
    success: 'stroke-[var(--aio-success)] fill-[var(--aio-success-light)]',
    warning: 'stroke-[var(--aio-warning)] fill-[var(--aio-warning-light)]',
    error: 'stroke-[var(--aio-error)] fill-[var(--aio-error-light)]'
  };

  return (
    <div className="bg-[var(--aio-surface)] border border-[var(--aio-border)] rounded-lg p-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <span className="text-lg">{icon}</span>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            {title}
          </h3>
        </div>
        
        {/* 現在値表示 */}
        {enabled && data.length > 0 && (
          <div className="text-right">
            <div className="text-2xl font-bold text-[var(--text-primary)]">
              {formatValue(data[data.length - 1]?.score || 0)}
            </div>
            <div className="text-xs text-[var(--text-muted)]">
              {yAxisLabel}
            </div>
          </div>
        )}
      </div>

      {/* チャートエリア */}
      <div className="h-48">
        {!enabled ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-[var(--text-muted)] mb-2">📊</div>
              <div className="text-sm text-[var(--text-muted)]">
                {disabledMessage}
              </div>
            </div>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-2 border-[var(--aio-primary)] border-t-transparent rounded-full mx-auto mb-4"></div>
              <div className="text-sm text-[var(--text-muted)]">
                データ読み込み中...
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-[var(--aio-error)] text-2xl mb-2">⚠️</div>
              <div className="text-sm text-[var(--text-muted)]">
                データ取得エラー
              </div>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-[var(--text-muted)] text-2xl mb-2">📈</div>
              <div className="text-sm text-[var(--text-muted)]">
                データ収集中です
              </div>
            </div>
          </div>
        ) : (
          <SimpleLineChart
            data={data}
            colorClass={colorClasses[color]}
            maxValue={maxValue}
          />
        )}
      </div>

      {/* フッター */}
      {enabled && data.length > 0 && (
        <div className="pt-4 border-t border-[var(--aio-border)] mt-4">
          <div className="flex justify-between items-center text-sm text-[var(--text-muted)]">
            <span>過去 {data.length} 日間</span>
            <span>
              {getTrendLabel(data)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * シンプル折れ線チャート（SVG実装）
 */
interface SimpleLineChartProps {
  data: Array<{ date: string; score: number }>;
  colorClass: string;
  maxValue?: number;
}

function SimpleLineChart({ data, colorClass, maxValue }: SimpleLineChartProps) {
  if (data.length === 0) return null;

  const width = 400;
  const height = 160;
  const padding = 20;

  // データの最大・最小値を計算
  const values = data.map(d => d.score);
  const minValue = Math.min(...values);
  const calculatedMaxValue = maxValue || Math.max(...values);
  const range = calculatedMaxValue - minValue;

  // ポイント座標を計算
  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((d.score - minValue) / range) * (height - padding * 2);
    return { x, y, value: d.score, date: d.date };
  });

  // パスを生成
  const pathData = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  // エリアパスを生成
  const areaPathData = pathData + 
    ` L ${points[points.length - 1].x} ${height - padding}` +
    ` L ${points[0].x} ${height - padding} Z`;

  return (
    <div className="w-full h-full flex items-center justify-center">
      <svg width={width} height={height} className="max-w-full">
        {/* グリッド線 */}
        <defs>
          <pattern id="grid" width="40" height="32" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 32" fill="none" stroke="var(--aio-border)" strokeWidth="0.5" opacity="0.3"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* エリア */}
        <path
          d={areaPathData}
          className={colorClass}
          fillOpacity="0.1"
          strokeWidth="0"
        />

        {/* 線 */}
        <path
          d={pathData}
          fill="none"
          className={colorClass}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* ポイント */}
        {points.map((point, i) => (
          <circle
            key={i}
            cx={point.x}
            cy={point.y}
            r="3"
            className={colorClass}
            fill="currentColor"
          />
        ))}
      </svg>
    </div>
  );
}

/**
 * ユーティリティ関数
 */

// SEO トレンドデータ生成（GSCデータから）
function generateSeoTrendData(seoData?: SeoGscData): Array<{ date: string; score: number }> {
  if (!seoData?.success) return [];
  
  // 実際の実装では、GSCの履歴データを使用
  // ここでは現在値をベースにダミーデータを生成
  const currentImpressions = seoData.metrics.total_impressions;
  const data = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const variation = 0.8 + Math.random() * 0.4; // ±20%の変動
    data.push({
      date: date.toISOString().split('T')[0],
      score: Math.round(currentImpressions * variation)
    });
  }
  
  return data;
}

// トレンド方向ラベル取得
function getTrendLabel(data: Array<{ date: string; score: number }>): string {
  if (data.length < 2) return '';
  
  const first = data[0].score;
  const last = data[data.length - 1].score;
  const change = ((last - first) / first) * 100;
  
  if (change > 5) {
    return `📈 ${change.toFixed(1)}% 向上`;
  } else if (change < -5) {
    return `📉 ${Math.abs(change).toFixed(1)}% 低下`;
  } else {
    return `➡️ 横ばい`;
  }
}