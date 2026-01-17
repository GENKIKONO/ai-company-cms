/**
 * /api/dashboard/init - Dashboard 初期データ取得エンドポイント
 *
 * 目的:
 * DashboardPageShell がクライアントサイドで organizations を取得すると
 * auth.uid() が NULL になり RLS で弾かれる問題を解決
 *
 * 解決策:
 * サーバーサイド（createServerClient）で取得することで
 * Cookie → auth.uid() の解決を確実に行う
 *
 * 自動復旧機能:
 * - getUser() が Auth session missing で失敗しても
 * - refresh token があれば refreshSession() で復旧
 * - その後 getUser() を再試行
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// =====================================================
// Cookie 判定ヘルパー
// =====================================================

/**
 * auth-token Cookie があるか判定（チャンク Cookie も含む）
 * sb-<ref>-auth-token または sb-<ref>-auth-token.0, .1, ... 形式
 */
function hasAuthTokenCookie(cookieNames: string[]): boolean {
  return cookieNames.some(name =>
    /^sb-.*-auth-token$/.test(name) || /^sb-.*-auth-token\.\d+$/.test(name)
  );
}

/**
 * refresh-token Cookie があるか判定
 * sb-<ref>-refresh-token 形式
 */
function hasRefreshTokenCookie(cookieNames: string[]): boolean {
  return cookieNames.some(name =>
    /^sb-.*-refresh-token$/.test(name)
  );
}

/**
 * Auth session missing 系のエラーか判定
 */
function isSessionMissingError(error: { message?: string; code?: string } | null): boolean {
  if (!error) return false;
  const msg = (error.message || '').toLowerCase();
  return msg.includes('session missing') ||
         msg.includes('no session') ||
         msg.includes('session not found') ||
         msg.includes('invalid session');
}

// =====================================================
// 型定義
// =====================================================

export interface DashboardInitResponse {
  ok: boolean;
  user: {
    id: string;
    email: string | null;
  } | null;
  organizations: Array<{
    id: string;
    name: string;
    slug: string;
    plan: string | null;
  }>;
  memberships: Array<{
    organization_id: string;
    role: string;
  }>;
  // 診断情報
  diagnostics: {
    cookieHeaderPresent: boolean;
    cookieNames: string[];
    hasAuthTokenCookie: boolean;
    hasRefreshTokenCookie: boolean;
    whichStep: string;
    sessionRecovered: boolean;
  };
  error?: {
    code: string;
    message: string;
    whichQuery?: string;
    details?: string | null;
    hint?: string | null;
  };
  requestId: string;
  sha: string;
  timestamp: string;
}

// =====================================================
// メインハンドラ
// =====================================================

export async function GET(request: NextRequest): Promise<NextResponse<DashboardInitResponse>> {
  const requestId = crypto.randomUUID();
  const sha = process.env.VERCEL_GIT_COMMIT_SHA ||
              process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
              'unknown';

  const responseHeaders = {
    'Cache-Control': 'no-store, must-revalidate',
    'Content-Type': 'application/json',
    'x-request-id': requestId,
  };

  const timestamp = new Date().toISOString();

  // A1: Cookie 状況を診断情報に含める
  const cookieHeaderPresent = request.headers.has('cookie');
  let cookieNames: string[] = [];
  let hasAuthToken = false;
  let hasRefreshToken = false;
  let whichStep = 'init';
  let sessionRecovered = false;

  try {
    // Step 1: Cookie の取得と診断
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    cookieNames = allCookies.map(c => c.name);
    hasAuthToken = hasAuthTokenCookie(cookieNames);
    hasRefreshToken = hasRefreshTokenCookie(cookieNames);

    const diagnostics = {
      cookieHeaderPresent,
      cookieNames,
      hasAuthTokenCookie: hasAuthToken,
      hasRefreshTokenCookie: hasRefreshToken,
      whichStep,
      sessionRecovered,
    };

    // Cookie がない場合
    if (!hasAuthToken && !hasRefreshToken) {
      whichStep = 'no_cookies';
      return NextResponse.json({
        ok: false,
        user: null,
        organizations: [],
        memberships: [],
        diagnostics: { ...diagnostics, whichStep },
        error: {
          code: 'NO_AUTH_COOKIE',
          message: 'No auth cookie found',
        },
        requestId,
        sha,
        timestamp,
      }, { status: 401, headers: responseHeaders });
    }

    // Step 2: Supabase クライアント作成
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return allCookies;
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Server Component での cookie 設定エラーをハンドル
            }
          },
        },
      }
    );

    // A2: getUser → 失敗時は refreshSession で復旧
    whichStep = 'getUser_first';
    let { data: { user }, error: getUserError } = await supabase.auth.getUser();

    // getUser が失敗した場合、refresh token があれば復旧を試みる
    if ((getUserError || !user) && hasRefreshToken) {
      // Session missing 系のエラー、または user が null の場合
      if (!user || isSessionMissingError(getUserError)) {
        whichStep = 'refreshSession';

        // まず getSession() で現在のセッション状態を確認
        const { data: sessionData } = await supabase.auth.getSession();

        // refreshSession() を実行
        const { error: refreshError } = await supabase.auth.refreshSession();

        if (!refreshError) {
          // リフレッシュ成功 → getUser を再試行
          whichStep = 'getUser_retry';
          const retryResult = await supabase.auth.getUser();

          if (!retryResult.error && retryResult.data.user) {
            user = retryResult.data.user;
            getUserError = null;
            sessionRecovered = true;

            // ログ出力
            console.log('[dashboard/init] Session recovered via refreshSession', {
              requestId,
              userId: user.id,
            });
          } else {
            // リトライも失敗
            getUserError = retryResult.error;
          }
        } else {
          // refreshSession 自体が失敗
          getUserError = refreshError;
        }
      }
    }

    // 最終的な認証チェック
    if (getUserError) {
      return NextResponse.json({
        ok: false,
        user: null,
        organizations: [],
        memberships: [],
        diagnostics: { ...diagnostics, whichStep, sessionRecovered },
        error: {
          code: getUserError.code || 'AUTH_ERROR',
          message: getUserError.message,
          whichQuery: 'getUser',
        },
        requestId,
        sha,
        timestamp,
      }, { status: 401, headers: responseHeaders });
    }

    if (!user) {
      return NextResponse.json({
        ok: false,
        user: null,
        organizations: [],
        memberships: [],
        diagnostics: { ...diagnostics, whichStep, sessionRecovered },
        error: {
          code: 'NO_USER_SESSION',
          message: 'Cookie present but no user session',
          whichQuery: 'getUser',
        },
        requestId,
        sha,
        timestamp,
      }, { status: 401, headers: responseHeaders });
    }

    // Step 3: organization_members クエリ
    whichStep = 'organization_members';
    const { data: memberships, error: membershipError } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id);

    if (membershipError) {
      return NextResponse.json({
        ok: false,
        user: { id: user.id, email: user.email || null },
        organizations: [],
        memberships: [],
        diagnostics: { ...diagnostics, whichStep, sessionRecovered },
        error: {
          code: membershipError.code || 'MEMBERSHIP_ERROR',
          message: membershipError.message,
          whichQuery: 'organization_members',
          details: membershipError.details,
          hint: membershipError.hint,
        },
        requestId,
        sha,
        timestamp,
      }, { status: 200, headers: responseHeaders });
    }

    // メンバーシップなし
    if (!memberships || memberships.length === 0) {
      whichStep = 'success_no_org';
      return NextResponse.json({
        ok: true,
        user: { id: user.id, email: user.email || null },
        organizations: [],
        memberships: [],
        diagnostics: { ...diagnostics, whichStep, sessionRecovered },
        requestId,
        sha,
        timestamp,
      }, { status: 200, headers: responseHeaders });
    }

    // Step 4: organizations クエリ
    whichStep = 'organizations';
    const orgIds = memberships.map(m => m.organization_id);

    const { data: orgsData, error: orgsError } = await supabase
      .from('organizations')
      .select('id, name, slug, plan')
      .in('id', orgIds);

    if (orgsError) {
      return NextResponse.json({
        ok: false,
        user: { id: user.id, email: user.email || null },
        organizations: [],
        memberships: memberships.map(m => ({ organization_id: m.organization_id, role: m.role })),
        diagnostics: { ...diagnostics, whichStep, sessionRecovered },
        error: {
          code: orgsError.code || 'ORG_ERROR',
          message: orgsError.message,
          whichQuery: 'organizations',
          details: orgsError.details,
          hint: orgsError.hint,
        },
        requestId,
        sha,
        timestamp,
      }, { status: 200, headers: responseHeaders });
    }

    // 成功
    whichStep = 'success';
    return NextResponse.json({
      ok: true,
      user: { id: user.id, email: user.email || null },
      organizations: (orgsData || []).map(org => ({
        id: org.id,
        name: org.name,
        slug: org.slug,
        plan: org.plan,
      })),
      memberships: memberships.map(m => ({ organization_id: m.organization_id, role: m.role })),
      diagnostics: {
        cookieHeaderPresent,
        cookieNames,
        hasAuthTokenCookie: hasAuthToken,
        hasRefreshTokenCookie: hasRefreshToken,
        whichStep,
        sessionRecovered,
      },
      requestId,
      sha,
      timestamp,
    }, { status: 200, headers: responseHeaders });

  } catch (error) {
    console.error('[dashboard/init] Error:', {
      requestId,
      whichStep,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({
      ok: false,
      user: null,
      organizations: [],
      memberships: [],
      diagnostics: {
        cookieHeaderPresent,
        cookieNames,
        hasAuthTokenCookie: hasAuthToken,
        hasRefreshTokenCookie: hasRefreshToken,
        whichStep,
        sessionRecovered,
      },
      error: {
        code: 'EXCEPTION',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      requestId,
      sha,
      timestamp,
    }, { status: 500, headers: responseHeaders });
  }
}
