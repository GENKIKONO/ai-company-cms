import { supabaseBrowser } from '@/lib/supabase-client';
import { type Service, type ServiceFormData } from '@/types/database';

export interface GetServicesOptions {
  search?: string;
  organizationId?: string;
  category?: string;
  priceRange?: string;
  limit?: number;
  offset?: number;
}

export async function getServices(options: GetServicesOptions = {}) {
  let query = supabaseBrowser
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
    .order('created_at', { ascending: false });

  if (options.search) {
    query = query.or(`name.ilike.%${options.search}%,description.ilike.%${options.search}%`);
  }

  if (options.organizationId) {
    query = query.eq('organization_id', options.organizationId);
  }

  if (options.category) {
    query = query.eq('category', options.category);
  }

  if (options.priceRange) {
    query = query.eq('price_range', options.priceRange);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
  }

  return await query;
}

export async function getService(id: string) {
  return await supabaseBrowser
    .from('services')
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

export async function getServiceBySlug(organizationSlug: string, serviceSlug: string) {
  return await supabaseBrowser
    .from('services')
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
    .eq('slug', serviceSlug)
    .eq('organizations.slug', organizationSlug)
    .single();
}

export async function createService(data: ServiceFormData) {
  const { data: service, error } = await supabaseBrowser
    .from('services')
    .insert([data])
    .select()
    .single();

  return { data: service, error };
}

export async function updateService(id: string, data: Partial<ServiceFormData>) {
  const { data: service, error } = await supabaseBrowser
    .from('services')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  return { data: service, error };
}

export async function deleteService(id: string) {
  return await supabaseBrowser
    .from('services')
    .delete()
    .eq('id', id);
}

export async function getServiceCategories() {
  const { data, error } = await supabaseBrowser
    .from('services')
    .select('category')
    .not('category', 'is', null);

  if (error) return { data: [], error };

  const categories = Array.from(new Set(data.map(item => item.category))).filter(Boolean);
  return { data: categories, error: null };
}

export async function getPriceRanges() {
  const { data, error } = await supabaseBrowser
    .from('services')
    .select('price_range')
    .not('price_range', 'is', null);

  if (error) return { data: [], error };

  const priceRanges = Array.from(new Set(data.map(item => item.price_range))).filter(Boolean);
  return { data: priceRanges, error: null };
}

export async function getServicesByOrganization(organizationId: string) {
  return await supabaseBrowser
    .from('services')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });
}

export async function getServiceStats() {
  const [totalResult, organizationsResult, categoriesResult] = await Promise.all([
    supabaseBrowser
      .from('services')
      .select('id', { count: 'exact', head: true }),
    supabaseBrowser
      .from('services')
      .select('organization_id')
      .not('organization_id', 'is', null),
    supabaseBrowser
      .from('services')
      .select('category')
      .not('category', 'is', null)
  ]);

  // Count unique organizations and categories
  const uniqueOrganizations = organizationsResult.data 
    ? Array.from(new Set(organizationsResult.data.map(item => item.organization_id))).length
    : 0;
  
  const categoryStats = categoriesResult.data 
    ? Array.from(new Set(categoriesResult.data.map(item => item.category)))
        .map(category => ({
          category,
          count: categoriesResult.data!.filter(item => item.category === category).length
        }))
    : [];

  return {
    total: totalResult.count || 0,
    byOrganization: uniqueOrganizations,
    byCategory: categoryStats
  };
}

export async function generateServiceSlug(name: string, organizationId: string): Promise<string> {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim();

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const { data } = await supabaseBrowser
      .from('services')
      .select('id')
      .eq('slug', slug)
      .eq('organization_id', organizationId)
      .single();

    if (!data) break;

    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}