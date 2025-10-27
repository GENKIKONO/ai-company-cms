// src/lib/organizations-server.ts
import { supabaseServer } from '@/lib/supabase-server';
import { unstable_cache } from 'next/cache';
import { logger } from '@/lib/utils/logger';

export type OrgLite = {
  id: string;
  name: string | null;
  slug: string | null;
  status: 'draft' | 'published' | string;
  is_published: boolean | null;
  logo_url: string | null;
};

export type OrgFull = OrgLite & {
  description: string | null;
  legal_form: string | null;
  representative_name: string | null;
  capital: number | null;
  employees: number | null;
  address_country: string | null;
  address_region: string | null;
  address_locality: string | null;
  address_postal_code: string | null;
  address_street: string | null;
  lat: number | null;
  lng: number | null;
  telephone: string | null;
  email: string | null;
  email_public: boolean | null;
  url: string | null;
  logo_url: string | null;
  same_as: string[] | null;
  industries: string[] | null;
};

export async function getCurrentUserOrganization(): Promise<OrgLite | null> {
  // 🚫 ここでは unstable_cache・headers・cookies を使わない
  const supabase = await supabaseServer();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  logger.debug('[getCurrentUserOrganization] Auth check', {
    hasUser: !!user,
    userId: user?.id,
    authError: authError?.message
  });
  
  if (authError || !user) {
    logger.debug('Debug', '[getCurrentUserOrganization] No user authenticated');
    return null;
  }

  // 全ての組織を取得してデバッグ
  const { data: allOrgs, error: allOrgsError } = await supabase
    .from('organizations')
    .select('id,name,slug,status,is_published,logo_url,created_by')
    .order('created_at', { ascending: false });

  console.log('[getCurrentUserOrganization] All organizations:', {
    count: allOrgs?.length || 0,
    organizations: allOrgs?.map(org => ({
      id: org.id,
      name: org.name,
      created_by: org.created_by,
      matches_user: org.created_by === user.id
    }))
  });

  const { data, error } = await supabase
    .from('organizations')
    .select('id,name,slug,status,is_published,logo_url')
    .eq('created_by', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  logger.debug('[getCurrentUserOrganization] Query result', {
    userId: user.id,
    hasData: !!data,
    data: data,
    error: error?.message,
    errorCode: error?.code
  });

  if (error) {
    logger.error('[getCurrentUserOrganization] select error', error instanceof Error ? error : new Error(String(error)));
    return null;
  }
  return data as OrgLite;
}

// ✅ IDベースキャッシュ関数を追加
export const getOrganizationByIdCached = (orgId: string) =>
  unstable_cache(
    async (): Promise<OrgFull | null> => {
      const supabase = await supabaseServer();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .eq('created_by', user.id)
        .single();

      if (error) {
        logger.error('[getOrganizationByIdCached] select error', error instanceof Error ? error : new Error(String(error)));
        return null;
      }
      return data as OrgFull;
    },
    [`org-by-id-${orgId}`],
    { 
      tags: [`org:${orgId}`], 
      revalidate: 300 
    }
  )();

export const getOrganizationByUserIdCached = (userId: string) =>
  unstable_cache(
    async (): Promise<OrgLite | null> => {
      const supabase = await supabaseServer();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.id !== userId) return null;

      const { data, error } = await supabase
        .from('organizations')
        .select('id,name,slug,status,is_published,logo_url')
        .eq('created_by', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        logger.error('[getOrganizationByUserIdCached] select error', error instanceof Error ? error : new Error(String(error)));
        return null;
      }
      return data as OrgLite;
    },
    [`org-by-user-${userId}`],
    { 
      tags: [`org:${userId}`], 
      revalidate: 300 
    }
  )();