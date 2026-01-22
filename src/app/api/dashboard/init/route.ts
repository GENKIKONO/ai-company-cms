/**
 * /api/dashboard/init - Dashboard 初期データ取得エンドポイント
 *
 * 目的:
 * DashboardPageShell がクライアントサイドで organizations を取得すると
 * auth.uid() が NULL になり RLS で弾かれる問題を解決
 *
 * 方針:
 * - createApiAuthClient で認証・Cookie 同期を統一
 * - getUser() が唯一の Source of Truth
 * - getSession() は使用禁止（削除済み）
 *
 * @see src/lib/supabase/api-auth.ts
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  createApiAuthClient,
  ApiAuthException,
} from '@/lib/supabase/api-auth';
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
    profile?: {
      full_name: string | null;
      avatar_url: string | null;
    };
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
  featureCheck?: {
    key: string;
    available: boolean;
  };
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
  const sha = process.env.VERCEL_GIT_COMMIT_SHA ||
              process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
              'unknown';
  const projectRef = getProjectRef();
  const timestamp = new Date().toISOString();
  const cookieHeaderPresent = request.headers.has('cookie');

  // Cookie 診断用（エラー時にも返す）
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  const cookieNames = allCookies.map(c => c.name);
  const hasAuthToken = cookieNames.some(name =>
    new RegExp(`^sb-${projectRef}-auth-token(\\.\\d+)?$`).test(name)
  );
  const hasRefreshToken = hasRefreshTokenCookie(cookieNames, projectRef);

  let whichStep = 'init';

  const makeDiagnostics = () => ({
    cookieHeaderPresent,
    cookieNames,
    hasAuthTokenCookie: hasAuthToken,
    hasRefreshTokenCookie: hasRefreshToken,
    whichStep,
  });

  const featureCheckKey = request.nextUrl.searchParams.get('featureCheck');

  try {
    // =====================================================
    // 認証（createApiAuthClient で統一）
    // - getUser() のみ使用（getSession 禁止）
    // - Cookie 同期は applyCookies で行う
    // =====================================================
    whichStep = 'auth';
    const { supabase, user: rawUser, applyCookies, requestId } = await createApiAuthClient(request);

    const responseHeaders = {
      'Cache-Control': 'no-store, must-revalidate',
      'Content-Type': 'application/json',
      'x-request-id': requestId,
    };

    // =====================================================
    // プロフィール取得
    // =====================================================
    whichStep = 'profile';
    const { data: profileData } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', rawUser.id)
      .maybeSingle();

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

    // =====================================================
    // 組織メンバーシップ取得（JOIN で一括）
    // =====================================================
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
      const errorResponse = NextResponse.json({
        ok: false,
        user: userInfo,
        organizations: [],
        memberships: [],
        diagnostics: makeDiagnostics(),
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
      return applyCookies(errorResponse);
    }

    // メンバーシップなし
    if (!membershipWithOrgs || membershipWithOrgs.length === 0) {
      whichStep = 'success_no_org';
      const noOrgResponse = NextResponse.json({
        ok: true,
        user: userInfo,
        organizations: [],
        memberships: [],
        diagnostics: makeDiagnostics(),
        requestId,
        sha,
        timestamp,
      }, { status: 200, headers: responseHeaders });
      return applyCookies(noOrgResponse);
    }

    // =====================================================
    // JOIN データを分解
    // =====================================================
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

    const orgsData: OrgData[] = membershipWithOrgs
      .map(m => {
        const org = m.organizations;
        if (!org) return null;
        if (Array.isArray(org)) {
          return org[0] as OrgData | undefined ?? null;
        }
        return org as unknown as OrgData;
      })
      .filter((org): org is OrgData => org !== null);

    whichStep = 'success';
    console.log('[dashboard/init] Success', {
      requestId,
      userId: rawUser.id,
      orgCount: orgsData?.length || 0,
    });

    // =====================================================
    // 機能チェック（オプション）
    // =====================================================
    let featureCheck: { key: string; available: boolean } | undefined;
    let featureGate: DashboardInitResponse['featureGate'] | undefined;
    if (featureCheckKey && orgsData && orgsData.length > 0) {
      try {
        whichStep = 'featureCheck';
        const firstOrg = orgsData[0];
        const currentPlan = (firstOrg.plan || 'trial') as PlanType;

        const gateInfo: FeatureGateInfo = await getFeatureGateInfo(
          firstOrg.id,
          featureCheckKey,
          currentPlan
        );

        featureCheck = { key: featureCheckKey, available: gateInfo.available };
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
        console.warn('[dashboard/init] featureCheck failed', {
          requestId,
          featureKey: featureCheckKey,
          error: err instanceof Error ? err.message : 'Unknown',
        });
        featureCheck = { key: featureCheckKey, available: false };
      }
    }

    // =====================================================
    // コンテンツ数（並列取得）
    // =====================================================
    let contentCounts: DashboardInitResponse['contentCounts'] | undefined;
    if (orgsData && orgsData.length > 0) {
      try {
        whichStep = 'contentCounts';
        const firstOrgId = orgsData[0].id;

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
        console.warn('[dashboard/init] contentCounts failed', {
          requestId,
          error: err instanceof Error ? err.message : 'Unknown',
        });
      }
    }

    // =====================================================
    // 成功レスポンス
    // =====================================================
    whichStep = 'success';
    const successResponse = NextResponse.json({
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
      diagnostics: makeDiagnostics(),
      requestId,
      sha,
      timestamp,
    }, { status: 200, headers: responseHeaders });

    // 【重要】applyCookies で Set-Cookie を反映
    return applyCookies(successResponse);

  } catch (error) {
    // =====================================================
    // 認証エラー（ApiAuthException）
    // =====================================================
    if (error instanceof ApiAuthException) {
      console.warn('[dashboard/init] Auth failed', {
        requestId: error.requestId,
        code: error.code,
        message: error.message,
      });

      return NextResponse.json({
        ok: false,
        user: null,
        organizations: [],
        memberships: [],
        diagnostics: makeDiagnostics(),
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
        requestId: error.requestId,
        sha,
        timestamp,
      }, {
        status: 401,
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
          'Content-Type': 'application/json',
          'x-request-id': error.requestId,
          'x-auth-recover': 'clear-cookies-and-relogin',
          'x-auth-reason': error.code.toLowerCase(),
        },
      });
    }

    // =====================================================
    // その他のエラー
    // =====================================================
    const requestId = crypto.randomUUID();
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
      diagnostics: makeDiagnostics(),
      error: {
        code: 'EXCEPTION',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      requestId,
      sha,
      timestamp,
    }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Content-Type': 'application/json',
        'x-request-id': requestId,
      },
    });
  }
}
