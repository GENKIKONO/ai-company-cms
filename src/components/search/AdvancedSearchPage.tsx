'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { debounce } from 'lodash';
import { MagnifyingGlassIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import { SearchFilters, facetedSearchService, SearchResult } from '@/lib/faceted-search';
import FacetedSearchPanel from './FacetedSearchPanel';
import SearchResultsGrid, { ViewMode } from './SearchResultsGrid';

interface AdvancedSearchPageProps {
  searchParams: {
    q?: string;
    industries?: string;
    regions?: string;
    sizes?: string;
    technologies?: string;
    hasUrl?: string;
    hasLogo?: string;
    hasServices?: string;
    hasCaseStudies?: string;
    isVerified?: string;
    lastUpdated?: string;
    view?: 'grid' | 'list' | 'table';
    sort?: string;
    page?: string;
  };
}

export default function AdvancedSearchPage({ searchParams }: AdvancedSearchPageProps) {
  const router = useRouter();
  const urlSearchParams = useSearchParams();
  
  const [searchResult, setSearchResult] = useState<SearchResult>({
    organizations: [],
    facets: [],
    totalCount: 0,
    hasMore: false,
    searchTime: 0,
  });
  
  const [filters, setFilters] = useState<SearchFilters>(() => {
    return parseSearchParams(searchParams);
  });
  
  const [viewMode, setViewMode] = useState<ViewMode>(
    (searchParams.view as ViewMode) || 'grid'
  );
  
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.page || '1')
  );
  
  const [false, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.q || '');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Parse search params into filters object
  function parseSearchParams(params: any): SearchFilters {
    const filters: SearchFilters = {};
    
    if (params.q) filters.query = params.q;
    if (params.industries) filters.industries = params.industries.split(',');
    if (params.regions) filters.regions = params.regions.split(',');
    if (params.sizes) filters.sizes = params.sizes.split(',');
    if (params.technologies) filters.technologies = params.technologies.split(',');
    if (params.hasUrl) filters.hasUrl = params.hasUrl === 'true';
    if (params.hasLogo) filters.hasLogo = params.hasLogo === 'true';
    if (params.hasServices) filters.hasServices = params.hasServices === 'true';
    if (params.hasCaseStudies) filters.hasCaseStudies = params.hasCaseStudies === 'true';
    if (params.isVerified) filters.isVerified = params.isVerified === 'true';
    if (params.lastUpdated) filters.lastUpdated = params.lastUpdated;
    
    return filters;
  }

  // Update URL with current filters
  const updateUrl = useCallback((newFilters: SearchFilters, newViewMode?: ViewMode, newPage?: number) => {
    const params = new URLSearchParams();
    
    if (newFilters.query) params.set('q', newFilters.query);
    if (newFilters.industries?.length) params.set('industries', newFilters.industries.join(','));
    if (newFilters.regions?.length) params.set('regions', newFilters.regions.join(','));
    if (newFilters.sizes?.length) params.set('sizes', newFilters.sizes.join(','));
    if (newFilters.technologies?.length) params.set('technologies', newFilters.technologies.join(','));
    if (newFilters.hasUrl !== undefined) params.set('hasUrl', String(newFilters.hasUrl));
    if (newFilters.hasLogo !== undefined) params.set('hasLogo', String(newFilters.hasLogo));
    if (newFilters.hasServices !== undefined) params.set('hasServices', String(newFilters.hasServices));
    if (newFilters.hasCaseStudies !== undefined) params.set('hasCaseStudies', String(newFilters.hasCaseStudies));
    if (newFilters.isVerified !== undefined) params.set('isVerified', String(newFilters.isVerified));
    if (newFilters.lastUpdated) params.set('lastUpdated', newFilters.lastUpdated);
    
    if (newViewMode && newViewMode !== 'grid') params.set('view', newViewMode);
    if (newPage && newPage > 1) params.set('page', String(newPage));
    
    const url = `/search${params.toString() ? `?${params.toString()}` : ''}`;
    router.push(url, { scroll: false });
  }, [router]);

  // Perform search
  const performSearch = useCallback(async (
    searchFilters: SearchFilters, 
    page: number = 1,
    loadMore: boolean = false
  ) => {
    setLoading(true);
    
    try {
      const result = await facetedSearchService.searchWithFacets(
        searchFilters,
        page,
        24
      );
      
      if (loadMore && page > 1) {
        setSearchResult(prev => ({
          ...result,
          organizations: [...prev.organizations, ...result.organizations],
        }));
      } else {
        setSearchResult(result);
      }
      
      
    } catch (error) {
      console.error('Search error:', error);
      setSearchResult({
        organizations: [],
        facets: [],
        totalCount: 0,
        hasMore: false,
        searchTime: 0,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search for query input
  const debouncedSearch = useCallback(
    debounce((searchFilters: SearchFilters) => {
      setCurrentPage(1);
      performSearch(searchFilters, 1);
      updateUrl(searchFilters, viewMode, 1);
    }, 500),
    [performSearch, updateUrl, viewMode]
  );

  // Handle filter changes
  const handleFiltersChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    
    if (newFilters.query !== filters.query) {
      // Debounce text search
      debouncedSearch(newFilters);
    } else {
      // Immediate search for facet changes
      performSearch(newFilters, 1);
      updateUrl(newFilters, viewMode, 1);
    }
  };

  // Handle view mode change
  const handleViewModeChange = (newViewMode: ViewMode) => {
    setViewMode(newViewMode);
    updateUrl(filters, newViewMode, currentPage);
  };

  // Handle load more
  const handleLoadMore = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    performSearch(filters, nextPage, true);
    updateUrl(filters, viewMode, nextPage);
  };

  // Handle search input change
  const handleSearchInputChange = (value: string) => {
    setSearchQuery(value);
    const newFilters = { ...filters, query: value };
    setFilters(newFilters);
    debouncedSearch(newFilters);
  };

  // Initial search on mount
  useEffect(() => {
    performSearch(filters, currentPage);
  }, []); // Only run on mount

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Mobile filter toggle */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="flex items-center justify-center w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <AdjustmentsHorizontalIcon className="w-5 h-5 mr-2" />
          フィルター
          {Object.keys(filters).filter(key => {
            const value = filters[key as keyof SearchFilters];
            return value !== undefined && value !== null && value !== '';
          }).length > 0 && (
            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              {Object.keys(filters).filter(key => {
                const value = filters[key as keyof SearchFilters];
                return value !== undefined && value !== null && value !== '';
              }).length}
            </span>
          )}
        </button>
      </div>

      {/* Search Filters Sidebar */}
      <div className={`lg:col-span-1 ${showMobileFilters ? 'block' : 'hidden lg:block'}`}>
        {/* Search Input */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchInputChange(e.target.value)}
              placeholder="キーワードで検索..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Faceted Search Panel */}
        <FacetedSearchPanel
          facets={searchResult.facets}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          totalResults={searchResult.totalCount}
          searchTime={searchResult.searchTime}
        />
      </div>

      {/* Search Results */}
      <div className="lg:col-span-3">
        <SearchResultsGrid
          organizations={searchResult.organizations}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          totalCount={searchResult.totalCount}
          currentPage={currentPage}
          hasMore={searchResult.hasMore}
          false={false}
          onLoadMore={handleLoadMore}
        />
      </div>
    </div>
  );
}