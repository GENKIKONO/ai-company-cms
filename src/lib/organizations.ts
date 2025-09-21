'use client';

import { supabase } from '@/lib/auth';
import { type Organization, type OrganizationFormData } from '@/types/database';

// 企業一覧取得
export async function getOrganizations(options: {
  search?: string;
  status?: string;
  industries?: string[];
  limit?: number;
  offset?: number;
} = {}) {
  try {
    let query = supabase
      .from('organizations')
      .select(`
        *,
        services(count),
        case_studies(count),
        faqs(count)
      `)
      .order('created_at', { ascending: false });

    // 検索条件の適用
    if (options.search) {
      query = query.or(`name.ilike.%${options.search}%,description.ilike.%${options.search}%`);
    }

    if (options.status) {
      query = query.eq('status', options.status);
    }

    if (options.industries && options.industries.length > 0) {
      query = query.overlaps('industries', options.industries);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return { data: null, error };
  }
}

// 企業詳細取得
export async function getOrganization(id: string) {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select(`
        *,
        services(*),
        case_studies(*),
        faqs(*),
        created_by:users(full_name, email)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching organization:', error);
    return { data: null, error };
  }
}

// 企業作成
export async function createOrganization(organizationData: OrganizationFormData) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Not authenticated');
    }

    const { data, error } = await supabase
      .from('organizations')
      .insert({
        ...organizationData,
        created_by: user.id,
        status: 'draft'
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating organization:', error);
    return { data: null, error };
  }
}

// 企業更新
export async function updateOrganization(id: string, organizationData: Partial<OrganizationFormData>) {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .update(organizationData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating organization:', error);
    return { data: null, error };
  }
}

// 企業削除
export async function deleteOrganization(id: string) {
  try {
    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting organization:', error);
    return { error };
  }
}

// 企業ステータス更新
export async function updateOrganizationStatus(id: string, status: 'draft' | 'published' | 'archived') {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating organization status:', error);
    return { data: null, error };
  }
}

// 企業統計取得
export async function getOrganizationStats() {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('status');

    if (error) throw error;

    const stats = {
      total: data.length,
      draft: data.filter(org => org.status === 'draft').length,
      published: data.filter(org => org.status === 'published').length,
      archived: data.filter(org => org.status === 'archived').length,
    };

    return { data: stats, error: null };
  } catch (error) {
    console.error('Error fetching organization stats:', error);
    return { data: null, error };
  }
}

// スラッグから企業取得（公開ページ用）
export async function getOrganizationBySlug(slug: string) {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select(`
        *,
        services(*),
        case_studies(*),
        faqs(*)
      `)
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching organization by slug:', error);
    return { data: null, error };
  }
}

// 業界一覧取得
export async function getIndustries() {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('industries')
      .not('industries', 'is', null);

    if (error) throw error;

    // 全ての業界を展開してユニークな値を取得
    const allIndustries = data
      .flatMap(org => org.industries || [])
      .filter((industry, index, self) => self.indexOf(industry) === index)
      .sort();

    return { data: allIndustries, error: null };
  } catch (error) {
    console.error('Error fetching industries:', error);
    return { data: [], error };
  }
}