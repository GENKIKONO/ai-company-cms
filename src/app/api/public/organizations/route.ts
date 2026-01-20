/**
 * Public Organizations API - RLS対応・JOINなし版
 * 公開組織一覧API（RLS無限再帰回避・2段階取得・エラー耐性あり）
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/log';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================
// 🔒 Public API Security: Blocklist
// ============================================

/**
 * 絶対に公開APIで返さないカラム（sanitize用blocklist）
 */
const ORGANIZATION_BLOCKED_KEYS = [
  'created_by',
  'user_id',
  'feature_flags',
  'plan',
  'plan_id',
  'discount_group',
  'original_signup_campaign',
  'entitlements',
  'partner_id',
  'trial_end',
  'data_status',
  'verified_by',
  'verified_at',
  'verification_source',
  'content_hash',
  'source_urls',
  'archived',
  'deleted_at',
  'keywords',
] as const;

/**
 * オブジェクトから秘匿キーを削除する（保険用sanitize）
 */
function sanitizeOrganization<T extends Record<string, unknown>>(org: T): T {
  const sanitized = { ...org };
  for (const key of ORGANIZATION_BLOCKED_KEYS) {
    delete sanitized[key];
  }
  return sanitized;
}

/**
 * GET /api/public/organizations
 * 公開組織一覧を取得（JOINなし・2段階取得版）
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  logger.info('[public/organizations] called');

  try {
    // Supabase Public Client（anon key使用）
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Step 1: Organizations のみを取得（VIEW経由 - SST強制）
    // ⚠️ v_organizations_public に存在するカラムのみ select すること
    const { data: orgData, error: orgError } = await supabase
      .from('v_organizations_public')
      .select(`
        id,
        name,
        slug,
        description,
        website_url,
        email_public,
        logo_url,
        show_services,
        show_posts,
        show_case_studies,
        show_faqs
      `)
      // VIEWは既に is_published=true AND deleted_at IS NULL でフィルター済み
      // status/is_published フィルターは不要（VIEWに存在しないカラム）
      .order('name', { ascending: true });

    logger.info(`[public/organizations] orgs count: ${orgData?.length || 0}`);

    if (orgError) {
      logger.error('[public/organizations] organizations query error', { data: { error: orgError } });
      throw new Error(`Organizations query failed: ${orgError.message}`);
    }

    // 0件でも200を返す
    if (!orgData || orgData.length === 0) {
      logger.info('[public/organizations] no organizations found, returning empty result');
      return NextResponse.json({
        data: [],
        meta: {
          total: 0,
          page: 1,
          limit: 0,
          totalPages: 1,
          hasMore: false
        }
      }, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }

    // LuxuCare検出ログ
    const hasLuxuCare = orgData.some(o => o.id === 'c53b7fae-1ae3-48f4-98c1-5c3217f9fbb3');
    if (hasLuxuCare) {
      logger.info('[public/organizations] has LuxuCare: true');
    }

    // Step 2: Organization IDsを抽出
    const organizationIds = orgData.map(org => org.id);

    // 公開判定: is_published + published_at + deleted_at
    const nowISO = new Date().toISOString();

    // Step 3: Services と Case Studies を別々に取得（エラー耐性あり）
    let servicesData: any[] = [];
    let caseStudiesData: any[] = [];

    // Services取得（VIEW経由 - SST強制）
    try {
      const { data: services, error: servicesError } = await supabase
        .from('v_services_public')
        .select('id, name, description, organization_id')
        .in('organization_id', organizationIds)
        .eq('is_published', true)
        .or(`published_at.is.null,published_at.lte.${nowISO}`)
        .is('deleted_at', null);

      if (servicesError) {
        logger.warn('[public/organizations] services query failed', { data: { error: servicesError.message } });
        servicesData = [];
      } else {
        servicesData = services || [];
      }
    } catch (error) {
      logger.warn('[public/organizations] services query error:', { data: error });
      servicesData = [];
    }

    // Case Studies取得（VIEW経由 - SST強制）
    try {
      const { data: caseStudies, error: caseStudiesError } = await supabase
        .from('v_case_studies_public')
        .select('id, title, organization_id')
        .in('organization_id', organizationIds)
        .eq('is_published', true)
        .or(`published_at.is.null,published_at.lte.${nowISO}`)
        .is('deleted_at', null);

      if (caseStudiesError) {
        logger.warn('[public/organizations] case studies query failed', { data: { error: caseStudiesError.message } });
        caseStudiesData = [];
      } else {
        caseStudiesData = caseStudies || [];
      }
    } catch (error) {
      logger.warn('[public/organizations] case studies query error:', { data: error });
      caseStudiesData = [];
    }

    // Step 4: メモリ上でデータを結合
    // Organization別にサービスと事例をグループ化
    const servicesByOrg = servicesData.reduce((acc, service) => {
      const orgId = service.organization_id;
      if (!acc[orgId]) acc[orgId] = [];
      acc[orgId].push(service);
      return acc;
    }, {} as Record<string, any[]>);

    const caseStudiesByOrg = caseStudiesData.reduce((acc, caseStudy) => {
      const orgId = caseStudy.organization_id;
      if (!acc[orgId]) acc[orgId] = [];
      acc[orgId].push(caseStudy);
      return acc;
    }, {} as Record<string, any[]>);

    // データ変換（services, case_studiesを追加）+ 🔒 sanitize適用
    // ⚠️ VIEWにないカラム（industries等）は参照しない
    const transformedData = orgData.map(org => {
      const sanitized = sanitizeOrganization(org as Record<string, unknown>);
      return {
        ...sanitized,
        services: servicesByOrg[org.id] || [],
        case_studies: caseStudiesByOrg[org.id] || []
      };
    });

    // Step 5: レスポンス返却
    return NextResponse.json({
      data: transformedData,
      meta: {
        total: transformedData.length,
        page: 1,
        limit: transformedData.length,
        totalPages: 1,
        hasMore: false
      }
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });

  } catch (error) {
    logger.error('[public/organizations] API Error:', { data: error });
    
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

/**
 * OPTIONS /api/public/organizations
 * CORS プリフライトリクエスト対応
 */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}