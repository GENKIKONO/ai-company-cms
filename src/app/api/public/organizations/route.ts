/**
 * Public Organizations API - RLS対応版
 * 公開組織一覧API（count取得不可対応・フォールバック付き・RLS再帰回避）
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/public/organizations
 * 公開組織一覧を取得（RLS環境対応・2クエリ構成）
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // パラメータ取得
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '24')));
    const search = searchParams.get('search') || '';
    const industry = searchParams.get('industry') || '';
    const location = searchParams.get('location') || '';

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

    // 🔧 Query 1: Organizations のみを取得（JOINなしでRLS再帰回避）
    let orgQuery = supabase
      .from('organizations')
      .select(`
        id,
        name,
        slug,
        description,
        website_url,
        email,
        email_public,
        telephone,
        industries,
        established_at,
        employees,
        address_region,
        address_locality,
        logo_url
      `, { count: 'exact' })
      .eq('status', 'published')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    // 検索フィルター適用
    if (search) {
      orgQuery = orgQuery.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (industry) {
      orgQuery = orgQuery.contains('industries', [industry]);
    }

    if (location) {
      orgQuery = orgQuery.or(`address_region.ilike.%${location}%,address_locality.ilike.%${location}%`);
    }

    // ページネーション
    const offset = (page - 1) * limit;
    orgQuery = orgQuery.range(offset, offset + limit - 1);

    // Organizations クエリ実行
    const { data: orgData, error: orgError, count } = await orgQuery;

    if (orgError) {
      throw new Error(`Organizations query failed: ${orgError.message}`);
    }

    if (!orgData || orgData.length === 0) {
      // データが空の場合
      const meta = {
        total: count || 0,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil((count || 0) / limit)),
        hasMore: (count || 0) > limit * page,
        filters: { 
          search: search || null, 
          industry: industry || null, 
          location: location || null 
        },
      };

      return NextResponse.json({
        data: [],
        meta,
        cached: false,
        timestamp: new Date().toISOString(),
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

    // STEP 3: LuxuCare が本当に返るかをAPI内で一度だけログする
    const hasLuxuCare = orgData.some(o => o.id === 'c53b7fae-1ae3-48f4-98c1-5c3217f9fbb3');
    console.log('[public/organizations] hasLuxuCare:', hasLuxuCare);
    
    // Organization IDsを抽出
    const organizationIds = orgData.map(org => org.id);

    // 🔧 Query 2: Services と Case Studies を別々に取得
    const [servicesResult, caseStudiesResult] = await Promise.all([
      // Services取得
      supabase
        .from('services')
        .select('id, name, description, organization_id')
        .in('organization_id', organizationIds),

      // Case Studies取得  
      supabase
        .from('case_studies')
        .select('id, title, organization_id')
        .in('organization_id', organizationIds)
    ]);

    if (servicesResult.error) {
      console.warn('Services query failed, proceeding without services:', servicesResult.error.message);
    }

    if (caseStudiesResult.error) {
      console.warn('Case studies query failed, proceeding without case studies:', caseStudiesResult.error.message);
    }

    // 🔧 メモリ上でデータを結合
    const servicesData = servicesResult.data || [];
    const caseStudiesData = caseStudiesResult.data || [];

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

    // 🔧 Step 2: RLSフォールバック処理
    const actualTotal = 
      count !== null && count !== undefined
        ? count
        : Array.isArray(transformedData)
          ? transformedData.length
          : 0;

    // 🔧 Step 3: meta構築
    const meta = {
      total: actualTotal,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(actualTotal / limit)),
      hasMore: actualTotal > limit * page,
      filters: { 
        search: search || null, 
        industry: industry || null, 
        location: location || null 
      },
    };

    // 🔧 Step 4: JSON出力
    return NextResponse.json({
      data: transformedData,
      meta,
      cached: false,
      timestamp: new Date().toISOString(),
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
    console.error('Public Organizations API Error:', error);
    
    // 🔧 Step 5: エラー時は500で error.message を返す
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
      'Access-Control-Max-Age': '86400', // 24時間
    },
  });
}