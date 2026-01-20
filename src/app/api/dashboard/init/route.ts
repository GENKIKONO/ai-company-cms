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
import { canUseFeature } from '@/lib/featureGate';
import { getFeatureGateInfo } from '@/lib/feature-metadata';
import type { FeatureGateInfo } from '@/types/feature-metadata';
import type { PlanType } from '@/config/plans';

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
    /** プロフィール情報（Phase 1 最適化で追加） */
    profile?: {
      full_name: string | null;
      avatar_url: string | null;
    };
    /** 認証メタデータ */
    email_verified: boolean;
    created_at: string;
    app_metadata?: {
      role?: string;
    };
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
  /** 機能チェック結果（featureCheckクエリパラメータ指定時のみ） - Legacy */
  featureCheck?: {
    key: string;
    available: boolean;
  };
  /** 機能ゲート情報（featureCheckクエリパラメータ指定時のみ） - 拡張版 */
  featureGate?: {
    key: string;
    available: boolean;
    metadata: {
      displayName: string;
      description: string;
      category: string;
      controlType: string;
      availableFrom: string;
      icon?: string;
    };
    currentPlan: string;
    currentPlanName: string;
    upgradePlan?: string;
    upgradePlanName?: string;
    upgradePlanPrice?: number;
    quota?: {
      used: number;
      limit: number;
      unlimited: boolean;
      resetDate?: string;
      period?: string;
    };
  };
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
  /** コンテンツ数（Phase 3 最適化で追加） */
  contentCounts?: {
    services: number;
    faqs: number;
    case_studies: number;
    posts: number;
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

  // 機能チェック用クエリパラメータ（早期プラン判定用）
  const featureCheckKey = request.nextUrl.searchParams.get('featureCheck');

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

    // Step 3: セッション取得または復元
    // refresh-token のみ存在する場合、refreshSession() で明示的に復元を試みる
    whichStep = 'getSession';
    let session = null;
    let sessionError = null;

    // まず getSession() を試す
    const getSessionResult = await supabase.auth.getSession();
    session = getSessionResult.data?.session;
    sessionError = getSessionResult.error;

    // セッションがなく、refresh-token がある場合は refreshSession() を試す
    if (!session && hasRefreshToken && !sessionError) {
      whichStep = 'refreshSession';
      // eslint-disable-next-line no-console
      console.log('[dashboard/init] No session, trying refreshSession()', { requestId });

      const refreshResult = await supabase.auth.refreshSession();
      session = refreshResult.data?.session;
      sessionError = refreshResult.error;

      if (session) {
        // eslint-disable-next-line no-console
        console.log('[dashboard/init] refreshSession succeeded', { requestId, userId: session.user?.id });
      }
    }

    // セッションが取得できない場合
    if (sessionError || !session) {
      // eslint-disable-next-line no-console
      console.warn('[dashboard/init] Session recovery failed', {
        requestId,
        hasRefreshToken,
        whichStep,
        errorCode: sessionError?.code,
        errorMessage: sessionError?.message,
      });

      const noSessionHeaders = {
        ...responseHeaders,
        'x-auth-recover': 'clear-cookies-and-relogin',
        'x-auth-reason': 'no_session',
      };

      return NextResponse.json({
        ok: false,
        user: null,
        organizations: [],
        memberships: [],
        diagnostics: { ...diagnostics, whichStep },
        error: {
          code: 'NO_SESSION',
          message: 'Could not establish session. Please login again.',
          whichQuery: whichStep,
          details: sessionError?.message || null,
        },
        requestId,
        sha,
        timestamp,
      }, { status: 401, headers: noSessionHeaders });
    }

    // Step 4: getUser（セッション確立後に完全なUserオブジェクトを取得）
    whichStep = 'getUser';
    const { data: { user: rawUser }, error: userError } = await supabase.auth.getUser();

    if (userError || !rawUser) {
      // セッションはあるが user 取得失敗（稀なケース）
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
          message: 'Session exists but could not get user. Please login again.',
          whichQuery: 'getUser',
          details: userError?.message || null,
        },
        requestId,
        sha,
        timestamp,
      }, { status: 401, headers: noUserHeaders });
    }

    // Step 3.5: profiles テーブルからプロフィール情報を取得（Phase 1 最適化）
    // DashboardPageShell での getCurrentUser() 呼び出しを削減するため
    whichStep = 'profile';
    const { data: profileData } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', rawUser.id)
      .maybeSingle();

    // ユーザー情報を構築（profile情報を含む）
    const userInfo = {
      id: rawUser.id,
      email: rawUser.email ?? null,
      profile: profileData ? {
        full_name: profileData.full_name,
        avatar_url: profileData.avatar_url,
      } : undefined,
      email_verified: !!rawUser.email_confirmed_at,
      created_at: rawUser.created_at || new Date().toISOString(),
      app_metadata: rawUser.app_metadata ? {
        role: (rawUser.app_metadata as Record<string, unknown>).role as string | undefined,
      } : undefined,
    };

    // Step 4: organization_members + organizations を JOIN で一括取得（Phase 2A 最適化）
    // 以前: 2回のDB往復 → 現在: 1回のDB往復
    whichStep = 'membership_with_orgs';
    const { data: membershipWithOrgs, error: membershipError } = await supabase
      .from('organization_members')
      .select(`
        organization_id,
        role,
        organizations (
          id,
          name,
          slug,
          plan
        )
      `)
      .eq('user_id', rawUser.id);

    if (membershipError) {
      return NextResponse.json({
        ok: false,
        user: userInfo,
        organizations: [],
        memberships: [],
        diagnostics: { ...diagnostics, whichStep },
        error: {
          code: membershipError.code || 'MEMBERSHIP_ERROR',
          message: membershipError.message,
          whichQuery: 'membership_with_orgs',
          details: membershipError.details,
          hint: membershipError.hint,
        },
        requestId,
        sha,
        timestamp,
      }, { status: 200, headers: responseHeaders });
    }

    // メンバーシップなし
    if (!membershipWithOrgs || membershipWithOrgs.length === 0) {
      whichStep = 'success_no_org';
      return NextResponse.json({
        ok: true,
        user: userInfo,
        organizations: [],
        memberships: [],
        diagnostics: { ...diagnostics, whichStep },
        requestId,
        sha,
        timestamp,
      }, { status: 200, headers: responseHeaders });
    }

    // JOINデータを分解
    // Supabase の nested select では many-to-one は単一オブジェクトを返す
    interface OrgData {
      id: string;
      name: string;
      slug: string;
      plan: string | null;
    }

    const memberships = membershipWithOrgs.map(m => ({
      organization_id: m.organization_id,
      role: m.role,
    }));

    // organizations は単一オブジェクト（many-to-one）、null の場合もある
    // Supabase の型推論が配列を返すが、実際は単一オブジェクト
    const orgsData: OrgData[] = membershipWithOrgs
      .map(m => {
        const org = m.organizations;
        if (!org) return null;
        // Supabase が配列として型推論するケースへの対応
        if (Array.isArray(org)) {
          return org[0] as OrgData | undefined ?? null;
        }
        return org as unknown as OrgData;
      })
      .filter((org): org is OrgData => org !== null);

    // 成功
    whichStep = 'success';
    // eslint-disable-next-line no-console
    console.log('[dashboard/init] Success', {
      requestId,
      userId: rawUser.id,
      orgCount: orgsData?.length || 0,
    });

    // 機能チェック（オプション）
    // featureCheckクエリパラメータが指定されている場合、最初の組織で機能が使えるかチェック
    let featureCheck: { key: string; available: boolean } | undefined;
    let featureGate: DashboardInitResponse['featureGate'] | undefined;
    if (featureCheckKey && orgsData && orgsData.length > 0) {
      try {
        whichStep = 'featureCheck';
        const firstOrg = orgsData[0];
        const firstOrgId = firstOrg.id;
        const currentPlan = (firstOrg.plan || 'trial') as PlanType;

        // 拡張版: FeatureGateInfo を取得
        const gateInfo: FeatureGateInfo = await getFeatureGateInfo(
          firstOrgId,
          featureCheckKey,
          currentPlan
        );

        // Legacy互換: featureCheck も返す
        featureCheck = { key: featureCheckKey, available: gateInfo.available };

        // 拡張版: featureGate を返す
        featureGate = {
          key: featureCheckKey,
          available: gateInfo.available,
          metadata: {
            displayName: gateInfo.metadata.displayName,
            description: gateInfo.metadata.description,
            category: gateInfo.metadata.category,
            controlType: gateInfo.metadata.controlType,
            availableFrom: gateInfo.metadata.availableFrom,
            icon: gateInfo.metadata.icon,
          },
          currentPlan: gateInfo.currentPlan,
          currentPlanName: gateInfo.currentPlanName,
          upgradePlan: gateInfo.upgradePlan,
          upgradePlanName: gateInfo.upgradePlanName,
          upgradePlanPrice: gateInfo.upgradePlanPrice,
          quota: gateInfo.quota ? {
            used: gateInfo.quota.used,
            limit: gateInfo.quota.limit,
            unlimited: gateInfo.quota.unlimited,
            resetDate: gateInfo.quota.resetDate,
            period: gateInfo.quota.period,
          } : undefined,
        };
      } catch (err) {
        // 機能チェック失敗時はavailable: falseにしてフェイルセーフ
        console.warn('[dashboard/init] featureCheck failed', {
          requestId,
          featureKey: featureCheckKey,
          error: err instanceof Error ? err.message : 'Unknown',
        });
        featureCheck = { key: featureCheckKey, available: false };
        // featureGate は undefined のまま（エラー時はLegacy APIのみ）
      }
    }

    // Phase 3 最適化: コンテンツ数を並列取得
    // AnalyticsDashboard での追加API呼び出しを削減
    let contentCounts: DashboardInitResponse['contentCounts'] | undefined;
    if (orgsData && orgsData.length > 0) {
      try {
        whichStep = 'contentCounts';
        const firstOrgId = orgsData[0].id;

        // 4テーブルを並列でカウント
        const [servicesResult, faqsResult, caseStudiesResult, postsResult] = await Promise.all([
          supabase.from('services').select('id', { count: 'exact', head: true }).eq('organization_id', firstOrgId),
          supabase.from('faqs').select('id', { count: 'exact', head: true }).eq('organization_id', firstOrgId),
          supabase.from('case_studies').select('id', { count: 'exact', head: true }).eq('organization_id', firstOrgId),
          supabase.from('posts').select('id', { count: 'exact', head: true }).eq('organization_id', firstOrgId),
        ]);

        contentCounts = {
          services: servicesResult.count ?? 0,
          faqs: faqsResult.count ?? 0,
          case_studies: caseStudiesResult.count ?? 0,
          posts: postsResult.count ?? 0,
        };
      } catch (err) {
        // コンテンツ数取得失敗は非致命的、undefined のまま
        console.warn('[dashboard/init] contentCounts failed', {
          requestId,
          error: err instanceof Error ? err.message : 'Unknown',
        });
      }
    }

    return NextResponse.json({
      ok: true,
      user: userInfo,
      organizations: (orgsData || []).map(org => ({
        id: org.id,
        name: org.name,
        slug: org.slug,
        plan: org.plan,
      })),
      memberships: memberships.map(m => ({ organization_id: m.organization_id, role: m.role })),
      featureCheck,
      featureGate,
      contentCounts,
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
