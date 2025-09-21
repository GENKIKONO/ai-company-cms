'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getOrganizations, getIndustries } from '@/lib/organizations';
import { type Organization } from '@/types/database';

export function OrganizationList() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    loadIndustries();
  }, []);

  useEffect(() => {
    loadOrganizations();
  }, [searchQuery, selectedIndustries, currentPage]);

  const loadOrganizations = async () => {
    setLoading(true);
    const { data } = await getOrganizations({
      search: searchQuery,
      status: 'published',
      industries: selectedIndustries.length > 0 ? selectedIndustries : undefined,
      limit: itemsPerPage,
      offset: (currentPage - 1) * itemsPerPage,
    });
    
    if (data) {
      setOrganizations(data);
    }
    setLoading(false);
  };

  const loadIndustries = async () => {
    const { data } = await getIndustries();
    if (data) {
      setIndustries(data);
    }
  };

  const handleIndustryFilter = (industry: string) => {
    setSelectedIndustries(prev => 
      prev.includes(industry)
        ? prev.filter(i => i !== industry)
        : [...prev, industry]
    );
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedIndustries([]);
    setCurrentPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ヘッダー */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          企業ディレクトリ
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          革新的な企業とそのサービス・導入事例をご紹介します
        </p>
      </div>

      {/* 検索・フィルター */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <div className="space-y-4">
          {/* 検索バー */}
          <div>
            <input
              type="text"
              placeholder="企業名やサービス内容で検索..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {/* 業界フィルター */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">業界で絞り込み</h3>
            <div className="flex flex-wrap gap-2">
              {industries.map((industry) => (
                <button
                  key={industry}
                  onClick={() => handleIndustryFilter(industry)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedIndustries.includes(industry)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {industry}
                </button>
              ))}
            </div>
          </div>

          {/* フィルタークリア */}
          {(searchQuery || selectedIndustries.length > 0) && (
            <div className="flex justify-between items-center pt-2">
              <p className="text-sm text-gray-600">
                {selectedIndustries.length > 0 && (
                  <span>選択中の業界: {selectedIndustries.join(', ')}</span>
                )}
              </p>
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                フィルターをクリア
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 企業一覧 */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : organizations.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">企業が見つかりませんでした</h3>
          <p className="text-gray-600">別の検索条件を試してみてください。</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizations.map((org) => (
            <Link
              key={org.id}
              href={`/organizations/${org.slug}`}
              className="group bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
            >
              <div className="p-6">
                {/* ロゴ */}
                {org.logo_url && (
                  <div className="flex justify-center mb-4">
                    <img
                      src={org.logo_url}
                      alt={`${org.name} logo`}
                      className="h-16 w-auto object-contain"
                    />
                  </div>
                )}

                {/* 企業名 */}
                <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {org.name}
                </h3>

                {/* 企業説明 */}
                {org.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {org.description}
                  </p>
                )}

                {/* 業界タグ */}
                {org.industries && org.industries.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {org.industries.slice(0, 3).map((industry) => (
                      <span
                        key={industry}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {industry}
                      </span>
                    ))}
                    {org.industries.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{org.industries.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* 統計情報 */}
                <div className="flex justify-between text-sm text-gray-500 border-t pt-3">
                  <span>サービス: {org.services?.length || 0}</span>
                  <span>導入事例: {org.case_studies?.length || 0}</span>
                </div>

                {/* 住所 */}
                {(org.address_region || org.address_locality) && (
                  <div className="text-xs text-gray-500 mt-2">
                    📍 {org.address_region}{org.address_locality}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* ページネーション（簡易版） */}
      {organizations.length === itemsPerPage && (
        <div className="flex justify-center mt-8">
          <div className="flex space-x-2">
            {currentPage > 1 && (
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                前のページ
              </button>
            )}
            <span className="px-4 py-2 text-sm text-gray-700">
              ページ {currentPage}
            </span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              次のページ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}