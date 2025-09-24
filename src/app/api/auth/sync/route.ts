// src/app/api/auth/sync/route.ts
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function POST() {
  const supabase = await supabaseServer();

  const { data, error: authErr } = await supabase.auth.getUser();
  const user = data?.user;
  if (authErr || !user) {
    return NextResponse.json({ ok: false, error: 'Auth session missing' }, { status: 401 });
  }

  const { error } = await supabase
    .from('app_users')
    .upsert({ id: user.id, role: 'org_owner' }, { onConflict: 'id' });

  if (error) {
    console.error('[sync] upsert failed', { code: error.code, message: error.message });
    return NextResponse.json({ ok: false, error: 'Profile sync failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}