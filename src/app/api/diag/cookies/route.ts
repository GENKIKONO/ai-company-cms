/**
 * GET /api/diag/cookies - 診断用: Cookie + Auth セッション検証
 *
 * ⚠️ ADMIN ONLY - 管理者認証が必要
 *
 * 目的: auth-token Cookie 消失問題の切り分け
 * - Request の Cookie 名一覧（値は非公開）
 * - Core wrapper経由でセッション取得（user id のみ）
 * - Core wrapper経由でユーザー取得（成功/失敗）
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { diagGuard, diagErrorResponse } from '@/lib/api/diag-guard';
import { getSessionWithClient, getUserWithClient } from '@/lib/core/auth-state';

function getProjectRef(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match ? match[1] : 'unknown';
}

export async function GET(request: NextRequest) {
  // diagGuard による認証チェック
  const guardResult = await diagGuard(request);
  if (!guardResult.authorized) {
    return guardResult.response!;
  }

  try {
    const requestId = crypto.randomUUID();
    const sha = process.env.VERCEL_GIT_COMMIT_SHA ||
                process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
                'unknown';
    const projectRef = getProjectRef();
    const timestamp = new Date().toISOString();

    // Request から Cookie を取得
    const allCookies = request.cookies.getAll();
    // Cookie値は漏洩防止のため名前のみ
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

    // getSession の結果（Core wrapper経由）
    let sessionUserId: string | null = null;
    let sessionError: string | null = null;
    try {
      const session = await getSessionWithClient(supabase);
      if (session?.user) {
        sessionUserId = session.user.id;
      }
    } catch (e) {
      sessionError = 'Session fetch failed';
    }

    // getUser の結果（Core wrapper経由）
    let getUserUserId: string | null = null;
    let getUserError: string | null = null;
    try {
      const authUser = await getUserWithClient(supabase);
      if (authUser) {
        getUserUserId = authUser.id;
      }
    } catch (e) {
      getUserError = 'User fetch failed';
    }

    const result = {
      requestId,
      sha: sha.slice(0, 7), // 短縮版のみ
      timestamp,
      projectRef,
      cookies: {
        total: cookieNames.length,
        // Cookie名の一覧（センシティブな情報を含む可能性があるため、supabase関連のみ）
        supabaseCount: supabaseCookieNames.length,
        hasAuthToken,
        hasRefreshToken,
      },
      getSession: {
        success: sessionUserId !== null,
        hasUser: sessionUserId !== null,
        error: sessionError,
      },
      getUser: {
        success: getUserUserId !== null,
        hasUser: getUserUserId !== null,
        error: getUserError,
      },
      diagnosis: {
        cookieContractValid: hasRefreshToken,
        authTokenPresent: hasAuthToken,
        sessionValid: sessionUserId !== null && getUserUserId !== null,
      },
    };

    return NextResponse.json(result, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'x-request-id': requestId,
      },
    });
  } catch (error) {
    return diagErrorResponse(error, '/api/diag/cookies');
  }
}
