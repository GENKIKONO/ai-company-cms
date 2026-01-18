/**
 * /api/dashboard/init - Dashboard 初期データ取得エンドポイント
 *
 * 目的:
 * DashboardPageShell がクライアントサイドで organizations を取得すると
 * auth.uid() が NULL になり RLS で弾かれる問題を解決
 *
 * 方針（診断型）:
 * - Cookie 契約が壊れている場合は明確にエラーを返す
 * - 無理な復旧ロジックは最小限に
 * - UI 側で「ログインし直し」を表示できるようにする
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// =====================================================
// ヘルパー関数
// =====================================================

function getProjectRef(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match ? match[1] : 'unknown';
}

// Cookie 判定ヘルパー
function hasAuthTokenCookie(cookieNames: string[], projectRef: string): boolean {
  const pattern = new RegExp(`^sb-${projectRef}-auth-token(\\.\\d+)?$`);
  return cookieNames.some(name => pattern.test(name));
}

function hasRefreshTokenCookie(cookieNames: string[], projectRef: string): boolean {
  return cookieNames.includes(`sb-${projectRef}-refresh-token`);
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
  diagnostics: {
    cookieHeaderPresent: boolean;
    cookieNames: string[];
    hasAuthTokenCookie: boolean;
    hasRefreshTokenCookie: boolean;
    whichStep: string;
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
  const projectRef = getProjectRef();

  const responseHeaders = {
    'Cache-Control': 'no-store, must-revalidate',
    'Content-Type': 'application/json',
    'x-request-id': requestId,
  };

  const timestamp = new Date().toISOString();
  const cookieHeaderPresent = request.headers.has('cookie');
  let cookieNames: string[] = [];
  let hasAuthToken = false;
  let hasRefreshToken = false;
  let whichStep = 'init';

  try {
    // Step 1: Cookie の取得と診断
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    cookieNames = allCookies.map(c => c.name);
    hasAuthToken = hasAuthTokenCookie(cookieNames, projectRef);
    hasRefreshToken = hasRefreshTokenCookie(cookieNames, projectRef);

    const diagnostics = {
      cookieHeaderPresent,
      cookieNames,
      hasAuthTokenCookie: hasAuthToken,
      hasRefreshTokenCookie: hasRefreshToken,
      whichStep,
    };

    // ========================================
    // Cookie 契約チェック（最優先）
    // ========================================
    // Supabase Auth v2 仕様: refresh-token Cookie があれば認証可能
    // auth-token Cookie は常在しない（getUser() で都度取得される）

    // refresh-token Cookie がない場合のみ未認証扱い
    if (!hasRefreshToken) {
      whichStep = 'no_cookies';
      return NextResponse.json({
        ok: false,
        user: null,
        organizations: [],
        memberships: [],
        diagnostics: { ...diagnostics, whichStep },
        error: {
          code: 'NO_AUTH_COOKIE',
          message: 'No auth cookie found. Please login.',
        },
        requestId,
        sha,
        timestamp,
      }, { status: 401, headers: responseHeaders });
    }

    // Step 2: Supabase クライアント作成
    whichStep = 'supabase_client';
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

    // Step 3: getUser（復旧ロジックなし - 診断型）
    whichStep = 'getUser';
    const { data: { user }, error: getUserError } = await supabase.auth.getUser();

    if (getUserError) {
      console.error('[dashboard/init] getUser error', {
        requestId,
        errorCode: getUserError.code,
        errorMessage: getUserError.message,
        cookieNames,
      });

      // 壊れたセッション検出用ヘッダーを追加
      const isSessionMissing = getUserError.message?.includes('Auth session missing');
      const authRecoverHeaders = {
        ...responseHeaders,
        'x-auth-recover': isSessionMissing ? 'clear-cookies-and-relogin' : 'none',
        'x-auth-reason': isSessionMissing ? 'session_missing' : (getUserError.code || 'auth_error'),
      };

      return NextResponse.json({
        ok: false,
        user: null,
        organizations: [],
        memberships: [],
        diagnostics: { ...diagnostics, whichStep },
        error: {
          code: getUserError.code || 'AUTH_ERROR',
          message: getUserError.message,
          whichQuery: 'getUser',
        },
        requestId,
        sha,
        timestamp,
      }, { status: 401, headers: authRecoverHeaders });
    }

    if (!user) {
      // Cookie あるが user なし = 壊れたセッション
      const noUserHeaders = {
        ...responseHeaders,
        'x-auth-recover': 'clear-cookies-and-relogin',
        'x-auth-reason': 'no_user_session',
      };

      return NextResponse.json({
        ok: false,
        user: null,
        organizations: [],
        memberships: [],
        diagnostics: { ...diagnostics, whichStep },
        error: {
          code: 'NO_USER_SESSION',
          message: 'Cookie present but no user session. Please login again.',
          whichQuery: 'getUser',
        },
        requestId,
        sha,
        timestamp,
      }, { status: 401, headers: noUserHeaders });
    }

    // Step 4: organization_members クエリ
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
        diagnostics: { ...diagnostics, whichStep },
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
        diagnostics: { ...diagnostics, whichStep },
        requestId,
        sha,
        timestamp,
      }, { status: 200, headers: responseHeaders });
    }

    // Step 5: organizations クエリ
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
        diagnostics: { ...diagnostics, whichStep },
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
    console.log('[dashboard/init] Success', {
      requestId,
      userId: user.id,
      orgCount: orgsData?.length || 0,
    });

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
