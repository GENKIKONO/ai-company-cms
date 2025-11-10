/**
 * Public Organizations API - RLS対応・JOINなし版
 * 公開組織一覧API（RLS無限再帰回避・2段階取得・エラー耐性あり）
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/public/organizations
 * 公開組織一覧を取得（JOINなし・2段階取得版）
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  console.log('[public/organizations] called');

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

    // Step 1: Organizations のみを取得（JOINなしでRLS対応）
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select(`
        id,
        name,
        slug,
        description,
        website_url,
        email_public,
        email,
        industries,
        address_region,
        address_locality,
        logo_url
      `)
      .eq('status', 'published')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    console.log('[public/organizations] orgs:', orgData?.length || 0);

    if (orgError) {
      console.error('[public/organizations] organizations query error:', orgError);
      throw new Error(`Organizations query failed: ${orgError.message}`);
    }

    // 0件でも200を返す
    if (!orgData || orgData.length === 0) {
      console.log('[public/organizations] no organizations found, returning empty result');
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
      console.log('[public/organizations] has LuxuCare: true');
    }

    // Step 2: Organization IDsを抽出
    const organizationIds = orgData.map(org => org.id);

    // Step 3: Services と Case Studies を別々に取得（エラー耐性あり）
    let servicesData: any[] = [];
    let caseStudiesData: any[] = [];

    // Services取得
    try {
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select('id, name, description, organization_id')
        .in('organization_id', organizationIds);

      if (servicesError) {
        console.warn('[public/organizations] services query failed:', servicesError.message);
        servicesData = [];
      } else {
        servicesData = services || [];
      }
    } catch (error) {
      console.warn('[public/organizations] services query error:', error);
      servicesData = [];
    }

    // Case Studies取得
    try {
      const { data: caseStudies, error: caseStudiesError } = await supabase
        .from('case_studies')
        .select('id, title, organization_id')
        .in('organization_id', organizationIds);

      if (caseStudiesError) {
        console.warn('[public/organizations] case studies query failed:', caseStudiesError.message);
        caseStudiesData = [];
      } else {
        caseStudiesData = caseStudies || [];
      }
    } catch (error) {
      console.warn('[public/organizations] case studies query error:', error);
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

    // データ変換（services, case_studiesを追加）
    const transformedData = orgData.map(org => ({
      ...org,
      industries: Array.isArray(org.industries) ? org.industries : [],
      services: servicesByOrg[org.id] || [],
      case_studies: caseStudiesByOrg[org.id] || []
    }));

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
    console.error('[public/organizations] API Error:', error);
    
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