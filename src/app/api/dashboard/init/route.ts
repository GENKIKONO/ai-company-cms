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
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

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

  try {
    // Step 1: Cookie の有無をチェック
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    const cookieNames = allCookies.map(c => c.name);
    const hasCookie = hasSbAuthCookie(cookieNames);

    if (!hasCookie) {
      return NextResponse.json({
        ok: false,
        user: null,
        organizations: [],
        memberships: [],
        error: {
          code: 'NO_AUTH_COOKIE',
          message: 'No auth cookie found',
        },
        requestId,
        sha,
        timestamp,
      }, { status: 401, headers: responseHeaders });
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
      return NextResponse.json({
        ok: false,
        user: null,
        organizations: [],
        memberships: [],
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
      return NextResponse.json({
        ok: true,
        user: { id: user.id, email: user.email || null },
        organizations: [],
        memberships: [],
        requestId,
        sha,
        timestamp,
      }, { status: 200, headers: responseHeaders });
    }

    // Step 4: organizations クエリ
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
      requestId,
      sha,
      timestamp,
    }, { status: 200, headers: responseHeaders });

  } catch (error) {
    console.error('[dashboard/init] Error:', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({
      ok: false,
      user: null,
      organizations: [],
      memberships: [],
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
