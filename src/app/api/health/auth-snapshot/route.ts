/**
 * /api/health/auth-snapshot - 認証状態診断エンドポイント（最終形）
 *
 * 目的:
 * 「なぜ dashboard が出ないのか」 が1秒で分かる状態にする
 *
 * 返却値:
 * - authState: 4状態のいずれか
 * - hasCookie: true/false
 * - getUserStatus: "success|error|no_user"
 * - organizationStatus: "ok|missing|error"
 * - whyBlocked: "string|null"
 *
 * これを見れば dashboard が表示されない理由が
 * DB / Auth / Org のどれかに必ず分類される
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { determineAuthState, summarizeAuthState } from '@/lib/auth/determine-auth-state';

// Supabase プロジェクト参照を環境変数から取得
function getProjectRef(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match ? match[1] : 'unknown';
}

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

  // Cookie 診断（Task B: cookie名を返す）
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
    // 一元化された判定関数を使用
    const authResult = await determineAuthState();

    // ログ出力
    console.log('[auth-snapshot]', summarizeAuthState(authResult));

    const response = NextResponse.json({
      // === Phase 4 最終形 ===
      authState: authResult.authState,
      hasCookie: authResult.hasCookie,
      getUserStatus: authResult.getUserStatus,
      organizationStatus: authResult.organizationStatus,
      whyBlocked: authResult.whyBlocked,

      // === 追加診断情報（デバッグ用） ===
      getUserError: authResult.getUserError || null,
      userId: authResult.userId || null,
      organizationId: authResult.organizationId || null,

      // === Cookie 診断（Task B） ===
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
      requestId: authResult.requestId,
      timestamp: new Date().toISOString(),
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Content-Type': 'application/json',
        'x-request-id': authResult.requestId,
      },
    });

    return response;
  } catch (error) {
    const requestId = crypto.randomUUID();

    console.error('[auth-snapshot] Error:', {
      sha,
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({
      // エラー時も4状態のいずれかを返す
      authState: 'AUTH_FAILED',
      hasCookie: cookieHeaderPresent,
      getUserStatus: 'error',
      organizationStatus: 'error',
      whyBlocked: `Exception: ${error instanceof Error ? error.message : 'Unknown error'}`,

      // === Cookie 診断（Task B） ===
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
