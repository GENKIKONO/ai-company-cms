// Faceted search types and utilities

export interface SearchFilters {
  industries?: string[];
  regions?: string[];
  sizes?: string[];
  services?: string[];
  technologies?: string[];
  query?: string;
  page?: number;
  limit?: number;
  hasUrl?: boolean;
  hasLogo?: boolean;
  hasServices?: boolean;
  hasCaseStudies?: boolean;
  hasFaqs?: boolean;
  isVerified?: boolean;
  lastUpdated?: string;
  foundedYears?: string[];
  employeeCount?: string[];
  rating?: string[];
}

export interface SearchResult {
  data: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: {
    applied: SearchFilters;
    available: {
      industries: string[];
      regions: string[];
      sizes: string[];
      services: string[];
    };
  };
}

export function createSearchResult(
  data: any[] = [],
  pagination = { page: 1, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
  filters = { applied: {}, available: { industries: [], regions: [], sizes: [], services: [] } }
): SearchResult {
  return {
    data,
    pagination,
    filters
  };
}