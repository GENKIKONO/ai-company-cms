'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { trackPageView, trackEvent } from '@/lib/analytics';
import { Organization } from '@/types';
import { Locale } from '@/i18n';
import FavoriteButton from '@/components/FavoriteButton';
import UserMenu from '@/components/auth/UserMenu';
import AuthModal from '@/components/auth/AuthModal';
import { useAuth } from '@/hooks/useAuth';
import { useSavedSearches } from '@/hooks/useSavedSearches';
import { exportService } from '@/lib/export';

interface FilterOptions {
  industries: string[];
  regions: string[];
  sizes: Array<{ value: string; label: string }>;
}

interface CurrentFilters {
  query: string;
  industry: string;
  region: string;
  size: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
}

interface Props {
  locale: Locale;
  organizations: Organization[];
  filters: FilterOptions;
  currentFilters: CurrentFilters;
  pagination: Pagination;
}

export default function DirectoryPage({
  locale,
  organizations,
  filters,
  currentFilters,
  pagination,
}: Props) {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { saveSearch } = useSavedSearches();
  const [searchQuery, setSearchQuery] = useState(currentFilters.query);
  const [selectedIndustry, setSelectedIndustry] = useState(currentFilters.industry);
  const [selectedRegion, setSelectedRegion] = useState(currentFilters.region);
  const [selectedSize, setSelectedSize] = useState(currentFilters.size);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [saveSearchModalOpen, setSaveSearchModalOpen] = useState(false);
  const [searchName, setSearchName] = useState('');

  useEffect(() => {
    // Analytics: ページビュー追跡
    trackPageView({
      url: '/directory',
      referrer: document.referrer,
      title: '企業ディレクトリ',
    });

    trackEvent({
      name: 'Directory View',
      properties: {
        total_organizations: organizations.length,
        current_page: pagination.currentPage,
        filters_applied: {
          query: !!currentFilters.query,
          industry: !!currentFilters.industry,
          region: !!currentFilters.region,
          size: !!currentFilters.size,
        },
      },
    });
  }, [organizations.length, pagination.currentPage, currentFilters]);

  const updateURL = (newParams: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    // ページ番号をリセット（検索条件変更時）
    if (Object.keys(newParams).some(key => key !== 'page')) {
      params.delete('page');
    }

    router.push(`/${locale}/directory?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateURL({ q: searchQuery });
    
    trackEvent({
      name: 'Directory Search',
      properties: {
        query: searchQuery,
        results_count: organizations.length,
      },
    });
  };

  const handleFilterChange = (type: string, value: string) => {
    const newFilters = { [type]: value };
    updateURL(newFilters);

    trackEvent({
      name: 'Directory Filter',
      properties: {
        filter_type: type,
        filter_value: value,
        results_count: organizations.length,
      },
    });
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedIndustry('');
    setSelectedRegion('');
    setSelectedSize('');
    router.push('/directory');

    trackEvent({
      name: 'Directory Clear Filters',
      properties: {
        previous_filters: currentFilters,
      },
    });
  };

  const handleOrganizationClick = (organization: Organization) => {
    trackEvent({
      name: 'Organization Click',
      properties: {
        organization_id: organization.id,
        organization_name: organization.name,
        from_page: 'directory',
        position: organizations.findIndex(org => org.id === organization.id) + 1,
      },
    });
  };

  const formatFoundedYear = (founded?: string) => {
    if (!founded) return '';
    return new Date(founded).getFullYear() + '年設立';
  };

  const formatEmployeeCount = (employees?: number) => {
    if (!employees) return '';
    return `従業員数: ${employees}名`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center mb-4">
            <Link href="/" className="flex items-center">
              <h1 className="text-2xl font-bold text-indigo-600">LuxuCare</h1>
              <span className="ml-2 text-sm text-gray-500">AI企業ディレクトリ</span>
            </Link>
            <nav className="flex space-x-4">
              <Link 
                href="/" 
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                ホーム
              </Link>
              <Link 
                href="/favorites" 
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                お気に入り
              </Link>
              <Link 
                href="/compare" 
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                企業比較
              </Link>
              <Link 
                href="/dashboard" 
                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
              >
                ダッシュボード
              </Link>
              <UserMenu onAuthModalOpen={() => setAuthModalOpen(true)} />
            </nav>
          </div>
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">企業ディレクトリ</h2>
            <p className="mt-2 text-lg text-gray-600">
              {pagination.totalCount}社の企業が登録されています
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* サイドバー（フィルター） */}
          <div className="lg:col-span-1 mb-8 lg:mb-0">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">検索・フィルター</h2>
                <div className="flex space-x-2">
                  {user && hasActiveFilters() && (
                    <button
                      onClick={() => setSaveSearchModalOpen(true)}
                      className="text-sm text-green-600 hover:text-green-800"
                      title="現在の検索条件を保存"
                    >
                      保存
                    </button>
                  )}
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    リセット
                  </button>
                </div>
              </div>

              {/* 検索フォーム */}
              <form onSubmit={handleSearch} className="mb-6">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                  企業名・説明で検索
                </label>
                <div className="flex">
                  <input
                    type="text"
                    id="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="企業名を入力..."
                    className="flex-1 rounded-l-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    検索
                  </button>
                </div>
              </form>

              {/* 業界フィルター */}
              <div className="mb-6">
                <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-2">
                  業界
                </label>
                <select
                  id="industry"
                  value={selectedIndustry}
                  onChange={(e) => {
                    setSelectedIndustry(e.target.value);
                    handleFilterChange('industry', e.target.value);
                  }}
                  className="w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">{t('directory.filters.industry.all')}</option>
                  {filters.industries.map((industry) => (
                    <option key={industry} value={industry}>
                      {industry}
                    </option>
                  ))}
                </select>
              </div>

              {/* 地域フィルター */}
              <div className="mb-6">
                <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-2">
                  地域
                </label>
                <select
                  id="region"
                  value={selectedRegion}
                  onChange={(e) => {
                    setSelectedRegion(e.target.value);
                    handleFilterChange('region', e.target.value);
                  }}
                  className="w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">{t('directory.filters.region.all')}</option>
                  {filters.regions.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
              </div>

              {/* 企業規模フィルター */}
              <div className="mb-6">
                <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-2">
                  企業規模
                </label>
                <select
                  id="size"
                  value={selectedSize}
                  onChange={(e) => {
                    setSelectedSize(e.target.value);
                    handleFilterChange('size', e.target.value);
                  }}
                  className="w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">{t('directory.filters.size.all')}</option>
                  {filters.sizes.map((size) => (
                    <option key={size.value} value={size.value}>
                      {size.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 設立年フィルター */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  設立年
                </label>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="founded-all"
                      name="founded"
                      value=""
                      checked={!searchParams.get('founded')}
                      onChange={() => handleFilterChange('founded', '')}
                      className="mr-2"
                    />
                    <label htmlFor="founded-all" className="text-sm text-gray-700">すべて</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="founded-recent"
                      name="founded"
                      value="recent"
                      checked={searchParams.get('founded') === 'recent'}
                      onChange={() => handleFilterChange('founded', 'recent')}
                      className="mr-2"
                    />
                    <label htmlFor="founded-recent" className="text-sm text-gray-700">2020年以降</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="founded-established"
                      name="founded"
                      value="established"
                      checked={searchParams.get('founded') === 'established'}
                      onChange={() => handleFilterChange('founded', 'established')}
                      className="mr-2"
                    />
                    <label htmlFor="founded-established" className="text-sm text-gray-700">2010-2019年</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="founded-mature"
                      name="founded"
                      value="mature"
                      checked={searchParams.get('founded') === 'mature'}
                      onChange={() => handleFilterChange('founded', 'mature')}
                      className="mr-2"
                    />
                    <label htmlFor="founded-mature" className="text-sm text-gray-700">2009年以前</label>
                  </div>
                </div>
              </div>

              {/* 特徴フィルター */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  企業の特徴
                </label>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="has-url"
                      checked={searchParams.get('has_url') === 'true'}
                      onChange={(e) => handleFilterChange('has_url', e.target.checked ? 'true' : '')}
                      className="mr-2"
                    />
                    <label htmlFor="has-url" className="text-sm text-gray-700">公式サイトあり</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="has-logo"
                      checked={searchParams.get('has_logo') === 'true'}
                      onChange={(e) => handleFilterChange('has_logo', e.target.checked ? 'true' : '')}
                      className="mr-2"
                    />
                    <label htmlFor="has-logo" className="text-sm text-gray-700">ロゴあり</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="has-services"
                      checked={searchParams.get('has_services') === 'true'}
                      onChange={(e) => handleFilterChange('has_services', e.target.checked ? 'true' : '')}
                      className="mr-2"
                    />
                    <label htmlFor="has-services" className="text-sm text-gray-700">サービス情報あり</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="has-case-studies"
                      checked={searchParams.get('has_case_studies') === 'true'}
                      onChange={(e) => handleFilterChange('has_case_studies', e.target.checked ? 'true' : '')}
                      className="mr-2"
                    />
                    <label htmlFor="has-case-studies" className="text-sm text-gray-700">導入事例あり</label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* メインコンテンツ */}
          <div className="lg:col-span-3">
            {/* 検索結果ヘッダー */}
            <div className="bg-white rounded-lg shadow mb-6 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    {pagination.totalCount}社中 {(pagination.currentPage - 1) * pagination.limit + 1}-
                    {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)}社を表示
                  </p>
                  {Object.values(currentFilters).some(Boolean) && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {currentFilters.query && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          検索: {currentFilters.query}
                        </span>
                      )}
                      {currentFilters.industry && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          業界: {currentFilters.industry}
                        </span>
                      )}
                      {currentFilters.region && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          地域: {currentFilters.region}
                        </span>
                      )}
                      {currentFilters.size && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          規模: {filters.sizes.find(s => s.value === currentFilters.size)?.label}
                        </span>
                      )}
                      {searchParams.get('founded') && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          設立: {
                            searchParams.get('founded') === 'recent' ? '2020年以降' :
                            searchParams.get('founded') === 'established' ? '2010-2019年' :
                            searchParams.get('founded') === 'mature' ? '2009年以前' : ''
                          }
                        </span>
                      )}
                      {(searchParams.get('has_url') || searchParams.get('has_logo') || searchParams.get('has_services') || searchParams.get('has_case_studies')) && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          特徴フィルターあり
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 企業一覧 */}
            {organizations.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  該当する企業が見つかりませんでした
                </h3>
                <p className="text-gray-600 mb-4">
                  検索条件を変更して再度お試しください。
                </p>
                <button
                  onClick={clearAllFilters}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  すべての企業を表示
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {organizations.map((organization) => (
                  <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-200 overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-start space-x-4">
                        {organization.logo_url && (
                          <div className="flex-shrink-0">
                            <Image
                              src={organization.logo_url}
                              alt={`${organization.name}のロゴ`}
                              width={64}
                              height={64}
                              className="rounded-lg object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-semibold text-gray-900 truncate">
                                {organization.name}
                              </h3>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {organization.description}
                              </p>
                            </div>
                            <FavoriteButton
                              organization={organization}
                              variant="icon"
                              size="md"
                              className="ml-2"
                            />
                          </div>
                          
                          <div className="mt-3 flex flex-wrap gap-2">
                            {organization.industries?.slice(0, 2).map((industry) => (
                              <span
                                key={industry}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {industry}
                              </span>
                            ))}
                            {organization.industries && organization.industries.length > 2 && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                +{organization.industries.length - 2}
                              </span>
                            )}
                          </div>

                          <div className="mt-3 flex items-center text-sm text-gray-500 space-x-4">
                            {organization.address_region && organization.address_locality && (
                              <span>📍 {organization.address_region}{organization.address_locality}</span>
                            )}
                            {organization.founded && (
                              <span>🗓 {formatFoundedYear(organization.founded)}</span>
                            )}
                            {organization.employees && (
                              <span>👥 {formatEmployeeCount(organization.employees)}</span>
                            )}
                          </div>

                          <div className="mt-4 flex space-x-2">
                            <Link
                              href={`/o/${organization.slug}`}
                              onClick={() => handleOrganizationClick(organization)}
                              className="flex-1 text-center px-3 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
                            >
                              詳細を見る
                            </Link>
                            <Link
                              href={`/compare?ids=${organization.id}`}
                              className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50"
                            >
                              比較
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ページネーション */}
            {pagination.totalPages > 1 && (
              <div className="bg-white rounded-lg shadow mt-6 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {pagination.currentPage > 1 && (
                      <Link
                        href={`/directory?${new URLSearchParams({
                          ...Object.fromEntries(searchParams.entries()),
                          page: (pagination.currentPage - 1).toString(),
                        }).toString()}`}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                      >
                        前へ
                      </Link>
                    )}
                    
                    {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                      const page = i + 1;
                      const isCurrentPage = page === pagination.currentPage;
                      
                      return (
                        <Link
                          key={page}
                          href={`/directory?${new URLSearchParams({
                            ...Object.fromEntries(searchParams.entries()),
                            page: page.toString(),
                          }).toString()}`}
                          className={`px-3 py-1 border rounded-md text-sm ${
                            isCurrentPage
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </Link>
                      );
                    })}

                    {pagination.currentPage < pagination.totalPages && (
                      <Link
                        href={`/directory?${new URLSearchParams({
                          ...Object.fromEntries(searchParams.entries()),
                          page: (pagination.currentPage + 1).toString(),
                        }).toString()}`}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                      >
                        次へ
                      </Link>
                    )}
                  </div>

                  <span className="text-sm text-gray-600">
                    {pagination.currentPage} / {pagination.totalPages} ページ
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 認証モーダル */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      {/* 検索保存モーダル */}
      {saveSearchModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">検索条件を保存</h3>
            <div className="mb-4">
              <label htmlFor="searchName" className="block text-sm font-medium text-gray-700 mb-2">
                検索名
              </label>
              <input
                type="text"
                id="searchName"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="例: IT業界の中小企業"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mb-4 p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600">現在の検索条件:</p>
              <p className="text-sm text-gray-800 mt-1">{getCurrentSearchSummary()}</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setSaveSearchModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleSaveSearch}
                disabled={!searchName.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ヘルパー関数
  function hasActiveFilters(): boolean {
    return Object.values(currentFilters).some(Boolean) || 
           searchParams.get('founded') || 
           searchParams.get('has_url') || 
           searchParams.get('has_logo') || 
           searchParams.get('has_services') || 
           searchParams.get('has_case_studies');
  }

  function getCurrentSearchSummary(): string {
    const conditions: string[] = [];
    
    if (currentFilters.query) conditions.push(`検索: "${currentFilters.query}"`);
    if (currentFilters.industry) conditions.push(`業界: ${currentFilters.industry}`);
    if (currentFilters.region) conditions.push(`地域: ${currentFilters.region}`);
    if (currentFilters.size) {
      const sizeLabels = {
        small: '小企業（50名以下）',
        medium: '中企業（51-300名）',
        large: '大企業（301名以上）',
      };
      conditions.push(`規模: ${sizeLabels[currentFilters.size as keyof typeof sizeLabels]}`);
    }
    
    const founded = searchParams.get('founded');
    if (founded) {
      const foundedLabels = {
        recent: '2020年以降設立',
        established: '2010-2019年設立',
        mature: '2009年以前設立',
      };
      conditions.push(`設立: ${foundedLabels[founded as keyof typeof foundedLabels]}`);
    }
    
    const features: string[] = [];
    if (searchParams.get('has_url')) features.push('公式サイト');
    if (searchParams.get('has_logo')) features.push('ロゴ');
    if (searchParams.get('has_services')) features.push('サービス情報');
    if (searchParams.get('has_case_studies')) features.push('導入事例');
    
    if (features.length > 0) {
      conditions.push(`特徴: ${features.join('・')}あり`);
    }
    
    return conditions.length > 0 ? conditions.join(', ') : '条件なし';
  }

  async function handleSaveSearch() {
    if (!user || !searchName.trim()) return;

    try {
      const searchParams = {
        query: currentFilters.query,
        industry: currentFilters.industry,
        region: currentFilters.region,
        size: currentFilters.size,
        founded: searchParams.get('founded') || undefined,
        has_url: searchParams.get('has_url') === 'true',
        has_logo: searchParams.get('has_logo') === 'true',
        has_services: searchParams.get('has_services') === 'true',
        has_case_studies: searchParams.get('has_case_studies') === 'true',
      };

      await saveSearch(searchName.trim(), searchParams);
      setSaveSearchModalOpen(false);
      setSearchName('');
      
      // 成功メッセージを表示（簡易版）
      alert('検索条件を保存しました！');
    } catch (error) {
      console.error('Failed to save search:', error);
      alert('検索条件の保存に失敗しました。');
    }
  }
}