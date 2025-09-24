// src/app/api/auth/sync/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseServer } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  console.log('[sync] Starting authentication check...');
  
  // まずCookieベースの認証を試行
  let supabase = await supabaseServer();
  let { data, error: authErr } = await supabase.auth.getUser();
  let user = data?.user;
  
  // Cookieベースが失敗した場合、Authorizationヘッダーを試行
  if (authErr || !user) {
    console.log('[sync] Cookie auth failed, trying Authorization header...');
    
    const auth = req.headers.get('authorization') ?? '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    
    if (token) {
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${token}` } } }
      );
      
      const result = await supabase.auth.getUser();
      data = result.data;
      authErr = result.error;
      user = data?.user;
    }
  }
  
  console.log('[sync] Final auth check result:', {
    hasUser: !!user,
    userId: user?.id,
    error: authErr?.message
  });
  
  if (authErr || !user) {
    console.error('[sync] Auth failed:', authErr?.message);
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