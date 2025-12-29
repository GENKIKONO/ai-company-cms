'use client';

/**
 * Analytics Panel Component
 * アナリティクスパネル
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { HIGButton } from '@/components/ui/HIGButton';

interface AnalyticsSummary {
  total_events: number;
  by_event_key: Array<{ event_key: string; count: number }>;
  by_date: Array<{ date: string; count: number }>;
}

interface AnalyticsEvent {
  id: string;
  user_id: string;
  event_key: string;
  feature_id: string | null;
  properties: Record<string, unknown> | null;
  created_at: string;
  feature?: {
    key: string;
    name: string;
  };
}

export function AnalyticsPanel() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<'summary' | 'list'>('summary');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const params = new URLSearchParams({
          mode: view,
          start_date: `${dateRange.start}T00:00:00Z`,
          end_date: `${dateRange.end}T23:59:59Z`,
        });

        const res = await fetch(`/api/admin/billing/analytics?${params}`);
        if (!res.ok) throw new Error('Failed to fetch analytics');

        const data = await res.json();

        if (view === 'summary') {
          setSummary(data);
        } else {
          setEvents(data.data || []);
        }
      } catch (err) {
        toast.error('アナリティクスの取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [view, dateRange]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await fetch('/api/admin/billing/analytics/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_date: `${dateRange.start}T00:00:00Z`,
          end_date: `${dateRange.end}T23:59:59Z`,
        }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || 'Export failed');
      }

      // レスポンスがCSVの場合
      const contentType = res.headers.get('content-type');
      if (contentType?.includes('text/csv')) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-export-${dateRange.start}-${dateRange.end}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('CSVをダウンロードしました');
        return;
      }

      // JSONレスポンスの場合（署名URL）
      const { download_url, row_count } = await res.json();
      if (download_url) {
        window.open(download_url, '_blank');
        toast.success(`${row_count}件のデータをエクスポートしました`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'エクスポートに失敗しました');
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--aio-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-lg font-medium text-[var(--aio-text)]">Analytics</h2>
          <p className="text-sm text-[var(--aio-text-muted)]">
            イベント分析・CSVエクスポート
          </p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="px-3 py-2 border border-[var(--aio-border)] rounded-md bg-[var(--aio-background)] text-[var(--aio-text)]"
            />
            <span className="text-[var(--aio-text-muted)]">〜</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="px-3 py-2 border border-[var(--aio-border)] rounded-md bg-[var(--aio-background)] text-[var(--aio-text)]"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView('summary')}
              className={`px-3 py-1 rounded text-sm ${
                view === 'summary'
                  ? 'bg-[var(--aio-primary)] text-white'
                  : 'bg-[var(--aio-surface)] text-[var(--aio-text)]'
              }`}
            >
              サマリー
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1 rounded text-sm ${
                view === 'list'
                  ? 'bg-[var(--aio-primary)] text-white'
                  : 'bg-[var(--aio-surface)] text-[var(--aio-text)]'
              }`}
            >
              リスト
            </button>
          </div>
          <HIGButton onClick={handleExport} disabled={isExporting}>
            {isExporting ? 'エクスポート中...' : 'CSVエクスポート'}
          </HIGButton>
        </div>
      </div>

      {view === 'summary' && summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 総イベント数 */}
          <div className="bg-[var(--aio-surface)] rounded-lg border border-[var(--aio-border)] p-6">
            <h3 className="text-sm font-medium text-[var(--aio-text-muted)] mb-2">総イベント数</h3>
            <div className="text-3xl font-bold text-[var(--aio-text)]">
              {summary.total_events.toLocaleString()}
            </div>
          </div>

          {/* イベント別 */}
          <div className="bg-[var(--aio-surface)] rounded-lg border border-[var(--aio-border)] p-6">
            <h3 className="text-sm font-medium text-[var(--aio-text-muted)] mb-4">イベント別</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {summary.by_event_key.slice(0, 10).map((item) => (
                <div key={item.event_key} className="flex justify-between text-sm">
                  <span className="font-mono text-[var(--aio-text)]">{item.event_key}</span>
                  <span className="text-[var(--aio-text-muted)]">{item.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 日別チャート（簡易版） */}
          <div className="bg-[var(--aio-surface)] rounded-lg border border-[var(--aio-border)] p-6 md:col-span-2">
            <h3 className="text-sm font-medium text-[var(--aio-text-muted)] mb-4">日別推移</h3>
            <div className="flex items-end gap-1 h-32">
              {summary.by_date.map((item) => {
                const maxCount = Math.max(...summary.by_date.map((d) => d.count), 1);
                const height = (item.count / maxCount) * 100;
                return (
                  <div
                    key={item.date}
                    className="flex-1 bg-[var(--aio-primary)] rounded-t opacity-70 hover:opacity-100 transition-opacity"
                    style={{ height: `${height}%` }}
                    title={`${item.date}: ${item.count}`}
                  />
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-[var(--aio-text-muted)] mt-2">
              <span>{summary.by_date[0]?.date}</span>
              <span>{summary.by_date[summary.by_date.length - 1]?.date}</span>
            </div>
          </div>
        </div>
      )}

      {view === 'list' && (
        <div className="bg-[var(--aio-surface)] rounded-lg border border-[var(--aio-border)] overflow-hidden">
          <table className="min-w-full divide-y divide-[var(--aio-border)]">
            <thead className="bg-[var(--aio-surface-secondary)]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--aio-text-muted)] uppercase">日時</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--aio-text-muted)] uppercase">イベント</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--aio-text-muted)] uppercase">機能</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--aio-text-muted)] uppercase">ユーザーID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--aio-border)]">
              {events.map((event) => (
                <tr key={event.id}>
                  <td className="px-4 py-3 text-sm text-[var(--aio-text-muted)]">
                    {new Date(event.created_at).toLocaleString('ja-JP')}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-[var(--aio-text)]">{event.event_key}</td>
                  <td className="px-4 py-3 text-sm text-[var(--aio-text)]">
                    {event.feature?.name || '-'}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-[var(--aio-text-muted)]">
                    {event.user_id.slice(0, 8)}...
                  </td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-[var(--aio-text-muted)]">
                    イベントがありません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
