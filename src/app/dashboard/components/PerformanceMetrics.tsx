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
    pageViews: number;
    avgDurationSec: number;
    conversionRate: number;
  };
  missingTables: string[];
}

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
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
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

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-700 mb-1">
          {stats.analytics.pageViews || '—'}
        </div>
        <div className="text-sm text-gray-500">ページビュー</div>
        {stats.analytics.pageViews === 0 && (
          <div className="text-xs text-gray-400 mt-1" title="解析テーブル未設定">
            未設定
          </div>
        )}
      </div>
      
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-700 mb-1">
          {displayValue(stats.counts.contacts.count, stats.counts.contacts.missing)}
        </div>
        <div className="text-sm text-gray-500">問い合わせ</div>
        {stats.counts.contacts.missing && (
          <div className="text-xs text-gray-400 mt-1" title="contactsテーブル未作成">
            テーブル未作成
          </div>
        )}
      </div>
      
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-700 mb-1">
          {stats.analytics.conversionRate > 0 
            ? `${stats.analytics.conversionRate}%` 
            : '—'
          }
        </div>
        <div className="text-sm text-gray-500">コンバージョン率</div>
        {stats.analytics.conversionRate === 0 && (
          <div className="text-xs text-gray-400 mt-1" title="解析テーブル未設定">
            未設定
          </div>
        )}
      </div>
      
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-700 mb-1">
          {stats.analytics.avgDurationSec > 0 
            ? formatDuration(stats.analytics.avgDurationSec)
            : '—'
          }
        </div>
        <div className="text-sm text-gray-500">平均滞在時間</div>
        {stats.analytics.avgDurationSec === 0 && (
          <div className="text-xs text-gray-400 mt-1" title="解析テーブル未設定">
            未設定
          </div>
        )}
      </div>
    </div>
  );
}