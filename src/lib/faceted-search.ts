'use client';

import { Organization } from '@/types';
import { supabaseClient } from '@/lib/supabase-client';

export interface FacetOption {
  value: string;
  label: string;
  count: number;
  selected: boolean;
}

export interface FacetGroup {
  key: string;
  label: string;
  type: 'checkbox' | 'radio' | 'range' | 'tags';
  options: FacetOption[];
  allowMultiple: boolean;
  collapsed: boolean;
}

export interface SearchFilters {
  query?: string;
  industries?: string[];
  regions?: string[];
  sizes?: string[];
  foundedYears?: [number, number];
  technologies?: string[];
  hasUrl?: boolean;
  hasLogo?: boolean;
  hasServices?: boolean;
  hasCaseStudies?: boolean;
  rating?: [number, number];
  employeeCount?: [number, number];
  isVerified?: boolean;
  lastUpdated?: string;
}

export interface SearchResult {
  organizations: Organization[];
  facets: FacetGroup[];
  totalCount: number;
  hasMore: boolean;
  searchTime: number;
}

export class FacetedSearchService {
  private readonly FACET_CONFIGS: Record<string, Omit<FacetGroup, 'options'>> = {
    industries: {
      key: 'industries',
      label: '業界',
      type: 'checkbox',
      allowMultiple: true,
      collapsed: false,
    },
    regions: {
      key: 'regions',
      label: '地域',
      type: 'checkbox',
      allowMultiple: true,
      collapsed: false,
    },
    sizes: {
      key: 'sizes',
      label: '企業規模',
      type: 'radio',
      allowMultiple: false,
      collapsed: false,
    },
    technologies: {
      key: 'technologies',
      label: '技術スタック',
      type: 'tags',
      allowMultiple: true,
      collapsed: true,
    },
    features: {
      key: 'features',
      label: '利用可能機能',
      type: 'checkbox',
      allowMultiple: true,
      collapsed: true,
    },
    status: {
      key: 'status',
      label: 'ステータス',
      type: 'checkbox',
      allowMultiple: true,
      collapsed: true,
    },
  };

  async searchWithFacets(
    filters: SearchFilters,
    page: number = 1,
    limit: number = 24
  ): Promise<SearchResult> {
    const startTime = Date.now();
    const offset = (page - 1) * limit;

    try {
      // Build base query
      let query = supabase
        .from('organizations')
        .select('*', { count: 'exact' });

      // Apply text search
      if (filters.query) {
        query = query.or(`name.ilike.%${filters.query}%,description.ilike.%${filters.query}%,keywords.ilike.%${filters.query}%`);
      }

      // Apply filters
      if (filters.industries?.length) {
        query = query.overlaps('industries', filters.industries);
      }

      if (filters.regions?.length) {
        query = query.in('address_region', filters.regions);
      }

      if (filters.sizes?.length) {
        query = query.in('size', filters.sizes);
      }

      if (filters.technologies?.length) {
        query = query.overlaps('technologies', filters.technologies);
      }

      if (filters.foundedYears) {
        const [min, max] = filters.foundedYears;
        query = query.gte('founded_year', min).lte('founded_year', max);
      }

      if (filters.employeeCount) {
        const [min, max] = filters.employeeCount;
        query = query.gte('employee_count', min).lte('employee_count', max);
      }

      if (filters.rating) {
        const [min, max] = filters.rating;
        query = query.gte('rating', min).lte('rating', max);
      }

      // Boolean filters
      if (filters.hasUrl !== undefined) {
        query = filters.hasUrl 
          ? query.not('url', 'is', null) 
          : query.is('url', null);
      }

      if (filters.hasLogo !== undefined) {
        query = filters.hasLogo 
          ? query.not('logo_url', 'is', null) 
          : query.is('logo_url', null);
      }

      if (filters.hasServices !== undefined) {
        query = filters.hasServices 
          ? query.not('services', 'is', null) 
          : query.is('services', null);
      }

      if (filters.hasCaseStudies !== undefined) {
        query = filters.hasCaseStudies 
          ? query.not('case_studies', 'is', null) 
          : query.is('case_studies', null);
      }

      if (filters.isVerified !== undefined) {
        query = query.eq('is_verified', filters.isVerified);
      }

      if (filters.lastUpdated) {
        const date = new Date();
        const daysAgo = parseInt(filters.lastUpdated);
        date.setDate(date.getDate() - daysAgo);
        query = query.gte('updated_at', date.toISOString());
      }

      // Execute search query
      const { data: organizations, error, count } = await query
        .order('updated_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      // Generate facets in parallel
      const facets = await this.generateFacets(filters);

      const searchTime = Date.now() - startTime;

      return {
        organizations: organizations || [],
        facets,
        totalCount: count || 0,
        hasMore: (count || 0) > offset + limit,
        searchTime,
      };
    } catch (error) {
      console.error('Faceted search error:', error);
      throw error;
    }
  }

  private async generateFacets(currentFilters: SearchFilters): Promise<FacetGroup[]> {
    const facetPromises = [
      this.generateIndustryFacets(currentFilters),
      this.generateRegionFacets(currentFilters),
      this.generateSizeFacets(currentFilters),
      this.generateTechnologyFacets(currentFilters),
      this.generateFeatureFacets(currentFilters),
      this.generateStatusFacets(currentFilters),
    ];

    const facetResults = await Promise.all(facetPromises);
    return facetResults.filter(Boolean) as FacetGroup[];
  }

  private async generateIndustryFacets(filters: SearchFilters): Promise<FacetGroup> {
    const { data, error } = await supabase
      .rpc('get_industry_facets', { 
        current_filters: this.filtersToJson(filters) 
      });

    if (error) {
      console.error('Industry facets error:', error);
      return this.getEmptyFacetGroup('industries');
    }

    const options: FacetOption[] = data?.map((item: any) => ({
      value: item.industry,
      label: item.industry,
      count: item.count,
      selected: filters.industries?.includes(item.industry) || false,
    })) || [];

    return {
      ...this.FACET_CONFIGS.industries,
      options: options.sort((a, b) => b.count - a.count),
    };
  }

  private async generateRegionFacets(filters: SearchFilters): Promise<FacetGroup> {
    const { data, error } = await supabase
      .rpc('get_region_facets', { 
        current_filters: this.filtersToJson(filters) 
      });

    if (error) {
      console.error('Region facets error:', error);
      return this.getEmptyFacetGroup('regions');
    }

    const options: FacetOption[] = data?.map((item: any) => ({
      value: item.region,
      label: item.region,
      count: item.count,
      selected: filters.regions?.includes(item.region) || false,
    })) || [];

    return {
      ...this.FACET_CONFIGS.regions,
      options: options.sort((a, b) => b.count - a.count),
    };
  }

  private async generateSizeFacets(filters: SearchFilters): Promise<FacetGroup> {
    const sizeOrder = ['small', 'medium', 'large', 'enterprise'];
    const sizeLabels = {
      small: 'スタートアップ (1-50名)',
      medium: '中企業 (51-500名)',
      large: '大企業 (501-5000名)',
      enterprise: '大手企業 (5000名以上)',
    };

    const { data, error } = await supabase
      .rpc('get_size_facets', { 
        current_filters: this.filtersToJson(filters) 
      });

    if (error) {
      console.error('Size facets error:', error);
      return this.getEmptyFacetGroup('sizes');
    }

    const options: FacetOption[] = sizeOrder.map(size => {
      const item = data?.find((d: any) => d.size === size);
      return {
        value: size,
        label: sizeLabels[size as keyof typeof sizeLabels],
        count: item?.count || 0,
        selected: filters.sizes?.includes(size) || false,
      };
    }).filter(option => option.count > 0);

    return {
      ...this.FACET_CONFIGS.sizes,
      options,
    };
  }

  private async generateTechnologyFacets(filters: SearchFilters): Promise<FacetGroup> {
    const { data, error } = await supabase
      .rpc('get_technology_facets', { 
        current_filters: this.filtersToJson(filters),
        limit_count: 20
      });

    if (error) {
      console.error('Technology facets error:', error);
      return this.getEmptyFacetGroup('technologies');
    }

    const options: FacetOption[] = data?.map((item: any) => ({
      value: item.technology,
      label: item.technology,
      count: item.count,
      selected: filters.technologies?.includes(item.technology) || false,
    })) || [];

    return {
      ...this.FACET_CONFIGS.technologies,
      options: options.sort((a, b) => b.count - a.count),
    };
  }

  private generateFeatureFacets(filters: SearchFilters): FacetGroup {
    const featureOptions = [
      { key: 'hasUrl', label: 'ウェブサイトあり', count: 0 },
      { key: 'hasLogo', label: 'ロゴあり', count: 0 },
      { key: 'hasServices', label: 'サービス情報あり', count: 0 },
      { key: 'hasCaseStudies', label: '導入事例あり', count: 0 },
    ];

    const options: FacetOption[] = featureOptions.map(feature => ({
      value: feature.key,
      label: feature.label,
      count: feature.count, // Will be populated by actual count query
      selected: filters[feature.key as keyof SearchFilters] === true,
    }));

    return {
      ...this.FACET_CONFIGS.features,
      options,
    };
  }

  private generateStatusFacets(filters: SearchFilters): FacetGroup {
    const statusOptions = [
      { key: 'isVerified', label: '認証済み', count: 0 },
      { key: 'recentlyUpdated', label: '最近更新', count: 0 },
    ];

    const options: FacetOption[] = statusOptions.map(status => ({
      value: status.key,
      label: status.label,
      count: status.count, // Will be populated by actual count query
      selected: status.key === 'isVerified' 
        ? filters.isVerified === true 
        : filters.lastUpdated === '30',
    }));

    return {
      ...this.FACET_CONFIGS.status,
      options,
    };
  }

  private getEmptyFacetGroup(key: string): FacetGroup {
    return {
      ...this.FACET_CONFIGS[key],
      options: [],
    };
  }

  private filtersToJson(filters: SearchFilters): string {
    return JSON.stringify(filters);
  }

  // Utility methods for filter manipulation
  toggleFilter(filters: SearchFilters, facetKey: string, value: string): SearchFilters {
    const newFilters = { ...filters };

    switch (facetKey) {
      case 'industries':
        if (!newFilters.industries) newFilters.industries = [];
        if (newFilters.industries.includes(value)) {
          newFilters.industries = newFilters.industries.filter(v => v !== value);
        } else {
          newFilters.industries.push(value);
        }
        break;

      case 'regions':
        if (!newFilters.regions) newFilters.regions = [];
        if (newFilters.regions.includes(value)) {
          newFilters.regions = newFilters.regions.filter(v => v !== value);
        } else {
          newFilters.regions.push(value);
        }
        break;

      case 'sizes':
        newFilters.sizes = newFilters.sizes?.includes(value) ? [] : [value];
        break;

      case 'technologies':
        if (!newFilters.technologies) newFilters.technologies = [];
        if (newFilters.technologies.includes(value)) {
          newFilters.technologies = newFilters.technologies.filter(v => v !== value);
        } else {
          newFilters.technologies.push(value);
        }
        break;

      case 'features':
        switch (value) {
          case 'hasUrl':
            newFilters.hasUrl = !newFilters.hasUrl;
            break;
          case 'hasLogo':
            newFilters.hasLogo = !newFilters.hasLogo;
            break;
          case 'hasServices':
            newFilters.hasServices = !newFilters.hasServices;
            break;
          case 'hasCaseStudies':
            newFilters.hasCaseStudies = !newFilters.hasCaseStudies;
            break;
        }
        break;

      case 'status':
        switch (value) {
          case 'isVerified':
            newFilters.isVerified = !newFilters.isVerified;
            break;
          case 'recentlyUpdated':
            newFilters.lastUpdated = newFilters.lastUpdated === '30' ? undefined : '30';
            break;
        }
        break;
    }

    return newFilters;
  }

  clearFilters(): SearchFilters {
    return { query: '' };
  }

  clearFacetGroup(filters: SearchFilters, facetKey: string): SearchFilters {
    const newFilters = { ...filters };

    switch (facetKey) {
      case 'industries':
        delete newFilters.industries;
        break;
      case 'regions':
        delete newFilters.regions;
        break;
      case 'sizes':
        delete newFilters.sizes;
        break;
      case 'technologies':
        delete newFilters.technologies;
        break;
      case 'features':
        delete newFilters.hasUrl;
        delete newFilters.hasLogo;
        delete newFilters.hasServices;
        delete newFilters.hasCaseStudies;
        break;
      case 'status':
        delete newFilters.isVerified;
        delete newFilters.lastUpdated;
        break;
    }

    return newFilters;
  }
}

export const facetedSearchService = new FacetedSearchService();