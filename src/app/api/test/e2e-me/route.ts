/* eslint-disable no-console */
/**
 * E2E Test User API Endpoint
 * Service role authentication for testing purposes only
 *
 * Purpose: Bypass UI login for E2E testing while maintaining production security
 * Authentication: Uses x-rls-regression-admin-token header with service_role client
 * Safety: Only works in development environment (NODE_ENV=development)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { 
  GetMyOrganizationsSlimRow, 
  OrganizationSummary, 
  normalizeOrganizationSummary 
} from '@/types/organization-summary';

import { logger } from '@/lib/log';
export const dynamic = 'force-dynamic';

// エラー種別の構造化型定義 (same as /api/me)
type MeErrorType =
  | 'permission_denied'   // RLS 42501 / validate_org_access 相当
  | 'system_error'        // 想定外の内部エラー
  | 'none';               // エラーなし

// API レスポンス型 (same as /api/me)
interface MeApiResponseExtended {
  user: {
    id: string;
    email: string | null;
    full_name: string | null;
  } | null;
  
  // 新形式
  organizations: OrganizationSummary[];
  selectedOrganization: OrganizationSummary | null;
  
  // 後方互換
  organization: OrganizationSummary | null;
  
  // エラー情報（正常時は undefined）
  error?: string;
  
  // 新規: 構造化エラー種別
  errorType?: MeErrorType;
}

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is missing");
  if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing");

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

export async function GET(request: NextRequest) {
  try {
    // Production safety guard - only work in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'E2E endpoint disabled in production' }, 
        { status: 403 }
      );
    }

    // Authentication check - require admin token
    const token = request.headers.get("x-rls-regression-admin-token");
    if (!token || token !== process.env.RLS_REGRESSION_ADMIN_TOKEN) {
      return NextResponse.json(
        { error: 'unauthorized - missing or invalid admin token' }, 
        { status: 401 }
      );
    }

    // Get user_id parameter (required)
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    
    if (!userId || userId.trim() === '') {
      return NextResponse.json(
        { error: 'user_id parameter is required' }, 
        { status: 400 }
      );
    }

    console.log('[E2E-ME_DEBUG] Entry point:', { 
      userId,
      nodeEnv: process.env.NODE_ENV,
      hasToken: !!token
    });

    // Create service role client
    const supabase = getServerSupabase();

    // Get user information using service role
    const { data: authUser, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    if (userError || !authUser.user) {
      console.error('[E2E-ME_DEBUG] User lookup failed:', userError);
      return NextResponse.json(
        { error: 'User not found' }, 
        { status: 404 }
      );
    }

    // ユーザー情報を準備（Auth情報から）
    const user = {
      id: authUser.user.id,
      email: authUser.user.email || null,
      full_name: authUser.user.user_metadata?.full_name || null
    };

    console.log('[E2E-ME_DEBUG] User found:', {
      id: authUser.user.id,
      email: authUser.user.email,
    });

    let organizations: OrganizationSummary[] = [];
    let selectedOrganization: OrganizationSummary | null = null;
    let errorMessage: string | undefined = undefined;
    let errorType: MeErrorType = 'none';
    
    // Use service role to call RPC with specific user context
    // Note: get_my_organizations_slim is SECURITY INVOKER, so we need to impersonate the user
    // We'll use direct query instead since service_role has access to all data
    // Use specific relationship to avoid ambiguity
    const { data: orgRows, error: orgError } = await supabase
      .from('organization_members')
      .select(`
        organization_id,
        role,
        organizations!organization_members_organization_id_fkey (
          id,
          name,
          slug,
          plan,
          status,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', userId);

    console.log('[E2E-ME_DEBUG] orgs_query_result:', orgRows);
    console.log('[E2E-ME_DEBUG] orgs_query_error:', orgError);

    if (orgError) {
      console.error('[E2E-ME_DEBUG] organization_members query error:', orgError);
      errorType = 'system_error';
      errorMessage = '組織情報の取得に失敗しました';
    } else {
      // JOIN結果の型定義（PostgRESTはネストを配列で返す）
      type OrgData = {
        id: string;
        name: string | null;
        slug: string | null;
        plan: string | null;
        status: string | null;
        created_at: string | null;
        updated_at: string | null;
        show_services?: boolean;
        show_posts?: boolean;
        show_case_studies?: boolean;
        show_faqs?: boolean;
        show_qa?: boolean;
        show_news?: boolean;
        show_partnership?: boolean;
        show_contact?: boolean;
        is_demo_guess?: boolean;
      };
      type OrgMemberJoin = {
        organization_id: string;
        role: string;
        organizations: OrgData[] | OrgData | null;
      };

      // Map organization_members + organizations JOIN result to OrganizationSummary format
      const rawOrganizations = ((orgRows ?? []) as unknown as OrgMemberJoin[])
        .map(member => {
          // PostgRESTは配列で返す場合がある
          const orgRaw = member.organizations;
          const org = Array.isArray(orgRaw) ? orgRaw[0] : orgRaw;
          if (!org) return null;

          return {
            id: org.id,
            name: org.name,
            slug: org.slug,
            plan: org.plan,
            show_services: org.show_services || false,
            show_posts: org.show_posts || false,
            show_case_studies: org.show_case_studies || false,
            show_faqs: org.show_faqs || false,
            show_qa: org.show_qa || false,
            show_news: org.show_news || false,
            show_partnership: org.show_partnership || false,
            show_contact: org.show_contact || false,
            is_demo_guess: org.is_demo_guess || false
          };
        })
        .filter(Boolean) as GetMyOrganizationsSlimRow[];

      organizations = rawOrganizations.map(normalizeOrganizationSummary);
      selectedOrganization = organizations.length > 0 ? organizations[0] : null;
      
      console.log('[E2E-ME_DEBUG] organizations mapped:', { 
        userId: authUser.user.id, 
        orgCount: organizations.length,
        firstOrgId: organizations[0]?.id,
        firstOrgName: organizations[0]?.name,
      });
      
      // 0件でも正常（errorType: 'none' のまま）
      errorType = 'none';
      errorMessage = undefined;
    }

    console.log('[E2E-ME_DEBUG] response_summary:', {
      organizationsLength: organizations.length,
      errorType,
    });

    // レスポンス返却（キャッシュ防止ヘッダー付き）
    const responseData: MeApiResponseExtended = {
      user,
      organizations,                    // 新形式: 複数組織対応
      selectedOrganization,            // 新形式: 現在選択中の組織
      organization: selectedOrganization,  // 旧形式: 後方互換性のため維持
      error: errorMessage,             // エラー情報（あれば）
      errorType                        // 新規: 構造化エラー種別
    };

    console.log('[E2E-ME_DEBUG] Final response:', { 
      hasUser: !!user,
      organizationsLength: organizations.length,
      selectedOrgId: selectedOrganization?.id,
      selectedOrgSlug: selectedOrganization?.slug,
      selectedOrgPlan: selectedOrganization?.plan,
      errorType,
      hasError: !!errorMessage,
    });
    
    const response = NextResponse.json(responseData);
    
    // 追加のキャッシュ防止ヘッダー
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;

  } catch (error) {
    logger.error('API /test/e2e-me error:', { data: error });
    
    // エラーが発生してもテストを壊さないよう、できるだけ情報を返す
    const errorResponseData: MeApiResponseExtended = {
      user: null,
      organizations: [],
      selectedOrganization: null,
      organization: null,  // 後方互換
      error: 'サーバーエラーが発生しました。しばらく後に再度お試しください。',
      errorType: 'system_error'
    };
    
    const response = NextResponse.json(errorResponseData, { status: 500 });
    
    // キャッシュ防止ヘッダー（エラー応答でも）
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  }
}