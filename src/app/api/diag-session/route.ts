import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  try {
    const supabase = await supabaseServer();

    // ユーザーセッション取得
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    // Cookie 文字列から sb-*-auth-token の有無を判定
    const cookieHeader = request.headers.get('cookie') || '';
    const hasAccessTokenCookie = /sb-[^=;]+-auth-token=/.test(cookieHeader);
    const hasPersistentCookie = /sb-[^=;]+-auth-token\.persistent=/.test(cookieHeader);

    const diagnosticResponse = {
      authenticated: !!user && !userError,
      userId: user?.id,
      email: user?.email,
      sessionExpiresAt: session?.expires_at,
      hasAccessTokenCookie,
      hasPersistentCookie,
      cookieHeaderLength: cookieHeader.length,
      timestamp: new Date().toISOString(),
      userError: userError?.message,
      sessionError: sessionError?.message,
    };

    return NextResponse.json(diagnosticResponse, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    // エラー時も authenticated: false で 200 を返す
    const cookieHeader = request.headers.get('cookie') || '';
    const hasAccessTokenCookie = /sb-[^=;]+-auth-token=/.test(cookieHeader);
    const hasPersistentCookie = /sb-[^=;]+-auth-token\.persistent=/.test(cookieHeader);

    return NextResponse.json({
      authenticated: false,
      hasAccessTokenCookie,
      hasPersistentCookie,
      cookieHeaderLength: cookieHeader.length,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    });
  }
}