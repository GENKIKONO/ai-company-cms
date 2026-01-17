/**
 * /api/health/dashboard-probe - Dashboard データ取得診断エンドポイント
 *
 * 目的:
 * 「なぜ dashboard がデータベースエラーになるのか」 を1回で診断
 *
 * 返却値:
 * - authState: 認証状態
 * - queries: 各クエリの成功/失敗詳細
 *   - organization_members: 成功/失敗/件数
 *   - organizations: 成功/失敗/件数
 *
 * ブラウザでアクセスすれば同一Cookieで確認可能
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { AuthState } from '@/lib/auth/auth-state';

// Supabase auth cookie パターン
const SB_AUTH_COOKIE_PATTERNS = [
  /^sb-.*-auth-token$/,
  /^sb-.*-auth-token\.\d+$/,
  /^sb-.*-refresh-token$/,
  /^sb-.*-refresh-token\.\d+$/,
  /^supabase-auth-token$/,
];

function hasSbAuthCookie(cookieNames: string[]): boolean {
  return cookieNames.some(name =>
    SB_AUTH_COOKIE_PATTERNS.some(pattern => pattern.test(name))
  );
}

interface QueryResult {
  queryName: string;
  status: 'success' | 'error' | 'skipped';
  rowCount?: number;
  supabaseError?: {
    code: string | null;
    message: string;
    details: string | null;
    hint: string | null;
  };
  data?: unknown;
}

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const sha = process.env.VERCEL_GIT_COMMIT_SHA ||
              process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
              'unknown';

  // リクエスト診断
  const host = request.headers.get('host') || 'unknown';
  const proto = request.headers.get('x-forwarded-proto') || 'unknown';
  const cookieHeaderPresent = request.headers.has('cookie');

  const queries: QueryResult[] = [];
  let authState: AuthState = 'UNAUTHENTICATED';
  let userId: string | null = null;
  let userEmail: string | null = null;
  let whyBlocked: string | null = null;

  try {
    // Step 1: Cookie の有無をチェック
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    const cookieNames = allCookies.map(c => c.name);
    const hasCookie = hasSbAuthCookie(cookieNames);

    if (!hasCookie) {
      authState = 'UNAUTHENTICATED';
      whyBlocked = 'No auth cookie found';

      return NextResponse.json({
        authState,
        hasCookie: false,
        userId: null,
        userEmail: null,
        whyBlocked,
        queries,
        sha,
        requestId,
        host,
        proto,
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

    // Step 2: Supabase クライアント作成 & getUser()
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

    const { data: { user }, error: getUserError } = await supabase.auth.getUser();

    if (getUserError) {
      authState = 'AUTH_FAILED';
      whyBlocked = `getUser failed: ${getUserError.message}`;

      return NextResponse.json({
        authState,
        hasCookie: true,
        userId: null,
        userEmail: null,
        whyBlocked,
        getUserError: getUserError.message,
        queries,
        sha,
        requestId,
        host,
        proto,
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

    if (!user) {
      authState = 'AUTH_FAILED';
      whyBlocked = 'Cookie present but no user session';

      return NextResponse.json({
        authState,
        hasCookie: true,
        userId: null,
        userEmail: null,
        whyBlocked,
        queries,
        sha,
        requestId,
        host,
        proto,
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

    userId = user.id;
    userEmail = user.email || null;

    // ========================================
    // Step 3: organization_members クエリ
    // ========================================
    const { data: memberships, error: membershipError } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id);

    if (membershipError) {
      queries.push({
        queryName: 'organization_members',
        status: 'error',
        supabaseError: {
          code: membershipError.code,
          message: membershipError.message,
          details: membershipError.details,
          hint: membershipError.hint,
        },
      });

      authState = 'AUTH_FAILED';
      whyBlocked = `organization_members query failed: ${membershipError.code} - ${membershipError.message}`;
    } else {
      queries.push({
        queryName: 'organization_members',
        status: 'success',
        rowCount: memberships?.length || 0,
        data: memberships?.map(m => ({ organization_id: m.organization_id, role: m.role })),
      });

      // メンバーシップなし
      if (!memberships || memberships.length === 0) {
        authState = 'AUTHENTICATED_NO_ORG';
        whyBlocked = 'User has no organization membership';
      } else {
        // ========================================
        // Step 4: organizations クエリ
        // ========================================
        const orgIds = memberships.map(m => m.organization_id);

        const { data: orgsData, error: orgsError } = await supabase
          .from('organizations')
          .select('id, name, slug, plan')
          .in('id', orgIds);

        if (orgsError) {
          queries.push({
            queryName: 'organizations',
            status: 'error',
            supabaseError: {
              code: orgsError.code,
              message: orgsError.message,
              details: orgsError.details,
              hint: orgsError.hint,
            },
          });

          authState = 'AUTH_FAILED';
          whyBlocked = `organizations query failed: ${orgsError.code} - ${orgsError.message}`;
        } else {
          queries.push({
            queryName: 'organizations',
            status: 'success',
            rowCount: orgsData?.length || 0,
            data: orgsData?.map(o => ({ id: o.id, name: o.name, slug: o.slug, plan: o.plan })),
          });

          // 全て成功
          authState = 'AUTHENTICATED_READY';
          whyBlocked = null;
        }
      }
    }

    // ログ出力（Vercel Logs で追跡可能）
    console.log('[dashboard-probe]', {
      requestId,
      authState,
      userId,
      queriesCount: queries.length,
      queriesSummary: queries.map(q => `${q.queryName}:${q.status}`).join(', '),
      whyBlocked,
    });

    return NextResponse.json({
      authState,
      hasCookie: true,
      userId,
      userEmail,
      whyBlocked,
      queries,
      sha,
      requestId,
      host,
      proto,
      timestamp: new Date().toISOString(),
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Content-Type': 'application/json',
        'x-request-id': requestId,
      },
    });

  } catch (error) {
    console.error('[dashboard-probe] Error:', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({
      authState: 'AUTH_FAILED',
      hasCookie: cookieHeaderPresent,
      userId: null,
      userEmail: null,
      whyBlocked: `Exception: ${error instanceof Error ? error.message : 'Unknown error'}`,
      queries,
      sha,
      requestId,
      host,
      proto,
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
