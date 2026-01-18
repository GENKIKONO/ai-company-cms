'use client';

/**
 * AI Reports Page - 新アーキテクチャ版
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardPageShell } from '@/components/dashboard';
import {
  DashboardPageHeader,
  DashboardCard,
  DashboardCardContent,
  DashboardAlert,
  DashboardButton,
} from '@/components/dashboard/ui';
import { Brain, Calendar, FileText, AlertCircle, RefreshCw } from 'lucide-react';
import { RegenerateButton } from './components/RegenerateButton';

interface MonthlyReport {
  id: string;
  plan_id: string;
  level: string;
  period_start: string;
  period_end: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface ReportsListResponse {
  reports: MonthlyReport[];
  organization_id: string;
}

export default function AiReportsPage() {
  return (
    <DashboardPageShell
      title="AI月次レポート"
      requiredRole="viewer"
      featureFlag="ai_reports"
    >
      <AiReportsContent />
    </DashboardPageShell>
  );
}

function AiReportsContent() {
  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/my/reports/monthly');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.message || 'レポート一覧の取得に失敗しました');
      }

      const data: ReportsListResponse = await response.json();
      setReports(data.reports);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知のエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const formatPeriod = (periodStart: string) => {
    const date = new Date(periodStart);
    return `${date.getFullYear()}年${date.getMonth() + 1}月`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--aio-success-muted)] text-[var(--aio-success)]">
            完了
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--aio-danger-muted)] text-[var(--aio-danger)]">
            失敗
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--aio-surface)] text-[var(--color-text-primary)]">
            {status}
          </span>
        );
    }
  };

  const getLevelLabel = (level: string) => {
    switch (level) {
      case 'light': return 'ライト版';
      case 'detail': return '詳細版';
      case 'advanced': return '高度版';
      case 'custom': return 'カスタム';
      default: return level;
    }
  };

  if (loading) {
    return (
      <div className=" p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-[var(--dashboard-card-border)] rounded w-1/4"></div>
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-[var(--dashboard-card-border)] rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className=" p-6">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Brain className="w-8 h-8 text-[var(--aio-primary)]" />
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">AI月次レポート</h1>
          </div>
          <p className="text-[var(--color-text-secondary)]">
            組織のコンテンツパフォーマンスとAI活用状況を月次で分析したレポートです。
          </p>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="mb-6 p-4 bg-[var(--aio-danger-muted)] border border-[var(--aio-danger)] rounded-lg">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-[var(--aio-danger)]" />
              <div>
                <p className="font-medium text-[var(--aio-danger)]">エラーが発生しました</p>
                <p className="text-sm text-[var(--aio-danger)]">{error}</p>
              </div>
              <button
                onClick={fetchReports}
                className="ml-auto p-1 text-[var(--aio-danger)] hover:text-[var(--aio-danger)]"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* レポート一覧 */}
        <div className="bg-white rounded-lg shadow">
          {reports.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="w-12 h-12 text-[var(--color-icon-muted)] mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
                レポートがまだありません
              </h3>
              <p className="text-[var(--color-text-secondary)]">
                月次レポートは毎月自動生成されます。しばらくお待ちください。
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--dashboard-card-border)]">
              {reports.map((report) => {
                const periodYYYYMM = report.period_start.substring(0, 7); // YYYY-MM
                
                return (
                  <div key={report.id} className="p-6 hover:bg-[var(--aio-surface)] transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Calendar className="w-5 h-5 text-[var(--aio-primary)]" />
                          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                            {formatPeriod(report.period_start)}レポート
                          </h3>
                          {getStatusBadge(report.status)}
                        </div>
                        
                        <div className="flex items-center gap-6 text-sm text-[var(--color-text-secondary)]">
                          <span>レベル: {getLevelLabel(report.level)}</span>
                          <span>作成日: {formatDate(report.created_at)}</span>
                          {report.updated_at !== report.created_at && (
                            <span>更新日: {formatDate(report.updated_at)}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* 再生成ボタン */}
                        <RegenerateButton 
                          period={periodYYYYMM}
                          disabled={report.status !== 'ready' && report.status !== 'failed'}
                          onRegenerated={fetchReports}
                        />
                        
                        {/* 詳細ボタン */}
                        {report.status === 'ready' ? (
                          <Link
                            href={`/dashboard/ai-reports/${periodYYYYMM}`}
                            className="px-4 py-2 bg-[var(--aio-primary)] text-white rounded-lg hover:bg-[var(--aio-primary)]/90 transition-colors"
                          >
                            詳細を見る
                          </Link>
                        ) : (
                          <span className="px-4 py-2 bg-[var(--aio-surface)] text-[var(--color-icon-muted)] rounded-lg cursor-not-allowed">
                            詳細を見る
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* フッター情報 */}
        <div className="mt-6 p-4 bg-[var(--aio-muted)] rounded-lg">
          <h4 className="font-medium text-[var(--aio-primary)] mb-2">レポートについて</h4>
          <ul className="text-sm text-[var(--aio-primary)] space-y-1">
            <li>• レポートは毎月1日に自動生成されます</li>
            <li>• 過去12ヶ月分のレポートを閲覧できます</li>
            <li>• 各レポートはPDF形式でダウンロード可能です</li>
            <li>• 生成に失敗したレポートは「再生成」ボタンで再試行できます</li>
          </ul>
        </div>
      </div>
    </div>
  );
}