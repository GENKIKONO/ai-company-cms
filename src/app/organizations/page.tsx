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
  size: string;
  hasServices: boolean;
  hasCaseStudies: boolean;
  sortBy: string;
}

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<SearchFilters>({
    search: '',
    industry: '',
    region: '',
    size: '',
    hasServices: false,
    hasCaseStudies: false,
    sortBy: 'updated' // デフォルトを更新日順に変更
  });

  // 公開済み企業データの取得
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // パブリックAPIから公開済み企業を取得
        const [orgsResponse, industriesResult] = await Promise.all([
          fetch('/api/public/organizations?limit=100'),
          getIndustries()
        ]);

        if (orgsResponse.ok) {
          const orgsData = await orgsResponse.json();
          if (orgsData.data) {
            setOrganizations(orgsData.data);
          }
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

  // プラン重み付けソート関数
  const getOrganizationWeight = (org: Organization) => {
    const plan = org.plan || 'free';
    switch (plan) {
      case 'enterprise': return 4;
      case 'business': return 3;
      case 'basic': return 2;
      case 'free': return 1;
      default: return 1;
    }
  };

  // フィルタリング済みの企業一覧
  const filteredOrganizations = useMemo(() => {
    let filtered = organizations.filter(org => {
      const matchesSearch = !filters.search || 
        org.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        org.description?.toLowerCase().includes(filters.search.toLowerCase()) ||
        org.keywords?.some(keyword => keyword.toLowerCase().includes(filters.search.toLowerCase()));

      const matchesIndustry = !filters.industry || 
        org.industries?.includes(filters.industry);

      const matchesRegion = !filters.region || 
        org.address_locality?.includes(filters.region);

      const matchesSize = !filters.size || (() => {
        if (!org.employees) return false;
        const employees = typeof org.employees === 'string' ? parseInt(org.employees) : org.employees;
        switch (filters.size) {
          case '1-5': return employees >= 1 && employees <= 5;
          case '6-20': return employees >= 6 && employees <= 20;
          case '21-50': return employees >= 21 && employees <= 50;
          case '51-100': return employees >= 51 && employees <= 100;
          case '101-300': return employees >= 101 && employees <= 300;
          case '301+': return employees >= 301;
          default: return true;
        }
      })();

      const matchesServices = !filters.hasServices || 
        (org.services && Array.isArray(org.services) && org.services.length > 0);

      const matchesCaseStudies = !filters.hasCaseStudies || 
        (org.case_studies && Array.isArray(org.case_studies) && org.case_studies.length > 0);

      return matchesSearch && matchesIndustry && matchesRegion && 
             matchesSize && matchesServices && matchesCaseStudies;
    });

    // ソート
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'established':
          // 空文字チェック強化
          const bYear = b.established_at && b.established_at !== '' ? new Date(b.established_at).getFullYear() : 0;
          const aYear = a.established_at && a.established_at !== '' ? new Date(a.established_at).getFullYear() : 0;
          return (bYear || 0) - (aYear || 0);
        case 'employees':
          return (parseInt((b.employees as unknown) as string) || 0) - (parseInt((a.employees as unknown) as string) || 0);
        case 'services':
          const aServices = Array.isArray(a.services) ? a.services.length : 0;
          const bServices = Array.isArray(b.services) ? b.services.length : 0;
          return bServices - aServices;
        case 'updated':
        default:
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    });

    return filtered;
  }, [organizations, filters]);

  // プランバッジのスタイルを取得
  const getPlanBadgeStyle = (plan?: string) => {
    switch (plan) {
      case 'enterprise':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-1 ring-emerald-200';
      case 'business':
        return 'bg-purple-50 text-purple-700 border-purple-300 ring-1 ring-purple-200';
      case 'starter':
        return 'bg-indigo-50 text-indigo-700 border-indigo-300 ring-1 ring-indigo-200';
      case 'free':
      default:
        return 'bg-gray-50 text-gray-600 border-gray-300 ring-1 ring-gray-200';
    }
  };

  // プラン表示名を取得
  const getPlanDisplayName = (plan?: string) => {
    switch (plan) {
      case 'enterprise': return 'Enterprise';
      case 'business': return 'Business';
      case 'starter': return 'Starter';
      case 'free':
      default: return 'Free';
    }
  };

  // 地域一覧の抽出（市町村レベルのみ）
  const regions = useMemo(() => {
    const allRegions = organizations
      .flatMap(org => [org.address_locality]) // address_regionを除外し、市町村レベルのみ
      .filter((region): region is string => Boolean(region))
      .filter((region, index, self) => self.indexOf(region) === index)
      .sort();
    return allRegions;
  }, [organizations]);

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ 
      search: '', 
      industry: '', 
      region: '', 
      size: '', 
      hasServices: false, 
      hasCaseStudies: false, 
      sortBy: 'updated' 
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ページタイトル */}
        <div className="mb-8">
          <h1 className="jp-heading text-3xl font-bold text-gray-900 mb-2">企業ディレクトリ</h1>
          <p className="jp-body text-lg text-gray-600">
            AIO Hubに登録された<span className="jp-number-unit">{organizations.length}社</span>の企業情報を検索・閲覧できます
          </p>
        </div>

        {/* 検索・フィルター */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          {/* 検索ボックス */}
          <div className="mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                id="search"
                placeholder="企業名、説明文、キーワードで検索..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent text-lg"
              />
            </div>
          </div>

          {/* フィルター */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
            {/* 業種フィルター */}
            <div>
              <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-2">
                業種
              </label>
              <select
                id="industry"
                value={filters.industry}
                onChange={(e) => handleFilterChange('industry', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              >
                <option value="">すべて</option>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              >
                <option value="">すべて</option>
                {regions.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>

            {/* 企業規模 */}
            <div>
              <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-2">
                企業規模
              </label>
              <select
                id="size"
                value={filters.size}
                onChange={(e) => handleFilterChange('size', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              >
                <option value="">すべて</option>
                <option value="1-5">1〜5名</option>
                <option value="6-20">6〜20名</option>
                <option value="21-50">21〜50名</option>
                <option value="51-100">51〜100名</option>
                <option value="101-300">101〜300名</option>
                <option value="301+">301名以上</option>
              </select>
            </div>

            {/* ソート */}
            <div>
              <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-2">
                並び順
              </label>
              <select
                id="sortBy"
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              >
                <option value="updated">更新日順</option>
                <option value="name">名前順</option>
                <option value="established">設立年順</option>
                <option value="employees">従業員数順</option>
                <option value="services">サービス数順</option>
              </select>
            </div>

            {/* チェックボックスフィルター */}
            <div className="lg:col-span-2 flex flex-col space-y-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                追加条件
              </label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.hasServices}
                    onChange={(e) => setFilters(prev => ({ ...prev, hasServices: e.target.checked }))}
                    className="rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">サービス有り</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.hasCaseStudies}
                    onChange={(e) => setFilters(prev => ({ ...prev, hasCaseStudies: e.target.checked }))}
                    className="rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">導入事例有り</span>
                </label>
              </div>
            </div>
          </div>

          {/* アクションとアクティブフィルター */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              {/* アクティブフィルターバッジ */}
              {filters.search && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-slate-200 text-slate-800">
                  検索: {filters.search}
                  <button
                    onClick={() => handleFilterChange('search', '')}
                    className="ml-2 text-gray-600 hover:text-gray-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {filters.industry && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-slate-200 text-slate-800">
                  業種: {filters.industry}
                  <button
                    onClick={() => handleFilterChange('industry', '')}
                    className="ml-2 text-gray-600 hover:text-gray-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {filters.region && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-slate-200 text-slate-800">
                  地域: {filters.region}
                  <button
                    onClick={() => handleFilterChange('region', '')}
                    className="ml-2 text-gray-600 hover:text-gray-800"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>

            <div className="flex items-center space-x-3">
              {/* 検索結果数 */}
              <div className="text-sm text-gray-600">
                {loading ? (
                  '検索中...'
                ) : (
                  <>
                    {filteredOrganizations.length}件の企業
                    {(filters.search || filters.industry || filters.region || filters.size || filters.hasServices || filters.hasCaseStudies) && (
                      <span className="text-gray-600">
                        （{organizations.length}件中）
                      </span>
                    )}
                  </>
                )}
              </div>
              
              {/* クリアボタン */}
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                クリア
              </button>
            </div>
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
            <h3 className="jp-heading mt-4 text-lg font-medium text-gray-900">企業が見つかりませんでした</h3>
            <p className="jp-body mt-2 text-gray-500">
              検索条件を変更してお試しください
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrganizations.map((org) => (
              <Link
                key={org.id}
                href={`/o/${org.slug}`}
                className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
              >
                <div className="flex items-center mb-4">
                  {org.logo_url ? (
                    <Image
                      src={org.logo_url}
                      alt={`${org.name}のロゴ`}
                      width={56}
                      height={56}
                      className="w-14 h-14 object-contain bg-white rounded-md border border-gray-200 shadow-sm group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300">
                      <span className="text-gray-600 font-bold text-xl">
                        {org.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="ml-4 flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="jp-heading text-lg font-semibold text-gray-900 truncate group-hover:text-gray-700 transition-colors pr-2">
                        {org.name}
                      </h3>
                    </div>
                    {org.industries && org.industries.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-200 text-slate-800">
                          {org.industries[0]}
                        </span>
                        {org.industries.length > 1 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-200 text-slate-700">
                            +{org.industries.length - 1}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {org.description && (
                  <p className="jp-body text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                    {org.description}
                  </p>
                )}

                <div className="space-y-3">
                  {/* 所在地とWebサイト */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-500">
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {org.address_locality || org.address_region || '所在地未設定'}
                    </div>
                    {org.website_url && (
                      <div className="flex items-center text-gray-600">
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        <span className="text-xs">Website</span>
                      </div>
                    )}
                  </div>
                  
                  {/* サービス・事例数とその他の情報 */}
                  <div className="flex flex-wrap gap-2">
                    {org.services && Array.isArray(org.services) && org.services.length > 0 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-200 text-slate-800">
                        <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        サービス {org.services.length}件
                      </span>
                    )}
                    {org.case_studies && Array.isArray(org.case_studies) && org.case_studies.length > 0 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-200 text-slate-800">
                        <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        事例 {org.case_studies.length}件
                      </span>
                    )}
                    {org.employees && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-200 text-slate-800">
                        <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {org.employees}名
                      </span>
                    )}
                  </div>
                </div>

                {/* ホバー時の矢印アイコン */}
                <div className="mt-4 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <svg className="w-5 h-5 text-gray-600 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}