'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { globalSearch, getIndustries, getServiceCategories } from '@/lib/organizations';
import { type Organization, type Service, type CaseStudy } from '@/types/database';

interface SearchFilters {
  query: string;
  type: 'all' | 'organizations' | 'services' | 'case_studies';
  industries: string[];
  regions: string[];
  categories: string[];
}

interface SearchResults {
  organizations: Organization[];
  services: (Service & { organization: Organization })[];
  case_studies: (CaseStudy & { organization: Organization })[];
  total: number;
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const [results, setResults] = useState<SearchResults>({
    organizations: [],
    services: [],
    case_studies: [],
    total: 0
  });
  const [industries, setIndustries] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState<SearchFilters>({
    query: searchParams.get('q') || '',
    type: (searchParams.get('type') as any) || 'all',
    industries: [],
    regions: [],
    categories: []
  });

  // 日本の都道府県リスト
  const regions = [
    '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
    '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
    '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
    '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
    '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
    '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
    '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
  ];

  // 初期データ取得
  useEffect(() => {
    async function fetchInitialData() {
      const [industriesResult, categoriesResult] = await Promise.all([
        getIndustries(),
        getServiceCategories()
      ]);

      if (industriesResult.data) setIndustries(industriesResult.data);
      if (categoriesResult.data) setCategories(categoriesResult.data);
    }

    fetchInitialData();
  }, []);

  // 検索実行
  const performSearch = useCallback(async (searchFilters: SearchFilters) => {
    setLoading(true);
    try {
      const result = await globalSearch({
        query: searchFilters.query || undefined,
        type: searchFilters.type,
        industries: searchFilters.industries.length > 0 ? searchFilters.industries : undefined,
        regions: searchFilters.regions.length > 0 ? searchFilters.regions : undefined,
        categories: searchFilters.categories.length > 0 ? searchFilters.categories : undefined,
        limit: 50
      });

      if (result.data) {
        setResults(result.data);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 初回とフィルター変更時に検索実行
  useEffect(() => {
    performSearch(filters);
  }, [filters, performSearch]);

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleArrayFilterToggle = (key: 'industries' | 'regions' | 'categories', value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(item => item !== value)
        : [...prev[key], value]
    }));
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      type: 'all',
      industries: [],
      regions: [],
      categories: []
    });
  };

  const activeFiltersCount = useMemo(() => {
    return filters.industries.length + filters.regions.length + filters.categories.length;
  }, [filters]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-gray-900 hover:text-blue-600">
                LuxuCare AI企業CMS
              </Link>
              <nav className="ml-10 hidden md:flex space-x-8">
                <Link href="/organizations" className="text-gray-500 hover:text-gray-700">
                  企業ディレクトリ
                </Link>
                <Link href="/search" className="text-blue-600 font-medium">
                  検索
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login" className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                ログイン
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ページタイトルと検索バー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">統合検索</h1>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {/* メイン検索バー */}
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="企業名、サービス名、事例などで検索..."
                  value={filters.query}
                  onChange={(e) => handleFilterChange('query', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                />
              </div>
              <div className="md:w-48">
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                >
                  <option value="all">すべて</option>
                  <option value="organizations">企業</option>
                  <option value="services">サービス</option>
                  <option value="case_studies">事例</option>
                </select>
              </div>
            </div>

            {/* フィルターボタン */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
                </svg>
                フィルター
                {activeFiltersCount > 0 && (
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
              
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  フィルターをクリア
                </button>
              )}
            </div>

            {/* フィルターパネル */}
            {showFilters && (
              <div className="mt-6 border-t border-gray-200 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* 業界フィルター */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">業界</h3>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {industries.map(industry => (
                        <label key={industry} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={filters.industries.includes(industry)}
                            onChange={() => handleArrayFilterToggle('industries', industry)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{industry}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 地域フィルター */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">地域</h3>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {regions.map(region => (
                        <label key={region} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={filters.regions.includes(region)}
                            onChange={() => handleArrayFilterToggle('regions', region)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{region}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* カテゴリフィルター */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">サービスカテゴリ</h3>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {categories.map(category => (
                        <label key={category} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={filters.categories.includes(category)}
                            onChange={() => handleArrayFilterToggle('categories', category)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{category}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 検索結果 */}
        <div className="space-y-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <span className="ml-3 text-gray-600">検索中...</span>
            </div>
          ) : (
            <>
              {/* 検索結果サマリー */}
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  検索結果 ({results.total}件)
                </h2>
                
                {filters.query && (
                  <p className="text-gray-600">
                    「{filters.query}」の検索結果
                  </p>
                )}
              </div>

              {results.total === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">結果が見つかりませんでした</h3>
                  <p className="mt-2 text-gray-500">
                    検索条件を変更してお試しください
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* 企業結果 */}
                  {results.organizations.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        企業 ({results.organizations.length}件)
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {results.organizations.map((org) => (
                          <Link
                            key={org.id}
                            href={`/o/${org.slug}`}
                            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center mb-4">
                              {org.logo_url ? (
                                <img
                                  src={org.logo_url}
                                  alt={`${org.name}のロゴ`}
                                  className="w-12 h-12 rounded-lg object-cover"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <span className="text-blue-600 font-semibold text-lg">
                                    {org.name.charAt(0)}
                                  </span>
                                </div>
                              )}
                              <div className="ml-3">
                                <h4 className="text-lg font-semibold text-gray-900 truncate">
                                  {org.name}
                                </h4>
                                {org.industries && org.industries.length > 0 && (
                                  <span className="text-sm text-blue-600">
                                    {org.industries[0]}
                                    {org.industries.length > 1 && ` +${org.industries.length - 1}`}
                                  </span>
                                )}
                              </div>
                            </div>

                            {org.description && (
                              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                {org.description}
                              </p>
                            )}

                            <div className="flex items-center justify-between text-sm text-gray-500">
                              <div className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {org.address_locality || org.address_region || '所在地未設定'}
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* サービス結果 */}
                  {results.services.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        サービス ({results.services.length}件)
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {results.services.map((service) => (
                          <div key={service.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start">
                                {service.logo_url ? (
                                  <img
                                    src={service.logo_url}
                                    alt={`${service.name}のロゴ`}
                                    className="w-12 h-12 rounded-lg object-cover"
                                  />
                                ) : (
                                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <span className="text-gray-600 font-semibold">
                                      {service.name.charAt(0)}
                                    </span>
                                  </div>
                                )}
                                <div className="ml-3 flex-1">
                                  <h4 className="text-lg font-medium text-gray-900">{service.name}</h4>
                                  <Link 
                                    href={`/o/${service.organization.slug}`}
                                    className="text-sm text-blue-600 hover:text-blue-700"
                                  >
                                    {service.organization.name}
                                  </Link>
                                  {service.description && (
                                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                      {service.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {service.categories && service.categories.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-3">
                                {service.categories.slice(0, 3).map((category, index) => (
                                  <span 
                                    key={index}
                                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                                  >
                                    {category}
                                  </span>
                                ))}
                                {service.categories.length > 3 && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                    +{service.categories.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                            
                            <div className="flex items-center space-x-3 mt-3 text-xs text-gray-500">
                              {service.api_available && (
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                                  API提供
                                </span>
                              )}
                              {service.free_trial && (
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  無料トライアル
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 事例結果 */}
                  {results.case_studies.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        導入事例 ({results.case_studies.length}件)
                      </h3>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {results.case_studies.map((caseStudy) => (
                          <div key={caseStudy.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="text-lg font-medium text-gray-900">{caseStudy.title}</h4>
                                <Link 
                                  href={`/o/${caseStudy.organization.slug}`}
                                  className="text-sm text-blue-600 hover:text-blue-700"
                                >
                                  {caseStudy.organization.name}
                                </Link>
                                {!caseStudy.is_anonymous && caseStudy.client_name && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    {caseStudy.client_name}
                                    {caseStudy.client_industry && ` - ${caseStudy.client_industry}`}
                                  </p>
                                )}
                              </div>
                              {caseStudy.thumbnail_url && (
                                <img
                                  src={caseStudy.thumbnail_url}
                                  alt={caseStudy.title}
                                  className="w-16 h-16 rounded-lg object-cover ml-4"
                                />
                              )}
                            </div>
                            
                            {caseStudy.problem && (
                              <div className="mt-3">
                                <h5 className="text-sm font-medium text-gray-700">課題</h5>
                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{caseStudy.problem}</p>
                              </div>
                            )}
                            
                            {caseStudy.solution && (
                              <div className="mt-2">
                                <h5 className="text-sm font-medium text-gray-700">解決策</h5>
                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{caseStudy.solution}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}