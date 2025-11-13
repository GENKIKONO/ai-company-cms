'use client';

import React, { useState, useEffect } from 'react';
import {
  CurrencyDollarIcon,
  UserGroupIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  DocumentTextIcon,
  CogIcon,
  LinkIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import type { PartnerDashboardData, Partner, PartnerReferral, Commission } from '@/lib/types/partner';

// TODO: Replace with API calls in production
const partnerData: PartnerDashboardData = {
  partner: {
    id: 'partner-1',
    user_id: 'user-1',
    business_name: 'デジタルマーケティング株式会社',
    business_type: 'agency',
    status: 'active',
    tier: 'gold',
    contact_email: 'contact@digital-marketing.jp',
    website: 'https://digital-marketing.jp',
    description: 'デジタルマーケティングに特化したコンサルティング会社',
    business_address: {
      street: '渋谷1-1-1',
      city: '渋谷区',
      state: '東京都',
      postal_code: '150-0002',
      country: 'JP'
    },
    referral_code: 'DM2024',
    commission_config: {
      type: 'percentage',
      base_rate: 15,
      minimum_payout: 10000,
      performance_bonus: []
    },
    payment_config: {
      frequency: 'monthly',
      method: 'bank_transfer',
      account_details: {},
      payment_day: 25
    },
    contract_start_date: '2024-01-01',
    metrics: {
      total_referrals: 47,
      active_clients: 23,
      total_revenue_generated: 4750000,
      total_commission_earned: 712500,
      pending_commission: 89250,
      last_30_days: {
        new_referrals: 8,
        revenue_generated: 680000,
        commission_earned: 102000
      },
      conversion_rate: 68.2,
      average_client_value: 206522,
      client_retention_rate: 89.1,
      performance_score: 92
    },
    created_at: '2024-01-01',
    updated_at: '2024-11-09'
  },
  recent_referrals: [],
  pending_commissions: [],
  recent_payouts: [],
  activity_feed: [],
  performance_chart_data: []
};

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  format?: 'currency' | 'percentage' | 'number';
  subtitle?: string;
}

function MetricCard({ title, value, change, icon: Icon, format = 'number', subtitle }: MetricCardProps) {
  const formatValue = (val: string | number) => {
    if (format === 'currency') {
      return `¥${Number(val).toLocaleString()}`;
    } else if (format === 'percentage') {
      return `${val}%`;
    }
    return val;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{formatValue(value)}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className="flex flex-col items-end">
          <Icon className="h-8 w-8 text-blue-600" />
          {change !== undefined && (
            <div className={`flex items-center mt-2 text-xs ${
              change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-500'
            }`}>
              {change > 0 ? (
                <ArrowTrendingUpIcon className="h-3 w-3 mr-1" />
              ) : change < 0 ? (
                <ArrowTrendingDownIcon className="h-3 w-3 mr-1" />
              ) : null}
              {change > 0 ? '+' : ''}{change}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PartnerDashboard() {
  const [dashboardData, setDashboardData] = useState<PartnerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const fetchData = async () => {
      setLoading(true);
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setDashboardData(partnerData);
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <ClockIcon className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-gray-600">ダッシュボードを読み込み中...</span>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">データの取得に失敗しました</h3>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  const { partner } = dashboardData;
  const metrics = partner.metrics;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {partner.business_name}
              </h1>
              <p className="text-gray-600 mt-1">
                パートナーダッシュボード - {partner.tier.toUpperCase()}ティア
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-white px-4 py-2 rounded-lg shadow">
                <span className="text-sm text-gray-600">紹介コード:</span>
                <span className="font-mono font-bold text-blue-600 ml-2">{partner.referral_code}</span>
                <button className="ml-2 text-gray-400 hover:text-gray-600">
                  <LinkIcon className="h-4 w-4" />
                </button>
              </div>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center">
                <CogIcon className="h-4 w-4 mr-2" />
                設定
              </button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="今月のコミッション"
            value={metrics.last_30_days.commission_earned}
            change={15.2}
            icon={CurrencyDollarIcon}
            format="currency"
            subtitle="前月比"
          />
          <MetricCard
            title="アクティブクライアント"
            value={metrics.active_clients}
            change={8.7}
            icon={UserGroupIcon}
            subtitle={`総紹介数: ${metrics.total_referrals}`}
          />
          <MetricCard
            title="コンバージョン率"
            value={metrics.conversion_rate}
            change={-2.1}
            icon={ChartBarIcon}
            format="percentage"
            subtitle="業界平均: 58%"
          />
          <MetricCard
            title="パフォーマンススコア"
            value={metrics.performance_score}
            change={3.5}
            icon={ArrowTrendingUpIcon}
            subtitle="100点満点"
          />
        </div>

        {/* Charts and Tables Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Performance Chart Placeholder */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">月次パフォーマンス</h3>
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <ChartBarIcon className="h-12 w-12 mx-auto mb-2" />
                <p>チャートコンポーネント実装予定</p>
                <p className="text-sm">売上・紹介数・コミッションの推移</p>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">最近の活動</h3>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <UserGroupIcon className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      新規リード「株式会社サンプル{i}」が登録されました
                    </p>
                    <p className="text-xs text-gray-500">
                      {i}時間前 • ビジネスプラン検討中
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium">
              すべての活動を見る
            </button>
          </div>
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Commission Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">コミッション概要</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">累計獲得額</span>
                <span className="font-semibold">¥{metrics.total_commission_earned.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">支払い待ち</span>
                <span className="font-semibold text-orange-600">¥{metrics.pending_commission.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">平均単価</span>
                <span className="font-semibold">¥{metrics.average_client_value.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Client Metrics */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">クライアント指標</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">継続率</span>
                <span className="font-semibold text-green-600">{metrics.client_retention_rate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">今月の新規</span>
                <span className="font-semibold">{metrics.last_30_days.new_referrals}件</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">生涯価値合計</span>
                <span className="font-semibold">¥{metrics.total_revenue_generated.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">クイックアクション</h3>
            <div className="space-y-3">
              <button className="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                <div className="flex items-center space-x-3">
                  <LinkIcon className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">紹介リンク生成</span>
                </div>
              </button>
              <button className="w-full text-left p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                <div className="flex items-center space-x-3">
                  <DocumentTextIcon className="h-5 w-5 text-green-600" />
                  <span className="font-medium">月次レポート</span>
                </div>
              </button>
              <button className="w-full text-left p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                <div className="flex items-center space-x-3">
                  <EyeIcon className="h-5 w-5 text-purple-600" />
                  <span className="font-medium">マーケティング素材</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}