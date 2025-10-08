// src/lib/organizations-server.ts
import { supabaseServer } from '@/lib/supabase-server';

export type OrgLite = {
  id: string;
  name: string | null;
  slug: string | null;
  status: 'draft' | 'published' | string;
  is_published: boolean | null;
};

export async function getCurrentUserOrganization(): Promise<OrgLite | null> {
  // 🚫 ここでは unstable_cache・headers・cookies を使わない
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('organizations')
    .select('id,name,slug,status,is_published')
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