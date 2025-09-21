import { Organization } from '@/types';
import { SearchFilters, SearchResult } from '@/lib/faceted-search';

export interface LuxuCareSDKOptions {
  apiKey: string;
  baseURL?: string;
  timeout?: number;
}

export interface ApiResponse<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    has_more?: boolean;
    filters_applied?: number;
  };
}

export interface ApiError {
  error: string;
  message?: string;
  code?: number;
}

export class LuxuCareSDKError extends Error {
  public status: number;
  public code?: number;

  constructor(message: string, status: number, code?: number) {
    super(message);
    this.name = 'LuxuCareSDKError';
    this.status = status;
    this.code = code;
  }
}

export class LuxuCareSDK {
  private apiKey: string;
  private baseURL: string;
  private timeout: number;

  constructor(options: LuxuCareSDKOptions) {
    this.apiKey = options.apiKey;
    this.baseURL = options.baseURL || 'https://api.luxucare.jp';
    this.timeout = options.timeout || 30000;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        ...options.headers,
      },
      ...options,
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      
      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as ApiError;
        throw new LuxuCareSDKError(
          errorData.message || errorData.error || `HTTP ${response.status}`,
          response.status,
          errorData.code
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof LuxuCareSDKError) {
        throw error;
      }
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new LuxuCareSDKError('Network error', 0);
      }

      throw new LuxuCareSDKError(
        error instanceof Error ? error.message : 'Unknown error',
        0
      );
    }
  }

  // Organizations API
  public organizations = {
    /**
     * List organizations with optional filtering
     */
    list: async (params: {
      page?: number;
      limit?: number;
      industry?: string[];
      region?: string[];
      size?: string[];
      q?: string;
    } = {}): Promise<ApiResponse<Organization[]>> => {
      const searchParams = new URLSearchParams();
      
      if (params.page) searchParams.set('page', params.page.toString());
      if (params.limit) searchParams.set('limit', params.limit.toString());
      if (params.industry?.length) searchParams.set('industry', params.industry.join(','));
      if (params.region?.length) searchParams.set('region', params.region.join(','));
      if (params.size?.length) searchParams.set('size', params.size.join(','));
      if (params.q) searchParams.set('q', params.q);

      const endpoint = `/api/organizations${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
      return this.request<Organization[]>(endpoint);
    },

    /**
     * Get a specific organization by ID
     */
    get: async (id: string): Promise<ApiResponse<Organization>> => {
      return this.request<Organization>(`/api/organizations/${id}`);
    },

    /**
     * Create a new organization
     */
    create: async (data: Partial<Organization>): Promise<ApiResponse<Organization>> => {
      return this.request<Organization>('/api/organizations', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    /**
     * Update an existing organization
     */
    update: async (id: string, data: Partial<Organization>): Promise<ApiResponse<Organization>> => {
      return this.request<Organization>(`/api/organizations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    /**
     * Delete an organization
     */
    delete: async (id: string): Promise<ApiResponse<{ message: string }>> => {
      return this.request<{ message: string }>(`/api/organizations/${id}`, {
        method: 'DELETE',
      });
    },
  };

  // Search API
  public search = {
    /**
     * Perform faceted search
     */
    faceted: async (filters: SearchFilters & {
      page?: number;
      limit?: number;
    } = {}): Promise<ApiResponse<SearchResult>> => {
      const searchParams = new URLSearchParams();

      if (filters.query) searchParams.set('q', filters.query);
      if (filters.industries?.length) searchParams.set('industries', filters.industries.join(','));
      if (filters.regions?.length) searchParams.set('regions', filters.regions.join(','));
      if (filters.sizes?.length) searchParams.set('sizes', filters.sizes.join(','));
      if (filters.technologies?.length) searchParams.set('technologies', filters.technologies.join(','));
      if (filters.hasUrl !== undefined) searchParams.set('hasUrl', filters.hasUrl.toString());
      if (filters.hasLogo !== undefined) searchParams.set('hasLogo', filters.hasLogo.toString());
      if (filters.hasServices !== undefined) searchParams.set('hasServices', filters.hasServices.toString());
      if (filters.hasCaseStudies !== undefined) searchParams.set('hasCaseStudies', filters.hasCaseStudies.toString());
      if (filters.isVerified !== undefined) searchParams.set('isVerified', filters.isVerified.toString());
      if (filters.lastUpdated) searchParams.set('lastUpdated', filters.lastUpdated);
      if (filters.foundedYears) searchParams.set('foundedYears', filters.foundedYears.join(','));
      if (filters.employeeCount) searchParams.set('employeeCount', filters.employeeCount.join(','));
      if (filters.rating) searchParams.set('rating', filters.rating.join(','));
      if (filters.page) searchParams.set('page', filters.page.toString());
      if (filters.limit) searchParams.set('limit', filters.limit.toString());

      const endpoint = `/api/search${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
      return this.request<SearchResult>(endpoint);
    },
  };

  // Utility methods
  public utils = {
    /**
     * Test API connection and validate API key
     */
    ping: async (): Promise<{ status: 'ok'; timestamp: number }> => {
      try {
        await this.organizations.list({ limit: 1 });
        return { status: 'ok', timestamp: Date.now() };
      } catch (error) {
        throw error;
      }
    },

    /**
     * Get API rate limit status (mock implementation)
     */
    getRateLimit: (): {
      limit: number;
      remaining: number;
      reset: number;
    } => {
      // In a real implementation, this would come from response headers
      return {
        limit: 1000,
        remaining: 999,
        reset: Date.now() + 3600000, // 1 hour from now
      };
    },
  };
}

// Factory function for easy instantiation
export function createLuxuCareSDK(options: LuxuCareSDKOptions): LuxuCareSDK {
  return new LuxuCareSDK(options);
}

// Type exports for TypeScript users
export type { Organization, SearchFilters, SearchResult };

// Example usage:
/*
import { LuxuCareSDK } from '@luxucare/sdk';

const client = new LuxuCareSDK({
  apiKey: 'your-api-key',
  baseURL: 'https://api.luxucare.jp' // optional
});

// List organizations
const orgResponse = await client.organizations.list({
  page: 1,
  limit: 24,
  industry: ['IT', 'finance']
});

// Get specific organization
const org = await client.organizations.get('org-id');

// Search with facets
const searchResults = await client.search.faceted({
  query: 'keyword',
  industries: ['IT'],
  regions: ['tokyo'],
  page: 1,
  limit: 24
});

// Error handling
try {
  const org = await client.organizations.get('invalid-id');
} catch (error) {
  if (error instanceof LuxuCareSDKError) {
    console.error(`API Error ${error.status}: ${error.message}`);
  }
}
*/