import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const res = NextResponse.next();
    
    // middleware と同じ cookies ハンドラで Supabase クライアント初期化
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name: string) => {
            const cookies = req.headers.get('cookie') || '';
            const match = cookies.match(new RegExp(`${name}=([^;]+)`));
            return match ? decodeURIComponent(match[1]) : undefined;
          },
          set: (name: string, value: string, options: any) => {
            res.cookies.set(name, value, options);
          },
          remove: (name: string, options: any) => {
            res.cookies.set(name, '', { ...options, maxAge: 0 });
          },
        },
      }
    );

    // ユーザーセッション取得
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    // Cookie 文字列から sb-*-auth-token の有無を判定
    const cookieHeader = req.headers.get('cookie') || '';
    const hasAccessTokenCookie = /sb-[^=;]+-auth-token=/.test(cookieHeader);
    const hasPersistentCookie = /sb-[^=;]+-auth-token\.persistent=/.test(cookieHeader);

    const response = {
      authenticated: !!user && !userError,
      userId: user?.id,
      email: user?.email,
      sessionExpiresAt: session?.expires_at,
      hasAccessTokenCookie,
      hasPersistentCookie,
      cookieHeaderLength: cookieHeader.length,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    // エラー時も authenticated: false で 200 を返す
    const cookieHeader = req.headers.get('cookie') || '';
    const hasAccessTokenCookie = /sb-[^=;]+-auth-token=/.test(cookieHeader);
    const hasPersistentCookie = /sb-[^=;]+-auth-token\.persistent=/.test(cookieHeader);

    return NextResponse.json({
      authenticated: false,
      hasAccessTokenCookie,
      hasPersistentCookie,
      cookieHeaderLength: cookieHeader.length,
    }, { status: 200 });
  }
}