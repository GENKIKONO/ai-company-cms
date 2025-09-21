'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { globalSearch, getSearchSuggestions, saveSearch, getSavedSearches, type SearchResults } from '@/lib/search';
import { getIndustries } from '@/lib/organizations';
import { getServiceCategories } from '@/lib/services';
import { type Organization, type Service, type CaseStudy } from '@/types/database';

export function SearchPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<('organizations' | 'services' | 'case_studies')[]>(['organizations', 'services', 'case_studies']);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [savedSearches, setSavedSearches] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'organizations' | 'services' | 'case_studies'>('all');

  useEffect(() => {
    loadIndustries();
    loadCategories();
    if (user) {
      loadSavedSearches();
    }
  }, [user]);

  const loadIndustries = async () => {
    const { data } = await getIndustries();
    if (data) {
      setIndustries(data);
    }
  };

  const loadCategories = async () => {
    const { data } = await getServiceCategories();
    if (data) {
      setCategories(data);
    }
  };

  const loadSavedSearches = async () => {
    if (!user) return;
    const { data } = await getSavedSearches(user.id);
    if (data) {
      setSavedSearches(data);
    }
  };

  const handleSearch = async () => {
    if (!query.trim() && selectedIndustries.length === 0 && selectedCategories.length === 0) return;

    setLoading(true);
    try {
      const searchResults = await globalSearch({
        query: query.trim() || undefined,
        types: selectedTypes,
        industries: selectedIndustries.length > 0 ? selectedIndustries : undefined,
        categories: selectedCategories.length > 0 ? selectedCategories : undefined,
        limit: 100
      });
      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQueryChange = useCallback(async (value: string) => {
    setQuery(value);
    
    if (value.length > 1) {
      const searchSuggestions = await getSearchSuggestions(value);
      setSuggestions(searchSuggestions);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, []);

  const handleSaveSearch = async () => {
    if (!user || !query.trim()) return;

    const filters = {
      types: selectedTypes,
      industries: selectedIndustries,
      categories: selectedCategories
    };

    await saveSearch(user.id, query, filters);
    loadSavedSearches();
  };

  const handleTypeToggle = (type: 'organizations' | 'services' | 'case_studies') => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const getTabCount = (tab: string) => {
    if (!results) return 0;
    switch (tab) {
      case 'organizations': return results.organizations.length;
      case 'services': return results.services.length;
      case 'case_studies': return results.caseStudies.length;
      default: return results.total;
    }
  };

  const renderOrganization = (org: Organization) => (
    <Link
      key={org.id}
      href={`/organizations/${org.slug}`}
      className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
    >
      <div className="flex items-start space-x-4">
        {org.logo_url && (
          <img
            src={org.logo_url}
            alt={`${org.name} logo`}
            className="h-12 w-12 rounded-lg object-contain flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {org.name}
          </h3>
          {org.description && (
            <p className="text-gray-600 text-sm mt-1 line-clamp-2">
              {org.description}
            </p>
          )}
          {org.industries && org.industries.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {org.industries.slice(0, 3).map((industry) => (
                <span
                  key={industry}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {industry}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );

  const renderService = (service: Service) => (
    <div
      key={service.id}
      className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {service.name}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            by {service.organization?.name}
          </p>
          {service.description && (
            <p className="text-gray-600 text-sm mt-2 line-clamp-2">
              {service.description}
            </p>
          )}
          <div className="flex items-center justify-between mt-3">
            {service.category && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {service.category}
              </span>
            )}
            {service.price_range && (
              <span className="text-sm text-gray-500">
                {service.price_range}
              </span>
            )}
          </div>
        </div>
        {service.organization?.logo_url && (
          <img
            src={service.organization.logo_url}
            alt=""
            className="h-10 w-10 rounded-lg object-contain flex-shrink-0 ml-4"
          />
        )}
      </div>
    </div>
  );

  const renderCaseStudy = (caseStudy: CaseStudy) => (
    <div
      key={caseStudy.id}
      className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {caseStudy.title}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            by {caseStudy.organization?.name}
          </p>
          {caseStudy.client_industry && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 mt-2">
              {caseStudy.client_industry}
            </span>
          )}
          {caseStudy.problem && (
            <p className="text-gray-600 text-sm mt-2 line-clamp-2">
              {caseStudy.problem}
            </p>
          )}
        </div>
        {caseStudy.organization?.logo_url && (
          <img
            src={caseStudy.organization.logo_url}
            alt=""
            className="h-10 w-10 rounded-lg object-contain flex-shrink-0 ml-4"
          />
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            統合検索
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            企業、サービス、導入事例を一括検索
          </p>
        </div>

        {/* 検索フォーム */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="検索キーワードを入力..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                  setShowSuggestions(false);
                }
              }}
            />
            
            {/* 検索候補 */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setQuery(suggestion);
                      setShowSuggestions(false);
                      handleSearch();
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* フィルター */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* 検索対象 */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">検索対象</h3>
              <div className="space-y-1">
                {[
                  { key: 'organizations', label: '企業' },
                  { key: 'services', label: 'サービス' },
                  { key: 'case_studies', label: '導入事例' }
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedTypes.includes(key as any)}
                      onChange={() => handleTypeToggle(key as any)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 業界 */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">業界</h3>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {industries.map((industry) => (
                  <label key={industry} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedIndustries.includes(industry)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIndustries([...selectedIndustries, industry]);
                        } else {
                          setSelectedIndustries(selectedIndustries.filter(i => i !== industry));
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{industry}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* カテゴリ */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">サービスカテゴリ</h3>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {categories.map((category) => (
                  <label key={category} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCategories([...selectedCategories, category]);
                        } else {
                          setSelectedCategories(selectedCategories.filter(c => c !== category));
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{category}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* アクションボタン */}
          <div className="flex justify-between items-center">
            <button
              onClick={() => {
                setQuery('');
                setSelectedIndustries([]);
                setSelectedCategories([]);
                setResults(null);
              }}
              className="text-sm text-gray-600 hover:text-gray-700"
            >
              クリア
            </button>
            
            <div className="flex space-x-2">
              {user && query.trim() && (
                <button
                  onClick={handleSaveSearch}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  検索を保存
                </button>
              )}
              <button
                onClick={handleSearch}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? '検索中...' : '検索'}
              </button>
            </div>
          </div>
        </div>

        {/* 検索結果 */}
        {results && (
          <div>
            {/* タブ */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-8">
                {[
                  { key: 'all', label: 'すべて' },
                  { key: 'organizations', label: '企業' },
                  { key: 'services', label: 'サービス' },
                  { key: 'case_studies', label: '導入事例' }
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key as any)}
                    className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === key
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {label} ({getTabCount(key)})
                  </button>
                ))}
              </nav>
            </div>

            {/* 結果表示 */}
            <div className="space-y-4">
              {(activeTab === 'all' || activeTab === 'organizations') && 
                results.organizations.map(renderOrganization)}
              
              {(activeTab === 'all' || activeTab === 'services') && 
                results.services.map(renderService)}
              
              {(activeTab === 'all' || activeTab === 'case_studies') && 
                results.caseStudies.map(renderCaseStudy)}

              {results.total === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">検索結果が見つかりませんでした。</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 保存済み検索 */}
        {user && savedSearches.length > 0 && !results && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              保存済み検索
            </h2>
            <div className="space-y-2">
              {savedSearches.map((search) => (
                <button
                  key={search.id}
                  onClick={() => {
                    setQuery(search.query);
                    if (search.filters) {
                      setSelectedTypes(search.filters.types || []);
                      setSelectedIndustries(search.filters.industries || []);
                      setSelectedCategories(search.filters.categories || []);
                    }
                    handleSearch();
                  }}
                  className="block w-full text-left px-3 py-2 text-blue-600 hover:bg-blue-50 rounded"
                >
                  {search.name || search.query}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}