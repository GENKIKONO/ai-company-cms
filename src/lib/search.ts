import { createClient } from '@/lib/supabase/client';
import { type Organization, type Service, type CaseStudy } from '@/types/database';

const supabase = createClient();

export interface SearchOptions {
  query?: string;
  types?: ('organizations' | 'services' | 'case_studies')[];
  industries?: string[];
  categories?: string[];
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  type: 'organization' | 'service' | 'case_study';
  id: string;
  title: string;
  description?: string;
  url?: string;
  data: Organization | Service | CaseStudy;
}

export interface SearchResults {
  organizations: Organization[];
  services: Service[];
  caseStudies: CaseStudy[];
  total: number;
}

export async function globalSearch(options: SearchOptions): Promise<SearchResults> {
  const { query, types = ['organizations', 'services', 'case_studies'], limit = 50 } = options;
  
  const results: SearchResults = {
    organizations: [],
    services: [],
    caseStudies: [],
    total: 0
  };

  // Search organizations
  if (types.includes('organizations')) {
    let orgQuery = supabase
      .from('organizations')
      .select('*')
      .eq('status', 'published')
      .order('name');

    if (query) {
      orgQuery = orgQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
    }

    if (options.industries && options.industries.length > 0) {
      orgQuery = orgQuery.overlaps('industries', options.industries);
    }

    const { data: organizations } = await orgQuery.limit(limit);
    if (organizations) {
      results.organizations = organizations;
      results.total += organizations.length;
    }
  }

  // Search services
  if (types.includes('services')) {
    let serviceQuery = supabase
      .from('services')
      .select(`
        *,
        organization:organizations(
          id,
          name,
          slug,
          logo_url
        )
      `)
      .order('name');

    if (query) {
      serviceQuery = serviceQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
    }

    if (options.categories && options.categories.length > 0) {
      serviceQuery = serviceQuery.in('category', options.categories);
    }

    const { data: services } = await serviceQuery.limit(limit);
    if (services) {
      results.services = services;
      results.total += services.length;
    }
  }

  // Search case studies
  if (types.includes('case_studies')) {
    let caseStudyQuery = supabase
      .from('case_studies')
      .select(`
        *,
        organization:organizations(
          id,
          name,
          slug,
          logo_url
        )
      `)
      .order('created_at', { ascending: false });

    if (query) {
      caseStudyQuery = caseStudyQuery.or(`title.ilike.%${query}%,problem.ilike.%${query}%,solution.ilike.%${query}%,outcome.ilike.%${query}%`);
    }

    if (options.industries && options.industries.length > 0) {
      caseStudyQuery = caseStudyQuery.in('client_industry', options.industries);
    }

    const { data: caseStudies } = await caseStudyQuery.limit(limit);
    if (caseStudies) {
      results.caseStudies = caseStudies;
      results.total += caseStudies.length;
    }
  }

  return results;
}

export async function getSearchSuggestions(query: string, limit: number = 10) {
  if (!query.trim()) return [];

  const suggestions: string[] = [];

  // Get organization names
  const { data: orgs } = await supabase
    .from('organizations')
    .select('name')
    .eq('status', 'published')
    .ilike('name', `%${query}%`)
    .limit(limit);

  if (orgs) {
    suggestions.push(...orgs.map(org => org.name));
  }

  // Get service names
  const { data: services } = await supabase
    .from('services')
    .select('name')
    .ilike('name', `%${query}%`)
    .limit(limit);

  if (services) {
    suggestions.push(...services.map(service => service.name));
  }

  // Remove duplicates and limit results
  return [...new Set(suggestions)].slice(0, limit);
}

export async function getPopularSearchTerms(limit: number = 10) {
  // This would typically come from analytics data
  // For now, return some common terms
  return [
    'AI',
    '機械学習',
    'クラウド',
    'データ分析',
    'セキュリティ',
    'マーケティング',
    'ヘルスケア',
    'フィンテック'
  ].slice(0, limit);
}

export async function saveSearch(userId: string, query: string, filters: any) {
  return await supabase
    .from('user_saved_searches')
    .insert({
      user_id: userId,
      query,
      filters,
      name: `検索: ${query}` // Default name, user can change later
    });
}

export async function getSavedSearches(userId: string) {
  return await supabase
    .from('user_saved_searches')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
}

export async function deleteSavedSearch(id: string) {
  return await supabase
    .from('user_saved_searches')
    .delete()
    .eq('id', id);
}