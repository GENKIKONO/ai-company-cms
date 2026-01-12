'use client';

import { useEffect, useState } from 'react';
import { normalizeDashboardStats, getDefaultStats, type DashboardStats } from '@/lib/normalizers/dashboard';
import { logger } from '@/lib/utils/logger';

interface PerformanceMetricsProps {
  organizationId: string;
}

export default function PerformanceMetrics({ organizationId }: PerformanceMetricsProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        if (!organizationId) {
          setStats(getDefaultStats());
          return;
        }
        
        const response = await fetch(`/api/dashboard/stats?organizationId=${organizationId}`);
        if (response.ok) {
          const data = await response.json().catch(() => ({}));
          setStats(data);
        } else {
          // API失敗時もデフォルトスキーマで表示を継続
          setStats(getDefaultStats());
        }
      } catch (error) {
        logger.error('Failed to fetch dashboard stats', { data: error instanceof Error ? error : new Error(String(error)) });
        // 通信失敗時もクラッシュを防ぐ
        setStats(getDefaultStats());
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [organizationId]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="text-center animate-pulse">
            <div className="h-8 bg-[var(--dashboard-card-border)] rounded w-16 mx-auto mb-1"></div>
            <div className="h-4 bg-[var(--dashboard-card-border)] rounded w-20 mx-auto"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-[var(--aio-danger)]">統計データの取得に失敗しました</p>
      </div>
    );
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const displayValue = (count: number | null, missing: boolean, fallback = '—') => {
    if (missing || count === null) return fallback;
    return count.toString();
  };

  // 安全に正規化されたstatsを使用
  const safeStats = normalizeDashboardStats(stats);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="text-center">
        <div className="text-2xl font-bold text-[var(--color-text-secondary)] mb-1">
          {safeStats.analytics.pageViews || '—'}
        </div>
        <div className="text-sm text-[var(--color-text-tertiary)]">ページビュー</div>
        {safeStats.analytics.pageViews === 0 && (
          <div className="text-xs text-[var(--color-text-tertiary)] mt-1" title="解析テーブル未設定">
            未設定
          </div>
        )}
      </div>

      <div className="text-center">
        <div className="text-2xl font-bold text-[var(--color-text-secondary)] mb-1">
          {displayValue(safeStats.counts.contacts.count, safeStats.counts.contacts.missing)}
        </div>
        <div className="text-sm text-[var(--color-text-tertiary)]">問い合わせ</div>
        {safeStats.counts.contacts.missing && (
          <div className="text-xs text-[var(--color-text-tertiary)] mt-1" title="contactsテーブル未作成">
            テーブル未作成
          </div>
        )}
      </div>

      <div className="text-center">
        <div className="text-2xl font-bold text-[var(--color-text-secondary)] mb-1">
          {safeStats.analytics.conversionRate > 0
            ? `${safeStats.analytics.conversionRate}%`
            : '—'
          }
        </div>
        <div className="text-sm text-[var(--color-text-tertiary)]">コンバージョン率</div>
        {safeStats.analytics.conversionRate === 0 && (
          <div className="text-xs text-[var(--color-text-tertiary)] mt-1" title="解析テーブル未設定">
            未設定
          </div>
        )}
      </div>

      <div className="text-center">
        <div className="text-2xl font-bold text-[var(--color-text-secondary)] mb-1">
          {safeStats.analytics.avgDurationSec > 0
            ? formatDuration(safeStats.analytics.avgDurationSec)
            : '—'
          }
        </div>
        <div className="text-sm text-[var(--color-text-tertiary)]">平均滞在時間</div>
        {safeStats.analytics.avgDurationSec === 0 && (
          <div className="text-xs text-[var(--color-text-tertiary)] mt-1" title="解析テーブル未設定">
            未設定
          </div>
        )}
      </div>
    </div>
  );
}