/**
 * Public Organizations API - RLS対応版
 * 公開組織一覧API（count取得不可対応・フォールバック付き）
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/public/organizations
 * 公開組織一覧を取得（RLS環境対応）
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

    // 🔧 Step 1: count要求の明示
    let query = supabase
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
        logo_url,
        services(id, name, description),
        case_studies(id, title)
      `, { count: 'exact' })
      .eq('status', 'published')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    // 検索フィルター適用
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (industry) {
      query = query.contains('industries', [industry]);
    }

    if (location) {
      query = query.or(`address_region.ilike.%${location}%,address_locality.ilike.%${location}%`);
    }

    // ページネーション
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    // クエリ実行
    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    // データ変換
    const transformedData = data?.map(org => ({
      ...org,
      industries: Array.isArray(org.industries) ? org.industries : [],
      services: Array.isArray(org.services) ? org.services : []
    })) || [];

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