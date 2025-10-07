'use client';

import { supabaseBrowser } from '@/lib/supabase-client';
import { type Organization, type OrganizationFormData, type OrganizationWithOwner } from '@/types/database';

// 企業一覧取得
export async function getOrganizations(options: {
  search?: string;
  status?: string;
  industries?: string[];
  limit?: number;
  offset?: number;
} = {}) {
  try {
    let query = supabaseBrowser
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
    const { data, error } = await supabaseBrowser
      .from('organizations_with_owner')
      .select(`
        *,
        services(*),
        case_studies(*),
        faqs(*)
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
    const { data: { user } } = await supabaseBrowser.auth.getUser();
    
    if (!user) {
      throw new Error('Not authenticated');
    }

    const { data, error } = await supabaseBrowser
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

// 企業更新 - サーバーAPI経由でキャッシュ無効化を確実に実行
export async function updateOrganization(id: string, organizationData: Partial<OrganizationFormData>) {
  try {
    const response = await fetch('/api/my/organization', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(organizationData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const result = await response.json();
    return { data: result.data, error: null };
  } catch (error) {
    console.error('Error updating organization:', error);
    return { data: null, error };
  }
}

// 企業削除
export async function deleteOrganization(id: string) {
  try {
    const { error } = await supabaseBrowser
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

// 企業ステータス更新 - サーバーAPI経由でキャッシュ無効化も実行
export async function updateOrganizationStatus(id: string, status: 'draft' | 'published' | 'archived') {
  try {
    // is_published フィールドも連動して更新
    const is_published = status === 'published';
    
    const response = await fetch('/api/my/organization', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        status,
        is_published
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const result = await response.json();
    return { data: result.data, error: null };
  } catch (error) {
    console.error('Error updating organization status:', error);
    return { data: null, error };
  }
}

// 企業統計取得
export async function getOrganizationStats() {
  try {
    const { data, error } = await supabaseBrowser
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
    const { data, error } = await supabaseBrowser
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
    // 日本標準産業分類に基づく主要業界リスト
    const industriesList = [
      '農業・林業・漁業',
      '建設業',
      '製造業',
      '電気・ガス・水道業',
      '情報通信業',
      '運輸・郵便業',
      '卸売・小売業',
      '金融・保険業',
      '不動産・物品賃貸業',
      '専門・技術サービス業',
      '宿泊・飲食サービス業',
      '生活関連サービス・娯楽業',
      '教育・学習支援業',
      '医療・福祉',
      '公務',
      'サービス業（他に分類されないもの）',
      'IT・ソフトウェア',
      'コンサルティング',
      'マーケティング・広告',
      'デザイン・クリエイティブ',
      'メディア・出版',
      'エンターテイメント',
      'スポーツ・フィットネス',
      '人材サービス',
      '法務・会計',
      '環境・エネルギー',
      '研究・開発',
      '輸入・輸出',
      'NPO・団体',
      'その他'
    ];
    
    return { data: industriesList, error: null };
  } catch (error) {
    console.error('Error getting industries:', error);
    return { data: [], error };
  }
}

// 横断検索（企業・サービス・事例）
export async function globalSearch(options: {
  query?: string;
  type?: 'all' | 'organizations' | 'services' | 'case_studies';
  industries?: string[];
  regions?: string[];
  categories?: string[];
  limit?: number;
  offset?: number;
} = {}) {
  try {
    const results = {
      organizations: [],
      services: [],
      case_studies: [],
      total: 0
    };

    // Organizations search
    if (options.type === 'all' || options.type === 'organizations') {
      let orgQuery = supabaseBrowser
        .from('organizations')
        .select(`
          *,
          services(count),
          case_studies(count)
        `)
        .eq('status', 'published');

      if (options.query) {
        orgQuery = orgQuery.or(`name.ilike.%${options.query}%,description.ilike.%${options.query}%`);
      }

      if (options.industries && options.industries.length > 0) {
        orgQuery = orgQuery.overlaps('industries', options.industries);
      }

      if (options.regions && options.regions.length > 0) {
        orgQuery = orgQuery.or(
          options.regions.map(region => 
            `address_region.ilike.%${region}%,address_locality.ilike.%${region}%`
          ).join(',')
        );
      }

      const { data: orgs } = await orgQuery.limit(options.limit || 20);
      results.organizations = (orgs || []) as any;
    }

    // サービス検索
    if (options.type === 'all' || options.type === 'services') {
      let serviceQuery = supabaseBrowser
        .from('services')
        .select(`
          *,
          organization:organizations!inner(id, name, slug, status)
        `)
        .eq('organization.status', 'published');

      if (options.query) {
        serviceQuery = serviceQuery.or(`name.ilike.%${options.query}%,description.ilike.%${options.query}%`);
      }

      if (options.categories && options.categories.length > 0) {
        serviceQuery = serviceQuery.overlaps('categories', options.categories);
      }

      const { data: services } = await serviceQuery.limit(options.limit || 20);
      results.services = (services || []) as any;
    }

    // 事例検索
    if (options.type === 'all' || options.type === 'case_studies') {
      let caseQuery = supabaseBrowser
        .from('case_studies')
        .select(`
          *,
          organization:organizations!inner(id, name, slug, status)
        `)
        .eq('organization.status', 'published');

      if (options.query) {
        caseQuery = caseQuery.or(`title.ilike.%${options.query}%,problem.ilike.%${options.query}%,solution.ilike.%${options.query}%,outcome.ilike.%${options.query}%`);
      }

      const { data: cases } = await caseQuery.limit(options.limit || 20);
      results.case_studies = (cases || []) as any;
    }

    results.total = results.organizations.length + results.services.length + results.case_studies.length;

    return { data: results, error: null };
  } catch (error) {
    console.error('Error performing global search:', error);
    return { data: null, error };
  }
}

// サービスカテゴリ一覧取得
export async function getServiceCategories() {
  try {
    const { data, error } = await supabaseBrowser
      .from('services')
      .select('categories')
      .not('categories', 'is', null);

    if (error) throw error;

    const allCategories = data
      .flatMap(service => service.categories || [])
      .filter((category, index, self) => self.indexOf(category) === index)
      .sort();

    return { data: allCategories, error: null };
  } catch (error) {
    console.error('Error fetching service categories:', error);
    return { data: [], error };
  }
}