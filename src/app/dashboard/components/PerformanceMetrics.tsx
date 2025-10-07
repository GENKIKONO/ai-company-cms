'use client';

import { useEffect, useState } from 'react';
import { serverFetch } from '@/lib/serverFetch';

interface DashboardStats {
  ok: boolean;
  counts: {
    services: { count: number | null; missing: boolean };
    case_studies: { count: number | null; missing: boolean };
    posts: { count: number | null; missing: boolean };
    faqs: { count: number | null; missing: boolean };
    contacts: { count: number | null; missing: boolean };
  };
  analytics: {
    pageViews: number | null | undefined;
    avgDurationSec: number | null | undefined;
    conversionRate: number | null | undefined;
  };
  missingTables: string[];
}

// 安全な数値正規化ヘルパー
const nz = (value: number | null | undefined): number => {
  return typeof value === 'number' && !isNaN(value) ? value : 0;
};

// 安全なstats正規化ヘルパー
const normalizeStats = (stats: DashboardStats | null): DashboardStats => {
  if (!stats) {
    return {
      ok: false,
      counts: {
        services: { count: 0, missing: true },
        case_studies: { count: 0, missing: true },
        posts: { count: 0, missing: true },
        faqs: { count: 0, missing: true },
        contacts: { count: 0, missing: true },
      },
      analytics: {
        pageViews: 0,
        avgDurationSec: 0,
        conversionRate: 0,
      },
      missingTables: []
    };
  }
  
  return {
    ...stats,
    analytics: {
      pageViews: nz(stats.analytics?.pageViews),
      avgDurationSec: nz(stats.analytics?.avgDurationSec),
      conversionRate: nz(stats.analytics?.conversionRate),
    }
  };
};

export default function PerformanceMetrics() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/dashboard/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          // API失敗時もデフォルトスキーマで表示を継続
          setStats({
            ok: false,
            counts: {
              services: { count: 0, missing: true },
              case_studies: { count: 0, missing: true },
              posts: { count: 0, missing: true },
              faqs: { count: 0, missing: true },
              contacts: { count: 0, missing: true }
            },
            analytics: { pageViews: 0, avgDurationSec: 0, conversionRate: 0 },
            missingTables: []
          });
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
        // 通信失敗時もクラッシュを防ぐ
        setStats({
          ok: false,
          counts: {
            services: { count: 0, missing: true },
            case_studies: { count: 0, missing: true },
            posts: { count: 0, missing: true },
            faqs: { count: 0, missing: true },
            contacts: { count: 0, missing: true }
          },
          analytics: { pageViews: 0, avgDurationSec: 0, conversionRate: 0 },
          missingTables: []
        });
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="text-center animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-16 mx-auto mb-1"></div>
            <div className="h-4 bg-gray-200 rounded w-20 mx-auto"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-red-500">統計データの取得に失敗しました</p>
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
  const safeStats = normalizeStats(stats);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-700 mb-1">
          {safeStats.analytics.pageViews || '—'}
        </div>
        <div className="text-sm text-gray-500">ページビュー</div>
        {safeStats.analytics.pageViews === 0 && (
          <div className="text-xs text-gray-400 mt-1" title="解析テーブル未設定">
            未設定
          </div>
        )}
      </div>
      
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-700 mb-1">
          {displayValue(safeStats.counts.contacts.count, safeStats.counts.contacts.missing)}
        </div>
        <div className="text-sm text-gray-500">問い合わせ</div>
        {safeStats.counts.contacts.missing && (
          <div className="text-xs text-gray-400 mt-1" title="contactsテーブル未作成">
            テーブル未作成
          </div>
        )}
      </div>
      
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-700 mb-1">
          {safeStats.analytics.conversionRate > 0 
            ? `${safeStats.analytics.conversionRate}%` 
            : '—'
          }
        </div>
        <div className="text-sm text-gray-500">コンバージョン率</div>
        {safeStats.analytics.conversionRate === 0 && (
          <div className="text-xs text-gray-400 mt-1" title="解析テーブル未設定">
            未設定
          </div>
        )}
      </div>
      
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-700 mb-1">
          {safeStats.analytics.avgDurationSec > 0 
            ? formatDuration(safeStats.analytics.avgDurationSec)
            : '—'
          }
        </div>
        <div className="text-sm text-gray-500">平均滞在時間</div>
        {safeStats.analytics.avgDurationSec === 0 && (
          <div className="text-xs text-gray-400 mt-1" title="解析テーブル未設定">
            未設定
          </div>
        )}
      </div>
    </div>
  );
}