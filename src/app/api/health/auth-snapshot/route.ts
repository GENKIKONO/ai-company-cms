/**
 * /api/health/auth-snapshot - 認証状態診断エンドポイント
 *
 * 目的:
 * 「なぜ dashboard が出ないのか」 が1秒で分かる状態にする
 *
 * 方針:
 * - createApiAuthClientOptional を使用（認証失敗でもエラーにしない）
 * - Cookie 同期は applyCookies で行う
 * - getUser() が唯一の Source of Truth
 *
 * @see src/lib/supabase/api-auth.ts
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createApiAuthClientOptional } from '@/lib/supabase/api-auth';

// Supabase プロジェクト参照を環境変数から取得
function getProjectRef(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match ? match[1] : 'unknown';
}

// 認証状態の型
type AuthState = 'AUTHENTICATED_READY' | 'AUTHENTICATED_NO_ORG' | 'AUTH_FAILED' | 'UNAUTHENTICATED';

export async function GET(request: NextRequest) {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA ||
              process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
              'unknown';
  const projectRef = getProjectRef();

  // リクエスト診断
  const host = request.headers.get('host') || 'unknown';
  const proto = request.headers.get('x-forwarded-proto') || 'unknown';
  const userAgent = request.headers.get('user-agent') || '';
  const userAgentHint = userAgent.slice(0, 50) + (userAgent.length > 50 ? '...' : '');
  const cookieHeaderPresent = request.headers.has('cookie');

  // Cookie 診断
  const allCookies = request.cookies.getAll();
  const cookieNames = allCookies.map(c => c.name);
  const matchedCookieNames = cookieNames.filter(name => name.startsWith('sb-'));
  const hasAuthTokenCookie = cookieNames.some(name =>
    name === `sb-${projectRef}-auth-token` || name.startsWith(`sb-${projectRef}-auth-token.`)
  );
  const hasRefreshTokenCookie = cookieNames.some(name =>
    name === `sb-${projectRef}-refresh-token` || name.startsWith(`sb-${projectRef}-refresh-token.`)
  );

  try {
    // =====================================================
    // 認証（createApiAuthClientOptional で統一）
    // - 認証失敗でも例外を投げない
    // - Cookie 同期は applyCookies で行う
    // =====================================================
    const { supabase, user, applyCookies, requestId } = await createApiAuthClientOptional(request);

    let authState: AuthState;
    let getUserStatus: 'success' | 'error' | 'no_user';
    let organizationStatus: 'ok' | 'missing' | 'error';
    let whyBlocked: string | null = null;
    let organizationId: string | null = null;

    if (!user) {
      // Cookie がない or getUser() 失敗
      authState = hasAuthTokenCookie ? 'AUTH_FAILED' : 'UNAUTHENTICATED';
      getUserStatus = hasAuthTokenCookie ? 'error' : 'no_user';
      organizationStatus = 'missing';
      whyBlocked = hasAuthTokenCookie
        ? 'Cookie present but no user session'
        : 'No auth cookie found';
    } else {
      // ユーザーは取得できた → 組織チェック
      getUserStatus = 'success';

      const { data: memberships, error: membershipError } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1);

      if (membershipError) {
        authState = 'AUTH_FAILED';
        organizationStatus = 'error';
        whyBlocked = `organization_members query failed: ${membershipError.message}`;
      } else if (!memberships || memberships.length === 0) {
        authState = 'AUTHENTICATED_NO_ORG';
        organizationStatus = 'missing';
        whyBlocked = 'User has no organization membership';
      } else {
        authState = 'AUTHENTICATED_READY';
        organizationStatus = 'ok';
        organizationId = memberships[0].organization_id;
      }
    }

    // ログ出力
    console.log('[auth-snapshot]', {
      authState,
      hasCookie: hasAuthTokenCookie,
      getUserStatus,
      organizationStatus,
      whyBlocked,
    });

    const response = NextResponse.json({
      // === 認証状態 ===
      authState,
      hasCookie: hasAuthTokenCookie,
      getUserStatus,
      organizationStatus,
      whyBlocked,

      // === 追加診断情報 ===
      userId: user?.id || null,
      userEmail: user?.email || null,
      organizationId,

      // === Cookie 診断 ===
      cookieNames,
      matchedCookieNames,
      hasAuthTokenCookie,
      hasRefreshTokenCookie,
      projectRef,

      // === リクエスト診断 ===
      host,
      proto,
      userAgentHint,
      cookieHeaderPresent,

      // === メタ ===
      sha,
      requestId,
      timestamp: new Date().toISOString(),
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Content-Type': 'application/json',
        'x-request-id': requestId,
      },
    });

    // 【重要】applyCookies で Set-Cookie を反映
    return applyCookies(response);

  } catch (error) {
    const requestId = crypto.randomUUID();

    console.error('[auth-snapshot] Error:', {
      sha,
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({
      // エラー時も4状態のいずれかを返す
      authState: 'AUTH_FAILED' as AuthState,
      hasCookie: cookieHeaderPresent,
      getUserStatus: 'error',
      organizationStatus: 'error',
      whyBlocked: `Exception: ${error instanceof Error ? error.message : 'Unknown error'}`,

      // === Cookie 診断 ===
      cookieNames,
      matchedCookieNames,
      hasAuthTokenCookie,
      hasRefreshTokenCookie,
      projectRef,

      // === リクエスト診断 ===
      host,
      proto,
      userAgentHint,
      cookieHeaderPresent,

      // === メタ ===
      sha,
      requestId,
      timestamp: new Date().toISOString(),
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Content-Type': 'application/json',
        'x-request-id': requestId,
      },
    });
  }
}
