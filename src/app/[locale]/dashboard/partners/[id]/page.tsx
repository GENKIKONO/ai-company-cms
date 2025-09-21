'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

// Mock data for partner details
const MOCK_PARTNER_DETAILS = {
  '1': {
    id: '1',
    name: 'デジタルソリューションズ株式会社',
    contact_email: 'contact@digital-solutions.jp',
    brand_logo_url: 'https://via.placeholder.com/200x80/4F46E5/white?text=DS',
    subdomain: 'digital-solutions',
    commission_rate_init: 15.0,
    commission_rate_mrr: 10.0,
    created_at: '2024-01-15T09:00:00Z',
    organizations: [
      {
        id: 'org1',
        name: '田中工業株式会社',
        slug: 'tanaka-kogyo',
        status: 'published',
        monthly_revenue: 50000,
        created_at: '2024-02-01T10:00:00Z'
      },
      {
        id: 'org2', 
        name: '山田商事合同会社',
        slug: 'yamada-shoji',
        status: 'waiting_approval',
        monthly_revenue: 30000,
        created_at: '2024-02-15T14:30:00Z'
      },
      {
        id: 'org3',
        name: '佐藤建設株式会社',
        slug: 'sato-kensetsu',
        status: 'published',
        monthly_revenue: 70000,
        created_at: '2024-03-01T09:15:00Z'
      }
    ],
    revenue_history: [
      { month: '2024-01', amount: 120000, commission: 12000 },
      { month: '2024-02', amount: 150000, commission: 15000 },
      { month: '2024-03', amount: 180000, commission: 18000 },
      { month: '2024-04', amount: 160000, commission: 16000 }
    ]
  }
};

export default function PartnerDetailPage() {
  const params = useParams();
  const partnerId = params.id as string;
  const [partner, setPartner] = useState(MOCK_PARTNER_DETAILS[partnerId as keyof typeof MOCK_PARTNER_DETAILS] || null);
  const [activeTab, setActiveTab] = useState<'overview' | 'organizations' | 'revenue' | 'settings'>('overview');

  if (!partner) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">パートナーが見つかりません</h2>
          <Link href="/dashboard/partners" className="text-indigo-600 hover:text-indigo-500">
            パートナー一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

  const totalRevenue = partner.revenue_history.reduce((sum, item) => sum + item.amount, 0);
  const totalCommission = partner.revenue_history.reduce((sum, item) => sum + item.commission, 0);
  const activeOrganizations = partner.organizations.filter(org => org.status === 'published').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-2xl font-bold text-indigo-600">
                LuxuCare
              </Link>
              <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                パートナー詳細
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/dashboard/partners" 
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                ← パートナー一覧
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* パートナー基本情報 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              {partner.brand_logo_url && (
                <img
                  src={partner.brand_logo_url}
                  alt={`${partner.name}のロゴ`}
                  className="h-16 w-auto rounded"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{partner.name}</h1>
                <p className="text-gray-600 mb-2">{partner.contact_email}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>サブドメイン: {partner.subdomain}</span>
                  <span>•</span>
                  <span>登録日: {new Date(partner.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                編集
              </button>
              <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                無効化
              </button>
            </div>
          </div>
        </div>

        {/* 統計サマリー */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="text-3xl text-blue-500 mr-4">🏢</div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{partner.organizations.length}</div>
                <div className="text-sm text-gray-600">管理企業数</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="text-3xl text-green-500 mr-4">✅</div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{activeOrganizations}</div>
                <div className="text-sm text-gray-600">公開中企業</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="text-3xl text-purple-500 mr-4">💰</div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  ¥{totalRevenue.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">総売上</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="text-3xl text-orange-500 mr-4">🎯</div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  ¥{totalCommission.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">総手数料</div>
              </div>
            </div>
          </div>
        </div>

        {/* タブナビゲーション */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: '概要', icon: '📊' },
              { id: 'organizations', label: '管理企業', icon: '🏢' },
              { id: 'revenue', label: '売上レポート', icon: '📈' },
              { id: 'settings', label: '設定', icon: '⚙️' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* タブコンテンツ */}
        <div className="space-y-6">
          {/* 概要タブ */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-medium text-gray-900 mb-4">手数料設定</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">初期設定手数料</span>
                    <span className="font-medium">{partner.commission_rate_init}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">月額課金手数料</span>
                    <span className="font-medium">{partner.commission_rate_mrr}%</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-medium text-gray-900 mb-4">最近のアクティビティ</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>佐藤建設株式会社が公開されました</span>
                    <span className="text-gray-500">2日前</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span>山田商事合同会社が承認待ちです</span>
                    <span className="text-gray-500">5日前</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>月次売上レポートが生成されました</span>
                    <span className="text-gray-500">1週間前</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 管理企業タブ */}
          {activeTab === 'organizations' && (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">管理企業一覧</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        企業名
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ステータス
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        月間売上
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        登録日
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        アクション
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {partner.organizations.map((org) => (
                      <tr key={org.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{org.name}</div>
                          <div className="text-sm text-gray-500">/{org.slug}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            org.status === 'published' 
                              ? 'bg-green-100 text-green-800'
                              : org.status === 'waiting_approval'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {org.status === 'published' ? '公開中' : 
                             org.status === 'waiting_approval' ? '承認待ち' : '下書き'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ¥{org.monthly_revenue.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(org.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Link 
                            href={`/o/${org.slug}`}
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                          >
                            詳細
                          </Link>
                          <Link
                            href={`/dashboard/organizations/${org.id}`}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            編集
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 売上レポートタブ */}
          {activeTab === 'revenue' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-medium text-gray-900 mb-4">月別売上推移</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 text-sm font-medium text-gray-600">月</th>
                        <th className="text-right py-2 text-sm font-medium text-gray-600">売上</th>
                        <th className="text-right py-2 text-sm font-medium text-gray-600">手数料</th>
                        <th className="text-right py-2 text-sm font-medium text-gray-600">手数料率</th>
                      </tr>
                    </thead>
                    <tbody>
                      {partner.revenue_history.map((item) => (
                        <tr key={item.month} className="border-b border-gray-100">
                          <td className="py-3 text-sm text-gray-900">{item.month}</td>
                          <td className="py-3 text-sm text-gray-900 text-right">¥{item.amount.toLocaleString()}</td>
                          <td className="py-3 text-sm text-green-600 text-right font-medium">¥{item.commission.toLocaleString()}</td>
                          <td className="py-3 text-sm text-gray-600 text-right">{((item.commission / item.amount) * 100).toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 設定タブ */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-medium text-gray-900 mb-4">基本設定</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      パートナー名
                    </label>
                    <input
                      type="text"
                      value={partner.name}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      連絡先メール
                    </label>
                    <input
                      type="email"
                      value={partner.contact_email}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        初期手数料 (%)
                      </label>
                      <input
                        type="number"
                        value={partner.commission_rate_init}
                        step="0.1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        月額手数料 (%)
                      </label>
                      <input
                        type="number"
                        value={partner.commission_rate_mrr}
                        step="0.1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-6">
                  <button className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700">
                    設定を保存
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}