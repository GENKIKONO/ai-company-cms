'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getOrganizations, getIndustries } from '@/lib/organizations';
import { type Organization } from '@/types/database';

interface SearchFilters {
  search: string;
  industry: string;
  region: string;
}

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<SearchFilters>({
    search: '',
    industry: '',
    region: ''
  });

  // 公開済み企業データの取得
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [orgsResult, industriesResult] = await Promise.all([
          getOrganizations({ status: 'published', limit: 100 }),
          getIndustries()
        ]);

        if (orgsResult.data) {
          setOrganizations(orgsResult.data);
        }
        if (industriesResult.data) {
          setIndustries(industriesResult.data);
        }
      } catch (error) {
        console.error('Failed to fetch organizations:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // フィルタリング済みの企業一覧
  const filteredOrganizations = useMemo(() => {
    return organizations.filter(org => {
      const matchesSearch = !filters.search || 
        org.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        org.description?.toLowerCase().includes(filters.search.toLowerCase());

      const matchesIndustry = !filters.industry || 
        org.industries?.includes(filters.industry);

      const matchesRegion = !filters.region || 
        org.address_region?.includes(filters.region) ||
        org.address_locality?.includes(filters.region);

      return matchesSearch && matchesIndustry && matchesRegion;
    });
  }, [organizations, filters]);

  // 地域一覧の抽出
  const regions = useMemo(() => {
    const allRegions = organizations
      .flatMap(org => [org.address_region, org.address_locality])
      .filter((region): region is string => Boolean(region))
      .filter((region, index, self) => self.indexOf(region) === index)
      .sort();
    return allRegions;
  }, [organizations]);

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ search: '', industry: '', region: '' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ページタイトル */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">企業ディレクトリ</h1>
          <p className="text-lg text-gray-600">
            AIO Hubに登録された{organizations.length}社の企業情報を検索・閲覧できます
          </p>
        </div>

        {/* 検索・フィルター */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* 企業名検索 */}
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                企業名・説明で検索
              </label>
              <input
                type="text"
                id="search"
                placeholder="企業名を入力..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 業種フィルター */}
            <div>
              <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-2">
                業種
              </label>
              <select
                id="industry"
                value={filters.industry}
                onChange={(e) => handleFilterChange('industry', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">すべての業種</option>
                {industries.map(industry => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>
            </div>

            {/* 地域フィルター */}
            <div>
              <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-2">
                地域
              </label>
              <select
                id="region"
                value={filters.region}
                onChange={(e) => handleFilterChange('region', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">すべての地域</option>
                {regions.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>

            {/* クリアボタン */}
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                フィルターをクリア
              </button>
            </div>
          </div>

          {/* 検索結果数 */}
          <div className="mt-4 text-sm text-gray-600">
            {loading ? (
              '検索中...'
            ) : (
              <>
                {filteredOrganizations.length}件の企業が見つかりました
                {(filters.search || filters.industry || filters.region) && (
                  <span className="ml-2 text-blue-600">
                    （{organizations.length}件中）
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* 企業一覧 */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                  <div className="ml-3">
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredOrganizations.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">企業が見つかりませんでした</h3>
            <p className="mt-2 text-gray-500">
              検索条件を変更してお試しください
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrganizations.map((org) => (
              <Link
                key={org.id}
                href={`/o/${org.slug}`}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-center mb-4">
                  {org.logo_url ? (
                    <Image
                      src={org.logo_url}
                      alt={`${org.name}のロゴ`}
                      width={48}
                      height={48}
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
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {org.name}
                    </h3>
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
                  
                  <div className="flex items-center space-x-3 text-xs">
                    {org.services && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                        サービス{Array.isArray(org.services) ? org.services.length : 0}件
                      </span>
                    )}
                    {org.case_studies && (
                      <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                        事例{Array.isArray(org.case_studies) ? org.case_studies.length : 0}件
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}