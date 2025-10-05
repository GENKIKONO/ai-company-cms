/**
 * 高度検索機能
 * 複数フィルタリング条件とソート機能を提供
 */

import { supabaseClient } from '@/lib/supabase-client';
import { type Organization, type Service, type CaseStudy } from '@/types/database';

export interface AdvancedSearchFilters {
  query: string;
  type: 'all' | 'organizations' | 'services' | 'case_studies';
  industries: string[];
  regions: string[];
  categories: string[];
  establishedYear?: {
    min?: number;
    max?: number;
  };
  companySize?: string[];
  rating?: number;
  hasAwards?: boolean;
  hasCertifications?: boolean;
  priceRange?: {
    min?: number;
    max?: number;
  };
  sortBy: 'relevance' | 'name' | 'established' | 'rating' | 'updated';
  sortOrder: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface AdvancedSearchResults {
  organizations: Organization[];
  services: (Service & { organization: Organization })[];
  case_studies: (CaseStudy & { organization: Organization })[];
  total: number;
  facets: {
    industries: Array<{ name: string; count: number }>;
    regions: Array<{ name: string; count: number }>;
    categories: Array<{ name: string; count: number }>;
    companySizes: Array<{ name: string; count: number }>;
  };
}

/**
 * 高度検索実行
 */
export async function performAdvancedSearch(
  filters: AdvancedSearchFilters
): Promise<AdvancedSearchResults> {
  const results: AdvancedSearchResults = {
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
  };

  // 並列で各タイプの検索を実行
  const searchPromises = [];

  if (filters.type === 'all' || filters.type === 'organizations') {
    searchPromises.push(searchOrganizations(filters));
  }

  if (filters.type === 'all' || filters.type === 'services') {
    searchPromises.push(searchServices(filters));
  }

  if (filters.type === 'all' || filters.type === 'case_studies') {
    searchPromises.push(searchCaseStudies(filters));
  }

  // ファセット情報の取得
  const facetsPromise = getFacets(filters);

  try {
    const [searchResults, facets] = await Promise.all([
      Promise.all(searchPromises),
      facetsPromise
    ]);

    // 結果をマージ
    searchResults.forEach(result => {
      if (result.type === 'organizations') {
        results.organizations = result.data;
      } else if (result.type === 'services') {
        results.services = result.data;
      } else if (result.type === 'case_studies') {
        results.case_studies = result.data;
      }
    });

    results.total = results.organizations.length + results.services.length + results.case_studies.length;
    results.facets = facets;

    return results;
  } catch (error) {
    console.error('Advanced search error:', error);
    return results;
  }
}

/**
 * 企業検索
 */
async function searchOrganizations(filters: AdvancedSearchFilters) {
  let query = supabaseClient
    .from('organizations')
    .select(`
      *,
      services:services(count)
    `)
    .eq('published', true);

  // フルテキスト検索
  if (filters.query) {
    query = query.or(
      `name.ilike.%${filters.query}%,description.ilike.%${filters.query}%,industry.ilike.%${filters.query}%`
    );
  }

  // 業界フィルター
  if (filters.industries.length > 0) {
    query = query.in('industry', filters.industries);
  }

  // 地域フィルター
  if (filters.regions.length > 0) {
    query = query.in('address_region', filters.regions);
  }

  // 設立年フィルター (空文字チェック強化)
  if (filters.establishedYear?.min || filters.establishedYear?.max) {
    if (filters.establishedYear.min && filters.establishedYear.min > 0) {
      const minDate = `${filters.establishedYear.min}-01-01`;
      if (minDate !== '-01-01' && minDate !== '0-01-01') { // 空文字・無効値チェック
        query = query.gte('established_at', minDate);
      }
    }
    if (filters.establishedYear.max && filters.establishedYear.max > 0) {
      const maxDate = `${filters.establishedYear.max}-12-31`;
      if (maxDate !== '-12-31' && maxDate !== '0-12-31') { // 空文字・無効値チェック
        query = query.lte('established_at', maxDate);
      }
    }
  }

  // 企業規模フィルター
  if (filters.companySize && filters.companySize.length > 0) {
    const sizeConditions = filters.companySize.map(size => {
      switch (size) {
        case 'startup': return 'employee_count.lte.10';
        case 'small': return 'employee_count.gte.11,employee_count.lte.50';
        case 'medium': return 'employee_count.gte.51,employee_count.lte.200';
        case 'large': return 'employee_count.gte.201,employee_count.lte.1000';
        case 'enterprise': return 'employee_count.gte.1001';
        default: return null;
      }
    }).filter(Boolean);

    if (sizeConditions.length > 0) {
      query = query.or(sizeConditions.join(','));
    }
  }

  // 受賞歴フィルター
  if (filters.hasAwards) {
    query = query.not('awards', 'is', null);
  }

  // 認証フィルター
  if (filters.hasCertifications) {
    query = query.not('certifications', 'is', null);
  }

  // ソート
  if (filters.sortBy !== 'relevance') {
    const sortColumn = getSortColumn('organizations', filters.sortBy);
    query = query.order(sortColumn, { ascending: filters.sortOrder === 'asc' });
  }

  // リミット・オフセット
  if (filters.limit) {
    query = query.range(filters.offset || 0, (filters.offset || 0) + filters.limit - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Organization search error:', error);
    return { type: 'organizations', data: [] };
  }

  return { type: 'organizations', data: data || [] };
}

/**
 * サービス検索
 */
async function searchServices(filters: AdvancedSearchFilters) {
  let query = supabaseClient
    .from('services')
    .select(`
      *,
      organization:organizations(*)
    `)
    .eq('published', true);

  // フルテキスト検索
  if (filters.query) {
    query = query.or(
      `name.ilike.%${filters.query}%,description.ilike.%${filters.query}%,category.ilike.%${filters.query}%`
    );
  }

  // カテゴリフィルター
  if (filters.categories.length > 0) {
    query = query.in('category', filters.categories);
  }

  // 価格帯フィルター
  if (filters.priceRange?.min !== undefined || filters.priceRange?.max !== undefined) {
    if (filters.priceRange.min !== undefined) {
      query = query.gte('price_min', filters.priceRange.min);
    }
    if (filters.priceRange.max !== undefined) {
      query = query.lte('price_max', filters.priceRange.max);
    }
  }

  // ソート
  if (filters.sortBy !== 'relevance') {
    const sortColumn = getSortColumn('services', filters.sortBy);
    query = query.order(sortColumn, { ascending: filters.sortOrder === 'asc' });
  }

  // リミット・オフセット
  if (filters.limit) {
    query = query.range(filters.offset || 0, (filters.offset || 0) + filters.limit - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Service search error:', error);
    return { type: 'services', data: [] };
  }

  return { type: 'services', data: data || [] };
}

/**
 * 事例検索
 */
async function searchCaseStudies(filters: AdvancedSearchFilters) {
  let query = supabaseClient
    .from('case_studies')
    .select(`
      *,
      organization:organizations(*)
    `)
    .eq('published', true);

  // フルテキスト検索
  if (filters.query) {
    query = query.or(
      `title.ilike.%${filters.query}%,summary.ilike.%${filters.query}%,industry.ilike.%${filters.query}%`
    );
  }

  // 業界フィルター
  if (filters.industries.length > 0) {
    query = query.in('industry', filters.industries);
  }

  // ソート
  if (filters.sortBy !== 'relevance') {
    const sortColumn = getSortColumn('case_studies', filters.sortBy);
    query = query.order(sortColumn, { ascending: filters.sortOrder === 'asc' });
  }

  // リミット・オフセット
  if (filters.limit) {
    query = query.range(filters.offset || 0, (filters.offset || 0) + filters.limit - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Case study search error:', error);
    return { type: 'case_studies', data: [] };
  }

  return { type: 'case_studies', data: data || [] };
}

/**
 * ファセット情報取得
 */
async function getFacets(filters: AdvancedSearchFilters) {
  const facets = {
    industries: [] as Array<{ name: string; count: number }>,
    regions: [] as Array<{ name: string; count: number }>,
    categories: [] as Array<{ name: string; count: number }>,
    companySizes: [] as Array<{ name: string; count: number }>
  };

  try {
    // 業界ファセット（企業ベース）
    const { data: industryData } = await supabaseClient
      .from('organizations')
      .select('industry')
      .eq('published', true)
      .not('industry', 'is', null);

    if (industryData) {
      const industryCounts = new Map<string, number>();
      industryData.forEach(org => {
        if (org.industry) {
          industryCounts.set(org.industry, (industryCounts.get(org.industry) || 0) + 1);
        }
      });
      facets.industries = Array.from(industryCounts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);
    }

    // 地域ファセット
    const { data: regionData } = await supabaseClient
      .from('organizations')
      .select('address_region')
      .eq('published', true)
      .not('address_region', 'is', null);

    if (regionData) {
      const regionCounts = new Map<string, number>();
      regionData.forEach(org => {
        if (org.address_region) {
          regionCounts.set(org.address_region, (regionCounts.get(org.address_region) || 0) + 1);
        }
      });
      facets.regions = Array.from(regionCounts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
    }

    // カテゴリファセット（サービスベース）
    const { data: categoryData } = await supabaseClient
      .from('services')
      .select('category')
      .eq('published', true)
      .not('category', 'is', null);

    if (categoryData) {
      const categoryCounts = new Map<string, number>();
      categoryData.forEach(service => {
        if (service.category) {
          categoryCounts.set(service.category, (categoryCounts.get(service.category) || 0) + 1);
        }
      });
      facets.categories = Array.from(categoryCounts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);
    }

    // 企業規模ファセット
    const { data: sizeData } = await supabaseClient
      .from('organizations')
      .select('employee_count')
      .eq('published', true)
      .not('employee_count', 'is', null);

    if (sizeData) {
      const sizeCounts = {
        startup: 0,
        small: 0,
        medium: 0,
        large: 0,
        enterprise: 0
      };

      sizeData.forEach(org => {
        const count = org.employee_count;
        if (count <= 10) sizeCounts.startup++;
        else if (count <= 50) sizeCounts.small++;
        else if (count <= 200) sizeCounts.medium++;
        else if (count <= 1000) sizeCounts.large++;
        else sizeCounts.enterprise++;
      });

      facets.companySizes = Object.entries(sizeCounts)
        .map(([name, count]) => ({ name, count }))
        .filter(item => item.count > 0);
    }

  } catch (error) {
    console.error('Facets fetch error:', error);
  }

  return facets;
}

/**
 * ソートカラム取得
 */
function getSortColumn(table: string, sortBy: string): string {
  const columnMap: Record<string, Record<string, string>> = {
    organizations: {
      name: 'name',
      established: 'established_at',
      updated: 'updated_at'
    },
    services: {
      name: 'name',
      updated: 'updated_at'
    },
    case_studies: {
      name: 'title',
      updated: 'updated_at'
    }
  };

  return columnMap[table]?.[sortBy] || 'updated_at';
}

/**
 * 検索建議（サジェスト）
 */
export async function getSearchSuggestions(query: string, limit = 10): Promise<string[]> {
  if (!query || query.length < 2) return [];

  try {
    const suggestions = new Set<string>();

    // 企業名からサジェスト
    const { data: orgs } = await supabaseClient
      .from('organizations')
      .select('name')
      .eq('published', true)
      .ilike('name', `%${query}%`)
      .limit(limit);

    orgs?.forEach(org => suggestions.add(org.name));

    // 業界からサジェスト
    const { data: industries } = await supabaseClient
      .from('organizations')
      .select('industry')
      .eq('published', true)
      .not('industry', 'is', null)
      .ilike('industry', `%${query}%`)
      .limit(5);

    industries?.forEach(item => {
      if (item.industry) suggestions.add(item.industry);
    });

    // サービス名からサジェスト
    const { data: services } = await supabaseClient
      .from('services')
      .select('name')
      .eq('published', true)
      .ilike('name', `%${query}%`)
      .limit(5);

    services?.forEach(service => suggestions.add(service.name));

    return Array.from(suggestions).slice(0, limit);
  } catch (error) {
    console.error('Search suggestions error:', error);
    return [];
  }
}