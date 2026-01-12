'use client';

/**
 * Admin Index Page - 新アーキテクチャ版
 */

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ChartBarIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  CogIcon,
  DocumentChartBarIcon,
  CircleStackIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import {
  DashboardPageShell,
} from '@/components/dashboard';
import {
  DashboardPageHeader,
  DashboardCard,
  DashboardCardHeader,
  DashboardCardContent,
  DashboardLoadingState,
  DashboardBadge,
} from '@/components/dashboard/ui';

interface AdminTool {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  category: string;
}

interface MetricCard {
  key: string;
  value: number;
  severity?: 'critical' | 'high' | 'medium' | 'low' | 'normal';
  threshold?: number;
}

const adminTools: AdminTool[] = [
  {
    title: 'AI使用量',
    description: '組織別のAI利用統計を確認',
    href: '/dashboard/manage/ai-usage',
    icon: ChartBarIcon,
    category: 'AI & コンテンツ',
  },
  {
    title: 'AI可視性',
    description: 'AIクローラーからの可視性とボットログ',
    href: '/dashboard/manage/ai-visibility',
    icon: MagnifyingGlassIcon,
    category: 'AI & コンテンツ',
  },
  {
    title: 'コンテンツ管理',
    description: 'サイトコンテンツの編集と管理',
    href: '/dashboard/manage/contents',
    icon: DocumentTextIcon,
    category: 'AI & コンテンツ',
  },
  {
    title: 'ジョブ監視',
    description: '翻訳・埋め込みジョブの状態監視',
    href: '/dashboard/manage/jobs',
    icon: CogIcon,
    category: 'システム監視',
  },
  {
    title: '監査ログ',
    description: 'システム操作の監査証跡',
    href: '/dashboard/manage/audit',
    icon: DocumentChartBarIcon,
    category: 'システム監視',
  },
  {
    title: 'ストレージログ',
    description: 'ファイルアクセス履歴の確認',
    href: '/dashboard/manage/storage-logs',
    icon: CircleStackIcon,
    category: 'システム監視',
  },
  {
    title: 'セキュリティ',
    description: '侵入検知・IPブロック管理',
    href: '/dashboard/manage/security',
    icon: ShieldCheckIcon,
    category: 'セキュリティ',
  },
  {
    title: '組織グループ',
    description: '組織グループと招待管理',
    href: '/dashboard/manage/org-groups',
    icon: UserGroupIcon,
    category: '組織管理',
  },
  {
    title: '課金リンク',
    description: 'Stripe課金リンクの管理',
    href: '/dashboard/manage/billing-links',
    icon: CreditCardIcon,
    category: '課金',
  },
];

function getSeverityBadge(severity?: string) {
  switch (severity) {
    case 'critical':
      return <DashboardBadge variant="error">Critical</DashboardBadge>;
    case 'high':
      return <DashboardBadge variant="warning">High</DashboardBadge>;
    case 'medium':
      return <DashboardBadge variant="info">Medium</DashboardBadge>;
    default:
      return <DashboardBadge variant="success">Normal</DashboardBadge>;
  }
}

function getMetricLabel(key: string) {
  const labels: Record<string, string> = {
    intrusion_alerts: '侵入アラート',
    rls_denied: 'RLS拒否',
    job_failure_rate: 'ジョブ失敗率',
    webhook_error_rate: 'Webhookエラー率',
  };
  return labels[key] || key;
}

function MetricIcon({ severity }: { severity?: string }) {
  if (severity === 'critical' || severity === 'high') {
    return <ExclamationTriangleIcon className="h-5 w-5" />;
  }
  if (severity === 'medium') {
    return <ClockIcon className="h-5 w-5" />;
  }
  return <CheckCircleIcon className="h-5 w-5" />;
}

export default function AdminIndexPage() {
  return (
    <DashboardPageShell
      title="管理"
      requiredRole="admin"
    >
      <AdminContent />
    </DashboardPageShell>
  );
}

function AdminContent() {
  const categories = [...new Set(adminTools.map((tool) => tool.category))];
  const [metrics, setMetrics] = useState<{
    cards: MetricCard[];
    loading: boolean;
    error: string | null;
  }>({
    cards: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const response = await fetch('/api/admin/alerts/dashboard?range=4w');
        if (!response.ok) {
          throw new Error('Failed to fetch metrics');
        }
        const json = await response.json();
        if (json.success && json.data?.cards) {
          setMetrics({ cards: json.data.cards, loading: false, error: null });
        } else {
          setMetrics({ cards: [], loading: false, error: null });
        }
      } catch (e) {
        setMetrics({
          cards: [],
          loading: false,
          error: e instanceof Error ? e.message : 'Unknown error',
        });
      }
    }
    fetchMetrics();
  }, []);

  return (
    <>
      <DashboardPageHeader
        title="管理ツール"
        description="システム管理・監視ツール一覧"
        backLink={{ href: '/dashboard', label: 'ダッシュボード' }}
      />

      {/* Metrics Overview */}
      <DashboardCard className="mb-6">
        <DashboardCardHeader>
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">システム概要</h2>
          <p className="text-sm text-[var(--color-text-secondary)]">過去4週間のメトリクス</p>
        </DashboardCardHeader>
        <DashboardCardContent>
          {metrics.loading ? (
            <DashboardLoadingState message="メトリクスを読み込み中..." />
          ) : metrics.error ? (
            <div className="text-center py-8 text-[var(--color-text-secondary)]">
              メトリクスの取得に失敗しました
            </div>
          ) : metrics.cards.length === 0 ? (
            <div className="text-center py-8 text-[var(--color-text-secondary)]">
              データがありません
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {metrics.cards.map((card) => (
                <div
                  key={card.key}
                  className={`p-4 rounded-lg border ${
                    card.severity === 'critical' || card.severity === 'high'
                      ? 'bg-[var(--status-error-bg)] border-[var(--status-error)] text-[var(--status-error)]'
                      : card.severity === 'medium'
                      ? 'bg-[var(--status-warning-bg)] border-[var(--status-warning)] text-[var(--status-warning)]'
                      : 'bg-[var(--status-success-bg)] border-[var(--status-success)] text-[var(--status-success)]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{getMetricLabel(card.key)}</span>
                    <MetricIcon severity={card.severity} />
                  </div>
                  <div className="text-2xl font-bold">
                    {card.key.includes('rate') ? `${card.value}%` : card.value}
                  </div>
                  {card.threshold && (
                    <div className="text-xs mt-1 opacity-75">
                      閾値: {card.key.includes('rate') ? `${card.threshold}%` : card.threshold}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </DashboardCardContent>
      </DashboardCard>

      {/* Admin Tools */}
      <DashboardCard>
        <DashboardCardContent>
          {categories.map((category) => (
            <div key={category} className="mb-8 last:mb-0">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">{category}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {adminTools
                  .filter((tool) => tool.category === category)
                  .map((tool) => {
                    const Icon = tool.icon;
                    return (
                      <Link
                        key={tool.href}
                        href={tool.href}
                        className="block p-4 rounded-lg border border-[var(--dashboard-card-border)] hover:border-[var(--aio-primary)] hover:shadow-md transition-all duration-200 bg-[var(--dashboard-card-bg)]"
                      >
                        <div className="flex items-start gap-3">
                          <Icon className="h-6 w-6 text-[var(--color-text-secondary)] flex-shrink-0" />
                          <div>
                            <h3 className="font-medium text-[var(--color-text-primary)]">{tool.title}</h3>
                            <p className="text-sm text-[var(--color-text-secondary)] mt-1">{tool.description}</p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
              </div>
            </div>
          ))}
        </DashboardCardContent>
      </DashboardCard>
    </>
  );
}
