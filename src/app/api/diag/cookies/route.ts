/**
 * GET /api/diag/cookies - 診断用: Cookie + Auth セッション検証
 *
 * 目的: auth-token Cookie 消失問題の切り分け
 * - Request の Cookie 名一覧
 * - supabase.auth.getSession() の結果（user id のみ）
 * - supabase.auth.getUser() の成功/失敗と error message/code
 *
 * 本番で一時的に使う。後で削除予定。
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

function getProjectRef(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match ? match[1] : 'unknown';
}

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const sha = process.env.VERCEL_GIT_COMMIT_SHA ||
              process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
              'unknown';
  const projectRef = getProjectRef();
  const timestamp = new Date().toISOString();

  // Request から Cookie を取得
  const allCookies = request.cookies.getAll();
  const cookieNames = allCookies.map(c => c.name);
  const supabaseCookieNames = cookieNames.filter(n => n.startsWith('sb-') || n.startsWith('supabase'));

  // auth-token / refresh-token の有無
  const hasAuthToken = cookieNames.some(n => n.includes('auth-token'));
  const hasRefreshToken = cookieNames.some(n => n.includes('refresh-token'));

  // Supabase クライアント作成
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return allCookies;
        },
        setAll() {
          // 診断用なので何もしない
        },
      },
    }
  );

  // getSession の結果
  let sessionUserId: string | null = null;
  let sessionError: string | null = null;
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      sessionError = `${error.code || 'UNKNOWN'}: ${error.message}`;
    } else if (session?.user) {
      sessionUserId = session.user.id;
    }
  } catch (e) {
    sessionError = `EXCEPTION: ${e instanceof Error ? e.message : String(e)}`;
  }

  // getUser の結果
  let getUserUserId: string | null = null;
  let getUserError: string | null = null;
  let getUserErrorCode: string | null = null;
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      getUserError = error.message;
      getUserErrorCode = error.code || 'UNKNOWN';
    } else if (user) {
      getUserUserId = user.id;
    }
  } catch (e) {
    getUserError = `EXCEPTION: ${e instanceof Error ? e.message : String(e)}`;
    getUserErrorCode = 'EXCEPTION';
  }

  const result = {
    requestId,
    sha,
    timestamp,
    projectRef,
    cookies: {
      total: cookieNames.length,
      names: cookieNames,
      supabaseNames: supabaseCookieNames,
      hasAuthToken,
      hasRefreshToken,
    },
    getSession: {
      success: sessionUserId !== null,
      userId: sessionUserId,
      error: sessionError,
    },
    getUser: {
      success: getUserUserId !== null,
      userId: getUserUserId,
      error: getUserError,
      errorCode: getUserErrorCode,
    },
    diagnosis: {
      cookieContractValid: hasRefreshToken,
      authTokenPresent: hasAuthToken,
      sessionValid: sessionUserId !== null && getUserUserId !== null,
    },
  };

  console.log('[api/diag/cookies] === DIAGNOSTIC ===', result);

  return NextResponse.json(result, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, must-revalidate',
      'x-request-id': requestId,
    },
  });
}
