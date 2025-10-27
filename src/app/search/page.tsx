'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { globalSearch, getIndustries, getServiceCategories } from '@/lib/organizations';
import { type Organization, type Service, type CaseStudy } from '@/types/database';
import { logger } from '@/lib/utils/logger';

// Next.js 15: Force dynamic rendering to resolve useSearchParams prerender warning
export const dynamic = 'force-dynamic';

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

function SearchPageContent() {
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
      logger.error('Search failed', error instanceof Error ? error : new Error(String(error)));
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.08),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(147,51,234,0.06),transparent_60%)]" />
      
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12 lg:py-20">
        {/* ページタイトルと検索バー */}
        <div className="mb-12">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-3 bg-white/90 backdrop-blur-xl border border-gray-200/60 rounded-full px-6 py-3 mb-8 text-sm font-semibold text-gray-700 shadow-lg">
              <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
              統合検索
            </div>
            
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                あらゆる情報を
              </span>
              <br />
              一箇所で検索
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              企業、サービス、導入事例まで。<br />
              AI技術で最適な情報をお届けします。
            </p>
          </div>
          
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200/60 p-8 lg:p-10">
            {/* メイン検索バー */}
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="企業名、サービス名、事例などで検索..."
                  value={filters.query}
                  onChange={(e) => handleFilterChange('query', e.target.value)}
                  className="w-full px-6 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-300 text-lg bg-gray-50/50 hover:bg-white hover:shadow-md"
                />
              </div>
              <div className="lg:w-52">
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="w-full px-6 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-300 text-lg bg-gray-50/50 hover:bg-white hover:shadow-md"
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
                className="flex items-center px-6 py-3 border border-gray-200 rounded-2xl text-gray-700 hover:bg-white hover:shadow-md transition-all duration-300 bg-gray-50/50"
              >
                <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
                </svg>
                フィルター
                {activeFiltersCount > 0 && (
                  <span className="ml-3 px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs rounded-full font-semibold">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
              
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200 font-medium"
                >
                  フィルターをクリア
                </button>
              )}
            </div>

            {/* フィルターパネル */}
            {showFilters && (
              <div className="mt-8 border-t border-gray-200/60 pt-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* 業界フィルター */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      業界
                    </h3>
                    <div className="max-h-52 overflow-y-auto space-y-3 bg-gray-50/50 rounded-2xl p-4">
                      {industries.map(industry => (
                        <label key={industry} className="flex items-center group cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.industries.includes(industry)}
                            onChange={() => handleArrayFilterToggle('industries', industry)}
                            className="rounded-lg border-gray-300 text-blue-600 focus:ring-blue-500/30 focus:ring-2 transition-all duration-200"
                          />
                          <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900 transition-colors duration-200">{industry}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 地域フィルター */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      地域
                    </h3>
                    <div className="max-h-52 overflow-y-auto space-y-3 bg-gray-50/50 rounded-2xl p-4">
                      {regions.map(region => (
                        <label key={region} className="flex items-center group cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.regions.includes(region)}
                            onChange={() => handleArrayFilterToggle('regions', region)}
                            className="rounded-lg border-gray-300 text-emerald-600 focus:ring-emerald-500/30 focus:ring-2 transition-all duration-200"
                          />
                          <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900 transition-colors duration-200">{region}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* カテゴリフィルター */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      サービスカテゴリ
                    </h3>
                    <div className="max-h-52 overflow-y-auto space-y-3 bg-gray-50/50 rounded-2xl p-4">
                      {categories.map(category => (
                        <label key={category} className="flex items-center group cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.categories.includes(category)}
                            onChange={() => handleArrayFilterToggle('categories', category)}
                            className="rounded-lg border-gray-300 text-purple-600 focus:ring-purple-500/30 focus:ring-2 transition-all duration-200"
                          />
                          <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900 transition-colors duration-200">{category}</span>
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
        <div className="space-y-10">
          {loading ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center gap-4">
                <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                <span className="text-lg text-gray-600 font-medium">検索中...</span>
              </div>
            </div>
          ) : (
            <>
              {/* 検索結果サマリー */}
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/60 p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      検索結果
                    </span>
                    <span className="ml-2 text-gray-700">({results.total}件)</span>
                  </h2>
                  
                  {filters.query && (
                    <div className="text-right">
                      <p className="text-gray-600 text-lg">
                        「<span className="font-semibold text-blue-600">{filters.query}</span>」の検索結果
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {results.total === 0 ? (
                <div className="text-center py-20">
                  <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-gray-200/60 p-12 shadow-lg max-w-md mx-auto">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">結果が見つかりませんでした</h3>
                    <p className="text-gray-600 leading-relaxed">
                      検索条件を変更してお試しください
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-12">
                  {/* 企業結果 */}
                  {results.organizations.length > 0 && (
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        企業 ({results.organizations.length}件)
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {results.organizations.map((org) => (
                          <Link
                            key={org.id}
                            href={`/o/${org.slug}`}
                            className="group bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/60 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                          >
                            <div className="flex items-center mb-4">
                              {org.logo_url ? (
                                <img
                                  src={org.logo_url}
                                  alt={`${org.name}のロゴ`}
                                  className="w-14 h-14 rounded-xl object-cover shadow-md"
                                />
                              ) : (
                                <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center shadow-md">
                                  <span className="text-blue-600 font-bold text-xl">
                                    {org.name.charAt(0)}
                                  </span>
                                </div>
                              )}
                              <div className="ml-4 flex-1">
                                <h4 className="text-lg font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors duration-200">
                                  {org.name}
                                </h4>
                                {org.industries && org.industries.length > 0 && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 mt-1">
                                    {org.industries[0]}
                                    {org.industries.length > 1 && ` +${org.industries.length - 1}`}
                                  </span>
                                )}
                              </div>
                            </div>

                            {org.description && (
                              <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                                {org.description}
                              </p>
                            )}

                            <div className="flex items-center text-sm text-gray-500">
                              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {org.address_locality || org.address_region || '所在地未設定'}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* サービス結果 */}
                  {results.services.length > 0 && (
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </div>
                        サービス ({results.services.length}件)
                      </h3>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {results.services.map((service) => (
                          <div key={service.id} className="group bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/60 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                            <div className="flex items-start">
                              <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-xl flex items-center justify-center shadow-md">
                                <span className="text-emerald-600 font-bold text-xl">
                                  {service.name.charAt(0)}
                                </span>
                              </div>
                              <div className="ml-4 flex-1">
                                <h4 className="text-lg font-bold text-gray-900 group-hover:text-emerald-600 transition-colors duration-200 mb-1">{service.name}</h4>
                                <Link 
                                  href={`/o/${service.organization.slug}`}
                                  className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200"
                                >
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                  </svg>
                                  {service.organization.name}
                                </Link>
                                {service.description && (
                                  <p className="text-sm text-gray-600 mt-3 line-clamp-3 leading-relaxed">
                                    {service.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            {service.category && (
                              <div className="mt-4 pt-4 border-t border-gray-100">
                                <span className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-700 text-xs font-semibold rounded-full">
                                  {service.category}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 事例結果 */}
                  {results.case_studies.length > 0 && (
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        導入事例 ({results.case_studies.length}件)
                      </h3>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {results.case_studies.map((caseStudy) => (
                          <div key={caseStudy.id} className="group bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/60 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                            <div className="mb-4">
                              <h4 className="text-lg font-bold text-gray-900 group-hover:text-purple-600 transition-colors duration-200 mb-2">{caseStudy.title}</h4>
                              <Link 
                                href={`/o/${caseStudy.organization.slug}`}
                                className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200"
                              >
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                {caseStudy.organization.name}
                              </Link>
                            </div>
                            
                            <div className="space-y-4">
                              {caseStudy.problem && (
                                <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200/60 rounded-xl p-4">
                                  <h5 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                    課題
                                  </h5>
                                  <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed">{caseStudy.problem}</p>
                                </div>
                              )}
                              
                              {caseStudy.solution && (
                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/60 rounded-xl p-4">
                                  <h5 className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    解決策
                                  </h5>
                                  <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed">{caseStudy.solution}</p>
                                </div>
                              )}
                            </div>
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

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">検索ページを読み込み中...</p>
        </div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}