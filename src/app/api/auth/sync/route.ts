import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

interface SyncResponse {
  success: boolean;
  message: string;
  role?: string;
  partnerId?: string | null;
  error?: string;
  requestId: string;
}

export async function POST(): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  
  try {
    const supabase = await supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.warn('Auth sync: Auth session missing', { requestId });
      return NextResponse.json({ 
        ok: false, 
        error: 'Auth session missing' 
      }, { status: 401 });
    }

    // RLS: auth.uid() = id を満たす upsert
    const { error } = await supabase
      .from('app_users')
      .upsert({ id: user.id, role: 'org_owner' }, { onConflict: 'id' });

    if (error) {
      // ここでエラー内容をconsole.errorに出す（P0はconsoleでOK）
      console.error('[sync] upsert failed', { code: error.code, message: error.message });
      return NextResponse.json({ ok: false, error: 'Profile sync failed' }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });

  } catch (error) {
    console.error('[sync] unexpected error', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return NextResponse.json({
      ok: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}