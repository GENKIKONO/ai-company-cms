/**
 * AI × SEO 統合分析ダッシュボード
 * 
 * レイアウト構成:
 * - 上段: 4つのサマリーカード（モバイルは縦並び）
 * - 中段: 2カラム（AI×SEOマトリクス + トップコンテンツ）
 * - 下段: トレンドチャート
 * - 最下段: アクションボタン
 */

'use client';

import { useState } from 'react';
import { useAiSeoAnalytics, type FeatureFlags } from '@/lib/hooks/useAiSeoAnalytics';
import { AISummaryCards } from '@/components/analytics/cards/AISummaryCards';
import { AiSeoMatrix } from '@/components/analytics/charts/AiSeoMatrix';
import { AiVisibilityTrend } from '@/components/analytics/charts/AiVisibilityTrend';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { RefreshButton } from '@/components/ui/RefreshButton';
import { ExportButton } from '@/components/ui/ExportButton';

interface AISEODashboardProps {
  orgId: string;
  features: FeatureFlags;
}

export function AISEODashboard({ orgId, features }: AISEODashboardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // 全てのAI×SEO分析データを取得
  const { 
    botSummary, 
    aiVisibility, 
    seoGsc, 
    aiSeoCombined,
    isLoading,
    hasError,
    errors,
    mutate 
  } = useAiSeoAnalytics(orgId);

  // 手動データ更新
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await mutate();
    } finally {
      setIsRefreshing(false);
    }
  };

  // CSV/JSONエクスポート
  const handleExport = (format: 'csv' | 'json') => {
    if (!features.ai_reports) return;
    
    // API: GET /api/analytics/export?org_id=${orgId}&format=${format}
    const url = `/api/analytics/export?org_id=${orgId}&format=${format}`;
    window.open(url, '_blank');
  };

  // 初期ローディング
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-[var(--text-muted)]">分析データを読み込み中...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 1. サマリーカード行（上段） */}
      <section>
        <AISummaryCards
          botSummary={botSummary}
          aiVisibility={aiVisibility}
          seoGsc={seoGsc}
          aiSeoCombined={aiSeoCombined}
          features={features}
          errors={errors}
        />
      </section>

      {/* 2. メイン分析セクション（中段） */}
      <section className="grid lg:grid-cols-3 gap-6">
        {/* AI × SEO マトリクス（2カラム分） */}
        <div className="lg:col-span-2">
          <AiSeoMatrix
            data={aiSeoCombined}
            features={features}
            error={errors.aiSeoCombined}
          />
        </div>

        {/* トップコンテンツ（1カラム分） */}
        <div className="space-y-6">
          {/* AIボット流入トップコンテンツ */}
          <TopContentCard
            title="AI Botアクセス Top 5"
            data={botSummary?.top_content || []}
            enabled={features.ai_bot_analytics}
            emptyMessage="AI Botの流入データは現在のプランでは取得していません"
          />

          {/* SEO流入トップページ */}
          <TopContentCard
            title="SEO流入 Top 5"
            data={seoGsc?.top_pages?.slice(0, 5).map(page => ({
              url: page.url,
              title: page.url.split('/').pop() || 'ページ',
              hits: page.clicks,
              unique_bots: page.impressions
            })) || []}
            enabled={!!seoGsc?.success}
            emptyMessage="SEOデータを取得中です"
            metric="クリック"
          />
        </div>
      </section>

      {/* 3. トレンド分析セクション（下段） */}
      <section>
        <AiVisibilityTrend
          data={aiVisibility}
          seoData={seoGsc}
          features={features}
          errors={errors}
        />
      </section>

      {/* 4. アクションボタン（最下段） */}
      <section className="flex justify-between items-center pt-6 border-t border-[var(--aio-border)]">
        <div className="flex space-x-4">
          {/* データ再読み込み */}
          <RefreshButton
            onClick={handleRefresh}
            isLoading={isRefreshing}
            disabled={isRefreshing}
          />

          {/* GSC データ再取得 */}
          <button
            className="px-4 py-2 bg-[var(--aio-surface-hover)] text-[var(--text-primary)] rounded-md hover:bg-[var(--aio-surface-active)] transition-colors disabled:opacity-50"
            disabled={!features.ai_visibility_analytics}
            onClick={() => {
              // API: POST /api/analytics/seo/gsc で強制更新
              fetch(`/api/analytics/seo/gsc`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ org_id: orgId, force_refresh: true })
              }).then(() => mutate());
            }}
          >
            📊 GSCデータ更新
          </button>
        </div>

        <div className="flex space-x-2">
          {/* エクスポートボタン */}
          <ExportButton
            onExport={handleExport}
            enabled={features.ai_reports}
            formats={['csv', 'json']}
          />
        </div>
      </section>

      {/* エラー表示（APIが全て失敗した場合） */}
      {hasError && (
        <div className="bg-[var(--aio-error-light)] border border-[var(--aio-error)] rounded-lg p-4 mt-6">
          <h3 className="font-semibold text-[var(--aio-error)] mb-2">
            データの取得に失敗しました
          </h3>
          <p className="text-[var(--text-muted)] text-sm">
            ネットワーク接続を確認して、再読み込みボタンをクリックしてください。
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * トップコンテンツカード
 * AI Bot流入・SEO流入の上位コンテンツを表示
 */
interface TopContentCardProps {
  title: string;
  data: Array<{
    url: string;
    title?: string;
    hits: number;
    unique_bots: number;
  }>;
  enabled: boolean;
  emptyMessage: string;
  metric?: string;
}

function TopContentCard({ title, data, enabled, emptyMessage, metric = "ヒット" }: TopContentCardProps) {
  return (
    <div className="bg-[var(--aio-surface)] border border-[var(--aio-border)] rounded-lg p-6">
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
        {title}
      </h3>

      {!enabled ? (
        <div className="text-center py-8">
          <div className="text-[var(--text-muted)] text-sm">
            {emptyMessage}
          </div>
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-[var(--text-muted)] text-sm">
            データ収集中です
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((item, index) => (
            <div key={index} className="flex justify-between items-center py-2">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-[var(--text-primary)] truncate">
                  {item.title || item.url.split('/').pop() || 'ページ'}
                </div>
                <div className="text-xs text-[var(--text-muted)] truncate">
                  {item.url}
                </div>
              </div>
              <div className="text-right ml-4">
                <div className="text-sm font-semibold text-[var(--text-primary)]">
                  {item.hits.toLocaleString()}
                </div>
                <div className="text-xs text-[var(--text-muted)]">
                  {metric}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}