'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Mock data for development
const MOCK_PARTNERS = [
  {
    id: '1',
    name: 'デジタルソリューションズ株式会社',
    contact_email: 'contact@digital-solutions.jp',
    brand_logo_url: 'https://via.placeholder.com/200x80/4F46E5/white?text=DS',
    subdomain: 'digital-solutions',
    commission_rate_init: 15.0,
    commission_rate_mrr: 10.0,
    created_at: '2024-01-15T09:00:00Z',
    organization_count: 12,
    total_revenue: 840000
  },
  {
    id: '2', 
    name: 'ビジネスパートナーズ合同会社',
    contact_email: 'info@bizpartners.co.jp',
    brand_logo_url: 'https://via.placeholder.com/200x80/059669/white?text=BP',
    subdomain: 'bizpartners',
    commission_rate_init: 12.0,
    commission_rate_mrr: 8.0,
    created_at: '2024-02-01T10:30:00Z',
    organization_count: 8,
    total_revenue: 560000
  },
  {
    id: '3',
    name: 'マーケティングエージェンシー株式会社',
    contact_email: 'hello@marketing-agency.jp',
    brand_logo_url: 'https://via.placeholder.com/200x80/DC2626/white?text=MA',
    subdomain: 'marketing-agency',
    commission_rate_init: 18.0,
    commission_rate_mrr: 12.0,
    created_at: '2024-01-28T14:15:00Z',
    organization_count: 15,
    total_revenue: 1200000
  }
];

export default function PartnersPage() {
  const [partners, setPartners] = useState(MOCK_PARTNERS);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'created_at' | 'organization_count' | 'total_revenue'>('created_at');

  const filteredPartners = partners
    .filter(partner => 
      partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.contact_email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'organization_count':
          return b.organization_count - a.organization_count;
        case 'total_revenue':
          return b.total_revenue - a.total_revenue;
        default:
          return 0;
      }
    });

  const totalRevenue = partners.reduce((sum, partner) => sum + partner.total_revenue, 0);
  const totalOrganizations = partners.reduce((sum, partner) => sum + partner.organization_count, 0);

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
                パートナー管理
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/dashboard" 
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                ダッシュボードに戻る
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 統計サマリー */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="text-3xl text-blue-500 mr-4">🤝</div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{partners.length}</div>
                <div className="text-sm text-gray-600">パートナー数</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="text-3xl text-green-500 mr-4">🏢</div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{totalOrganizations}</div>
                <div className="text-sm text-gray-600">管理企業数</div>
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
              <div className="text-3xl text-orange-500 mr-4">📈</div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {partners.length > 0 ? (totalRevenue / partners.length / 1000).toFixed(0) : 0}K
                </div>
                <div className="text-sm text-gray-600">平均売上/月</div>
              </div>
            </div>
          </div>
        </div>

        {/* 検索・フィルター・追加ボタン */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="パートナー名・メールで検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="created_at">作成日順</option>
              <option value="name">名前順</option>
              <option value="organization_count">管理企業数順</option>
              <option value="total_revenue">売上順</option>
            </select>
          </div>

          <button
            onClick={() => setShowAddForm(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
          >
            新規パートナー追加
          </button>
        </div>

        {/* パートナー一覧 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">パートナー一覧</h3>
            
            <div className="space-y-4">
              {filteredPartners.map((partner) => (
                <div key={partner.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      {partner.brand_logo_url && (
                        <img
                          src={partner.brand_logo_url}
                          alt={`${partner.name}のロゴ`}
                          className="h-12 w-auto rounded"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="text-lg font-medium text-gray-900">{partner.name}</h4>
                        <p className="text-sm text-gray-600 mb-2">{partner.contact_email}</p>
                        
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">サブドメイン:</span> {partner.subdomain}
                          </div>
                          <div>
                            <span className="font-medium">管理企業:</span> {partner.organization_count}社
                          </div>
                          <div>
                            <span className="font-medium">月間売上:</span> ¥{partner.total_revenue.toLocaleString()}
                          </div>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-4 text-sm">
                          <div className="bg-green-100 text-green-800 px-2 py-1 rounded">
                            初期手数料: {partner.commission_rate_init}%
                          </div>
                          <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            月額手数料: {partner.commission_rate_mrr}%
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Link
                        href={`/dashboard/partners/${partner.id}`}
                        className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                      >
                        詳細
                      </Link>
                      <button className="text-gray-400 hover:text-gray-600 text-sm font-medium">
                        編集
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {filteredPartners.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm ? '検索結果が見つかりません' : 'パートナーが登録されていません'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 新規追加フォーム（モーダル風） */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">新規パートナー追加</h3>
              </div>
              <div className="px-6 py-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      パートナー名
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="株式会社○○○"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      連絡先メール
                    </label>
                    <input
                      type="email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="contact@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      サブドメイン
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="partner-name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        初期手数料 (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="15.0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        月額手数料 (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="10.0"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700">
                  追加
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}