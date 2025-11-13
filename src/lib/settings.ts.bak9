import { supabaseServer } from '@/lib/supabase-server';
import 'server-only';

const TAG = 'settings';

export async function getSetting(key: string): Promise<string | null> {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('key', key)
    .limit(1)
    .maybeSingle();
  return data?.value ?? null;
}

export async function setSetting(key: string, value: string) {
  const supabase = await supabaseServer();
  const { error } = await supabase
    .from('settings')
    .upsert({ key, value }, { onConflict: 'key' });
  if (error) throw error;
}