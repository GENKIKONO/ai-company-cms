'use client';

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

interface DashboardMetrics {
  cards: MetricCard[];
  loading: boolean;
  error: string | null;
}

const adminTools: AdminTool[] = [
  // AI & コンテンツ
  {
    title: 'AI使用量',
    description: '組織別のAI利用統計を確認',
    href: '/dashboard/admin/ai-usage',
    icon: ChartBarIcon,
    category: 'AI & コンテンツ',
  },
  {
    title: 'AI可視性',
    description: 'AIクローラーからの可視性とボットログ',
    href: '/dashboard/admin/ai-visibility',
    icon: MagnifyingGlassIcon,
    category: 'AI & コンテンツ',
  },
  {
    title: 'コンテンツ管理',
    description: 'サイトコンテンツの編集と管理',
    href: '/dashboard/admin/contents',
    icon: DocumentTextIcon,
    category: 'AI & コンテンツ',
  },
  // システム監視
  {
    title: 'ジョブ監視',
    description: '翻訳・埋め込みジョブの状態監視',
    href: '/dashboard/admin/jobs',
    icon: CogIcon,
    category: 'システム監視',
  },
  {
    title: '監査ログ',
    description: 'システム操作の監査証跡',
    href: '/dashboard/admin/audit',
    icon: DocumentChartBarIcon,
    category: 'システム監視',
  },
  {
    title: 'ストレージログ',
    description: 'ファイルアクセス履歴の確認',
    href: '/dashboard/admin/storage-logs',
    icon: CircleStackIcon,
    category: 'システム監視',
  },
  // セキュリティ
  {
    title: 'セキュリティ',
    description: '侵入検知・IPブロック管理',
    href: '/dashboard/admin/security',
    icon: ShieldCheckIcon,
    category: 'セキュリティ',
  },
  // 組織管理
  {
    title: '組織グループ',
    description: '組織グループと招待管理',
    href: '/dashboard/admin/org-groups',
    icon: UserGroupIcon,
    category: '組織管理',
  },
  // 課金
  {
    title: '課金リンク',
    description: 'Stripe課金リンクの管理',
    href: '/dashboard/admin/billing-links',
    icon: CreditCardIcon,
    category: '課金',
  },
];

function getSeverityColor(severity?: string) {
  switch (severity) {
    case 'critical':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'high':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default:
      return 'bg-green-100 text-green-800 border-green-200';
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
  const categories = [...new Set(adminTools.map((tool) => tool.category))];
  const [metrics, setMetrics] = useState<DashboardMetrics>({
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
    <div className="py-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            <li>
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                ダッシュボード
              </Link>
            </li>
            <li>
              <span className="text-gray-500">/</span>
            </li>
            <li className="text-gray-900 font-medium">管理</li>
          </ol>
        </nav>

        {/* Metrics Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">システム概要</h2>
            <p className="text-sm text-gray-500">過去4週間のメトリクス</p>
          </div>
          <div className="p-6">
            {metrics.loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-500">読み込み中...</span>
              </div>
            ) : metrics.error ? (
              <div className="text-center py-8 text-gray-500">
                メトリクスの取得に失敗しました
              </div>
            ) : metrics.cards.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                データがありません
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {metrics.cards.map((card) => (
                  <div
                    key={card.key}
                    className={`p-4 rounded-lg border ${getSeverityColor(card.severity)}`}
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
          </div>
        </div>

        {/* Admin Tools */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">管理ツール</h1>
            <p className="text-sm text-gray-500 mt-1">システム管理・監視ツール一覧</p>
          </div>

          <div className="p-6">
            {categories.map((category) => (
              <div key={category} className="mb-8 last:mb-0">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">{category}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {adminTools
                    .filter((tool) => tool.category === category)
                    .map((tool) => {
                      const Icon = tool.icon;
                      return (
                        <Link
                          key={tool.href}
                          href={tool.href}
                          className="block p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200"
                        >
                          <div className="flex items-start gap-3">
                            <Icon className="h-6 w-6 text-gray-600 flex-shrink-0" />
                            <div>
                              <h3 className="font-medium text-gray-900">{tool.title}</h3>
                              <p className="text-sm text-gray-500 mt-1">{tool.description}</p>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
