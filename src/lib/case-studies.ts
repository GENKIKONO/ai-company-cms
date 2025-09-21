import { createClient } from '@/lib/supabase-client';
import { type CaseStudy, type CaseStudyFormData } from '@/types/database';

const supabase = supabaseClient;

export interface GetCaseStudiesOptions {
  search?: string;
  organizationId?: string;
  clientIndustry?: string;
  isAnonymous?: boolean;
  limit?: number;
  offset?: number;
}

export async function getCaseStudies(options: GetCaseStudiesOptions = {}) {
  let query = supabase
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

  if (options.search) {
    query = query.or(`title.ilike.%${options.search}%,problem.ilike.%${options.search}%,solution.ilike.%${options.search}%`);
  }

  if (options.organizationId) {
    query = query.eq('organization_id', options.organizationId);
  }

  if (options.clientIndustry) {
    query = query.eq('client_industry', options.clientIndustry);
  }

  if (options.isAnonymous !== undefined) {
    query = query.eq('is_anonymous', options.isAnonymous);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
  }

  return await query;
}

export async function getCaseStudy(id: string) {
  return await supabase
    .from('case_studies')
    .select(`
      *,
      organization:organizations(
        id,
        name,
        slug,
        logo_url,
        description
      )
    `)
    .eq('id', id)
    .single();
}

export async function createCaseStudy(data: CaseStudyFormData) {
  const { data: caseStudy, error } = await supabase
    .from('case_studies')
    .insert([data])
    .select()
    .single();

  return { data: caseStudy, error };
}

export async function updateCaseStudy(id: string, data: Partial<CaseStudyFormData>) {
  const { data: caseStudy, error } = await supabase
    .from('case_studies')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  return { data: caseStudy, error };
}

export async function deleteCaseStudy(id: string) {
  return await supabase
    .from('case_studies')
    .delete()
    .eq('id', id);
}

export async function getClientIndustries() {
  const { data, error } = await supabase
    .from('case_studies')
    .select('client_industry')
    .not('client_industry', 'is', null);

  if (error) return { data: [], error };

  const industries = [...new Set(data.map(item => item.client_industry))].filter(Boolean);
  return { data: industries, error: null };
}

export async function getCaseStudiesByOrganization(organizationId: string) {
  return await supabase
    .from('case_studies')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });
}

export async function getCaseStudyStats() {
  const [totalResult, byOrganizationResult, byIndustryResult, anonymousResult] = await Promise.all([
    supabase
      .from('case_studies')
      .select('id', { count: 'exact', head: true }),
    supabase
      .from('case_studies')
      .select('organization_id', { count: 'exact' })
      .group('organization_id'),
    supabase
      .from('case_studies')
      .select('client_industry', { count: 'exact' })
      .not('client_industry', 'is', null)
      .group('client_industry'),
    supabase
      .from('case_studies')
      .select('id', { count: 'exact', head: true })
      .eq('is_anonymous', true)
  ]);

  return {
    total: totalResult.count || 0,
    byOrganization: byOrganizationResult.data?.length || 0,
    byIndustry: byIndustryResult.data || [],
    anonymous: anonymousResult.count || 0
  };
}

export async function getFeaturedCaseStudies(limit: number = 6) {
  return await supabase
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
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(limit);
}

export async function getRecentCaseStudies(limit: number = 10) {
  return await supabase
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
    .order('created_at', { ascending: false })
    .limit(limit);
}