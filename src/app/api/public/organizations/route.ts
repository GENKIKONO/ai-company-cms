/**
 * Public Organizations API - RLS対応・JOINなし版
 * 公開組織一覧API（RLS無限再帰回避・2段階取得・エラー耐性あり）
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/log';
import {
  V_ORGANIZATIONS_PUBLIC_SELECT_LIST,
  sanitizeForPublic,
} from '@/lib/db/public-view-contracts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

    // ============================================
    // Step 1: Organizations を取得
    // ⚠️ 契約: V_ORGANIZATIONS_PUBLIC_SELECT_LIST
    // ⚠️ VIEWは既に公開済みデータのみ含む（追加フィルター不要）
    // ============================================
    const { data: orgDataRaw, error: orgError } = await supabase
      .from('v_organizations_public')
      .select(V_ORGANIZATIONS_PUBLIC_SELECT_LIST)
      .order('name', { ascending: true });

    // 型アサーション（VIEWの型はSupabaseが推論できないため）
    const orgData = orgDataRaw as unknown as Array<Record<string, unknown>> | null;

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
    const organizationIds = orgData.map(org => org.id as string);

    // ============================================
    // Step 3: Services と Case Studies を別々に取得
    // ⚠️ VIEWは既に公開済みデータのみ含む（追加フィルター不要）
    // ============================================
    let servicesData: Array<{ id: string; name: string; description: string | null; organization_id: string }> = [];
    let caseStudiesData: Array<{ id: string; title: string; organization_id: string }> = [];

    // Services取得
    try {
      const { data: services, error: servicesError } = await supabase
        .from('v_services_public')
        .select('id, name, description, organization_id')
        .in('organization_id', organizationIds);

      if (servicesError) {
        logger.warn('[public/organizations] services query failed', { data: { error: servicesError.message } });
      } else {
        servicesData = services || [];
      }
    } catch (error) {
      logger.warn('[public/organizations] services query error:', { data: error });
    }

    // Case Studies取得
    try {
      const { data: caseStudies, error: caseStudiesError } = await supabase
        .from('v_case_studies_public')
        .select('id, title, organization_id')
        .in('organization_id', organizationIds);

      if (caseStudiesError) {
        logger.warn('[public/organizations] case studies query failed', { data: { error: caseStudiesError.message } });
      } else {
        caseStudiesData = caseStudies || [];
      }
    } catch (error) {
      logger.warn('[public/organizations] case studies query error:', { data: error });
    }

    // Step 4: メモリ上でデータを結合
    const servicesByOrg = servicesData.reduce((acc, service) => {
      const orgId = service.organization_id;
      if (!acc[orgId]) acc[orgId] = [];
      acc[orgId].push(service);
      return acc;
    }, {} as Record<string, typeof servicesData>);

    const caseStudiesByOrg = caseStudiesData.reduce((acc, caseStudy) => {
      const orgId = caseStudy.organization_id;
      if (!acc[orgId]) acc[orgId] = [];
      acc[orgId].push(caseStudy);
      return acc;
    }, {} as Record<string, typeof caseStudiesData>);

    // データ変換（services, case_studiesを追加）+ sanitize適用
    const transformedData = orgData.map(org => {
      const sanitized = sanitizeForPublic(org);
      const id = org.id as string;
      return {
        ...sanitized,
        services: servicesByOrg[id] || [],
        case_studies: caseStudiesByOrg[id] || []
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
