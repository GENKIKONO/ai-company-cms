'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useI18n, I18nProvider } from '@/components/layout/I18nProvider';
import { useSEO } from '@/hooks/useSEO';
import AdvancedSearchFilters, { type AdvancedFilters } from '@/components/search/AdvancedSearchFilters';
import SearchResultCard from '@/components/search/SearchResultCard';
import { performAdvancedSearch, getSearchSuggestions, type AdvancedSearchResults } from '@/lib/search/advanced-search';
import { Search, Loader2, BookmarkCheck, Grid, List, Zap } from 'lucide-react';
import { logger } from '@/lib/utils/logger';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

function EnhancedSearchForm() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [results, setResults] = useState<AdvancedSearchResults>({
    organizations: [],
    services: [],
    case_studies: [],
    total: 0,
    facets: {
      industries: [],
      regions: [],
      categories: [],
      companySizes: []
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  // 初期フィルター設定
  const [filters, setFilters] = useState<AdvancedFilters>({
    query: searchParams.get('q') || '',
    type: (searchParams.get('type') as any) || 'all',
    industries: searchParams.getAll('industry'),
    regions: searchParams.getAll('region'),
    categories: searchParams.getAll('category'),
    companySize: searchParams.getAll('size'),
    sortBy: (searchParams.get('sort') as any) || 'relevance',
    sortOrder: (searchParams.get('order') as any) || 'desc'
  });

  // SEO設定
  useSEO({
    title: filters.query ? `"${filters.query}"の検索結果 | AIO Hub` : '高度検索 | AIO Hub',
    description: 'AI・DX企業の高度検索。詳細なフィルタリングで理想の企業・サービス・事例を見つけましょう。',
    canonical: 'https://aiohub.jp/search/enhanced',
    keywords: ['AI企業検索', '高度検索', 'フィルタリング', 'DX', 'デジタル変革']
  });

  // URL同期
  const updateURL = useCallback((newFilters: AdvancedFilters) => {
    const params = new URLSearchParams();
    
    if (newFilters.query) params.set('q', newFilters.query);
    if (newFilters.type !== 'all') params.set('type', newFilters.type);
    newFilters.industries.forEach(industry => params.append('industry', industry));
    newFilters.regions.forEach(region => params.append('region', region));
    newFilters.categories.forEach(category => params.append('category', category));
    if (newFilters.companySize) {
      newFilters.companySize.forEach(size => params.append('size', size));
    }
    if (newFilters.sortBy !== 'relevance') params.set('sort', newFilters.sortBy);
    if (newFilters.sortOrder !== 'desc') params.set('order', newFilters.sortOrder);

    const url = params.toString() ? `?${params.toString()}` : '';
    router.replace(`/search/enhanced${url}`, { scroll: false });
  }, [router]);

  // 検索実行
  const performSearch = useCallback(async (searchFilters: AdvancedFilters, pageNum = 1) => {
    setLoading(true);
    try {
      const searchResults = await performAdvancedSearch({
        ...searchFilters,
        limit: itemsPerPage,
        offset: (pageNum - 1) * itemsPerPage
      });
      
      setResults(searchResults);
      setPage(pageNum);
    } catch (error) {
      logger.error('Search failed', error instanceof Error ? error : new Error(String(error)));
    } finally {
      setLoading(false);
    }
  }, []);

  // フィルター変更ハンドラー
  const handleFiltersChange = useCallback((newFilters: AdvancedFilters) => {
    setFilters(newFilters);
    updateURL(newFilters);
  }, [updateURL]);

  // 検索実行ハンドラー
  const handleSearch = useCallback(() => {
    performSearch(filters, 1);
  }, [filters, performSearch]);

  // サジェスト取得
  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    
    try {
      const suggestions = await getSearchSuggestions(query);
      setSuggestions(suggestions);
    } catch (error) {
      logger.error('Suggestions fetch failed', error instanceof Error ? error : new Error(String(error)));
      setSuggestions([]);
    }
  }, []);

  // お気に入り機能
  const handleFavorite = useCallback((id: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(id)) {
        newFavorites.delete(id);
      } else {
        newFavorites.add(id);
      }
      // ローカルストレージに保存
      localStorage.setItem('search_favorites', JSON.stringify(Array.from(newFavorites)));
      return newFavorites;
    });
  }, []);

  // シェア機能
  const handleShare = useCallback(async (item: any) => {
    const url = window.location.origin + (item.slug ? `/o/${item.slug}` : '#');
    const text = `${item.name || item.title} | AIO Hub`;
    
    if (navigator.share) {
      try {
        await navigator.share({ title: text, url });
      } catch (error) {
        // フォールバック: クリップボードにコピー
        navigator.clipboard.writeText(url);
      }
    } else {
      navigator.clipboard.writeText(url);
    }
  }, []);

  // 初期化・お気に入り読み込み
  useEffect(() => {
    const savedFavorites = localStorage.getItem('search_favorites');
    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)));
    }
    
    // 初回検索実行
    if (filters.query || searchParams.toString()) {
      performSearch(filters);
    }
  }, []);

  // クエリ変更時のサジェスト
  useEffect(() => {
    if (showSuggestions) {
      fetchSuggestions(filters.query);
    }
  }, [filters.query, showSuggestions, fetchSuggestions]);

  // 結果の統合とソート
  const allResults = useMemo(() => {
    const combined = [
      ...results.organizations.map(org => ({ ...org, _type: 'organization' as const })),
      ...results.services.map(service => ({ ...service, _type: 'service' as const })),
      ...results.case_studies.map(caseStudy => ({ ...caseStudy, _type: 'case_study' as const }))
    ];

    // レレバンススコアベースのソート（簡易実装）
    if (filters.sortBy === 'relevance' && filters.query) {
      return combined.sort((a, b) => {
        const aScore = calculateRelevanceScore(a, filters.query);
        const bScore = calculateRelevanceScore(b, filters.query);
        return bScore - aScore;
      });
    }

    return combined;
  }, [results, filters.query, filters.sortBy]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {t('search.enhanced.title')}
          </h1>
          <p className="text-slate-600">
            {t('search.enhanced.subtitle')}
          </p>
        </div>

        {/* 検索フィルター */}
        <div className="mb-8 relative">
          <AdvancedSearchFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            industries={results.facets.industries.map(f => f.name)}
            categories={results.facets.categories.map(f => f.name)}
            onSearch={handleSearch}
            resultsCount={results.total}
          />

          {/* 検索サジェスト */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 bg-white  border border-gray-200 rounded-lg shadow-lg mt-1">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setFilters(prev => ({ ...prev, query: suggestion }));
                    setShowSuggestions(false);
                    performSearch({ ...filters, query: suggestion });
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100  first:rounded-t-lg last:rounded-b-lg"
                >
                  <span className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-slate-500" />
                    {suggestion}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ツールバー */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">
              {results.total > 0 && (
                `${((page - 1) * itemsPerPage) + 1} - ${Math.min(page * itemsPerPage, results.total)} / ${results.total.toLocaleString()}`
              )}
            </span>
            {filters.query && (
              <span className="flex items-center gap-1 text-sm text-[var(--aio-primary)]">
                <Zap className="w-4 h-4" />
                {t('search.smartSearch')}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list' 
                  ? 'bg-blue-100 text-[var(--aio-primary)]' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-blue-100 text-[var(--aio-primary)]' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Grid className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 読み込み状態 */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--aio-primary)]" />
            <span className="ml-3 text-slate-600">
              {t('search.searching')}...
            </span>
          </div>
        )}

        {/* 検索結果 */}
        {!loading && allResults.length > 0 && (
          <div className={`${
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' 
              : 'space-y-6'
          }`}>
            {allResults.map((item, index) => (
              <SearchResultCard
                key={`${item._type}-${item.id}-${index}`}
                type={item._type}
                data={item}
                onFavorite={handleFavorite}
                onShare={handleShare}
                isFavorited={favorites.has(item.id)}
              />
            ))}
          </div>
        )}

        {/* 検索結果なし */}
        {!loading && allResults.length === 0 && filters.query && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              {t('search.noResults')}
            </h3>
            <p className="text-slate-600 mb-4">
              {t('search.noResultsDescription')}
            </p>
            <button
              onClick={() => {
                setFilters(prev => ({ 
                  ...prev, 
                  query: '', 
                  industries: [], 
                  regions: [], 
                  categories: [],
                  companySize: []
                }));
              }}
              className="text-[var(--aio-primary)] hover:text-blue-800"
            >
              {t('search.clearFilters')}
            </button>
          </div>
        )}

        {/* ページネーション */}
        {!loading && allResults.length > 0 && results.total > itemsPerPage && (
          <div className="flex justify-center mt-12">
            <div className="flex items-center gap-2">
              {page > 1 && (
                <button
                  onClick={() => performSearch(filters, page - 1)}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  {t('pagination.previous')}
                </button>
              )}
              
              <span className="px-4 py-2 text-sm text-slate-600">
                {t('pagination.page')} {page} / {Math.ceil(results.total / itemsPerPage)}
              </span>
              
              {page < Math.ceil(results.total / itemsPerPage) && (
                <button
                  onClick={() => performSearch(filters, page + 1)}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  {t('pagination.next')}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// レレバンススコア計算（簡易実装）
function calculateRelevanceScore(item: any, query: string): number {
  const lowerQuery = query.toLowerCase();
  let score = 0;

  // 名前/タイトルでの完全一致
  const name = (item.name || item.title || '').toLowerCase();
  if (name === lowerQuery) score += 100;
  else if (name.includes(lowerQuery)) score += 50;

  // 説明での一致
  const description = (item.description || item.summary || '').toLowerCase();
  if (description.includes(lowerQuery)) score += 20;

  // 業界での一致
  const industry = (item.industry || '').toLowerCase();
  if (industry.includes(lowerQuery)) score += 30;

  return score;
}

export default function EnhancedSearchPage() {
  return (
    <I18nProvider>
      <EnhancedSearchForm />
    </I18nProvider>
  );
}