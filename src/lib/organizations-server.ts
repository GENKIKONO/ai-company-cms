// src/lib/organizations-server.ts
import { supabaseServer } from '@/lib/supabase-server';
import { unstable_cache } from 'next/cache';

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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('organizations')
    .select('id,name,slug,status,is_published,logo_url')
    .eq('created_by', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('[getCurrentUserOrganization] select error', error);
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
        console.error('[getOrganizationByIdCached] select error', error);
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
        console.error('[getOrganizationByUserIdCached] select error', error);
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