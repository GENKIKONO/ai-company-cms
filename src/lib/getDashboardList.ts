/**
 * Dashboard List Fetcher
 *
 * Fetches dashboard data from secure views with type safety
 */

import { createClient } from '@supabase/supabase-js';
import type { SupabaseDatabase } from '@/types/database.types';
import { allowedViews } from '@/lib/allowlist';

// Type aliases for view rows
type PostRow = SupabaseDatabase['public']['Views']['v_dashboard_posts_secure']['Row'];
type ServiceRow = SupabaseDatabase['public']['Views']['v_dashboard_services_secure']['Row'];
type CaseStudyRow = SupabaseDatabase['public']['Views']['v_dashboard_case_studies_secure']['Row'];
type FaqRow = SupabaseDatabase['public']['Views']['v_dashboard_faqs_secure']['Row'];

export interface DashboardList {
  posts: Array<
    Pick<PostRow, 'id' | 'title' | 'slug' | 'published_at' | 'organization_id' | 'status' | 'is_published'>
  >;
  services: Array<
    Pick<ServiceRow, 'id' | 'name' | 'slug' | 'published_at' | 'organization_id' | 'status' | 'is_published'>
  >;
  case_studies: Array<
    Pick<CaseStudyRow, 'id' | 'title' | 'slug' | 'published_at' | 'organization_id' | 'status' | 'is_published'>
  >;
  faqs: Array<
    Pick<FaqRow, 'id' | 'question' | 'slug' | 'published_at' | 'organization_id' | 'status' | 'is_published'>
  >;
}

export interface GetDashboardListOptions {
  accessToken?: string;
  organizationId?: string;
  limit?: number;
}

/**
 * Fetch dashboard list data from secure views
 *
 * @param options - Configuration options
 * @returns Dashboard data for all 4 entity types
 */
export async function getDashboardList(options: GetDashboardListOptions = {}): Promise<DashboardList> {
  const { accessToken, organizationId, limit = 50 } = options;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  const supabase = createClient<SupabaseDatabase>(
    supabaseUrl,
    supabaseAnonKey,
    accessToken
      ? { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
      : undefined
  );

  // Build queries for each entity type
  let postsQ = supabase
    .from(allowedViews.posts)
    .select('id,title,slug,published_at,organization_id,status,is_published')
    .order('published_at', { ascending: false })
    .limit(limit);

  let servicesQ = supabase
    .from(allowedViews.services)
    .select('id,name,slug,published_at,organization_id,status,is_published')
    .order('published_at', { ascending: false })
    .limit(limit);

  let caseStudiesQ = supabase
    .from(allowedViews.case_studies)
    .select('id,title,slug,published_at,organization_id,status,is_published')
    .order('published_at', { ascending: false })
    .limit(limit);

  let faqsQ = supabase
    .from(allowedViews.faqs)
    .select('id,question,slug,published_at,organization_id,status,is_published')
    .order('published_at', { ascending: false })
    .limit(limit);

  // Apply organization filter if provided
  if (organizationId) {
    postsQ = postsQ.eq('organization_id', organizationId);
    servicesQ = servicesQ.eq('organization_id', organizationId);
    caseStudiesQ = caseStudiesQ.eq('organization_id', organizationId);
    faqsQ = faqsQ.eq('organization_id', organizationId);
  }

  // Execute all queries in parallel
  const [postsRes, servicesRes, caseStudiesRes, faqsRes] = await Promise.all([
    postsQ,
    servicesQ,
    caseStudiesQ,
    faqsQ,
  ]);

  // Check for errors
  if (postsRes.error) throw postsRes.error;
  if (servicesRes.error) throw servicesRes.error;
  if (caseStudiesRes.error) throw caseStudiesRes.error;
  if (faqsRes.error) throw faqsRes.error;

  return {
    posts: postsRes.data ?? [],
    services: servicesRes.data ?? [],
    case_studies: caseStudiesRes.data ?? [],
    faqs: faqsRes.data ?? [],
  };
}

/**
 * Fetch a single entity type from dashboard
 */
export async function getDashboardEntity<K extends keyof DashboardList>(
  entity: K,
  options: GetDashboardListOptions = {}
): Promise<DashboardList[K]> {
  const { accessToken, organizationId, limit = 50 } = options;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  const supabase = createClient<SupabaseDatabase>(
    supabaseUrl,
    supabaseAnonKey,
    accessToken
      ? { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
      : undefined
  );

  const viewName = allowedViews[entity];
  const selectColumns =
    entity === 'services'
      ? 'id,name,slug,published_at,organization_id,status,is_published'
      : entity === 'faqs'
        ? 'id,question,slug,published_at,organization_id,status,is_published'
        : 'id,title,slug,published_at,organization_id,status,is_published';

  // Use any to avoid infinite type instantiation
  let query = (supabase as any).from(viewName)
    .select(selectColumns)
    .order('published_at', { ascending: false })
    .limit(limit);

  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Use unknown intermediate cast as recommended by TypeScript
  return (data ?? []) as unknown as DashboardList[K];
}
