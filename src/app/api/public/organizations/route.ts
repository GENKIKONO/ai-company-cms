/**
 * Public Organizations API
 * 公開組織一覧API（キャッシュ・パフォーマンス最適化付き）
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { cacheHelpers } from '@/lib/cache/memory-cache';
import { 
  withPerformanceMonitoring, 
  conditionalResponse,
  rateLimit 
} from '@/lib/middleware/performance';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// レート制限: 1分間に60リクエスト
const RATE_LIMIT = { requests: 60, windowMs: 60000 };

async function handler(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '24')));
    const search = searchParams.get('search') || '';
    const industry = searchParams.get('industry') || '';
    const location = searchParams.get('location') || '';

    // レート制限チェック（IPベース）
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'anonymous';
    
    const rateLimitResult = rateLimit(
      `public-orgs:${clientIP}`, 
      RATE_LIMIT.requests, 
      RATE_LIMIT.windowMs
    );

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': RATE_LIMIT.requests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
          }
        }
      );
    }

    // キャッシュキー生成
    const cacheKey = `public-orgs:${page}:${limit}:${search}:${industry}:${location}`;
    
    // キャッシュからデータ取得を試行
    const cachedData = await cacheHelpers.organizations(async () => {
      return await fetchOrganizations(page, limit, search, industry, location);
    }, page, limit);

    // 条件付きレスポンス（ETag対応）
    const response = conditionalResponse(cachedData, request, 300); // 5分キャッシュ
    
    // レート制限ヘッダー追加
    response.headers.set('X-RateLimit-Limit', RATE_LIMIT.requests.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString());
    
    // CORS ヘッダー
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return response;

  } catch (error) {
    console.error('❌ Public Organizations API Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * 組織データ取得（キャッシュ対応）
 */
async function fetchOrganizations(
  page: number,
  limit: number,
  search: string,
  industry: string,
  location: string
) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
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

  let query = supabase
    .from('organizations')
    .select(`
      id,
      name,
      slug,
      description,
      website_url,
      email_public,
      phone_public,
      industries,
      established_at,
      employees,
      address_region,
      address_locality,
      logo_url,
      services(id, name, description)
    `)
    .eq('status', 'published')
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  // 検索フィルター
  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  }

  // 業界フィルター
  if (industry) {
    query = query.contains('industries', [industry]);
  }

  // 所在地フィルター
  if (location) {
    query = query.or(`address_region.ilike.%${location}%,address_locality.ilike.%${location}%`);
  }

  // ページネーション
  const offset = (page - 1) * limit;
  query = query.range(offset, offset + limit - 1);

  const { data: organizations, error, count } = await query;

  if (error) {
    throw new Error(`Database query failed: ${error.message}`);
  }

  // データ変換
  const transformedData = organizations?.map(org => ({
    ...org,
    industries: Array.isArray(org.industries) ? org.industries : [],
    services: Array.isArray(org.services) ? org.services : []
  })) || [];

  // ページネーション情報計算
  const totalPages = Math.ceil((count || 0) / limit);
  const hasMore = page < totalPages;

  return {
    data: transformedData,
    meta: {
      total: count || 0,
      page,
      limit,
      totalPages,
      hasMore,
      filters: {
        search: search || null,
        industry: industry || null,
        location: location || null
      }
    },
    cached: true,
    timestamp: new Date().toISOString()
  };
}

// OPTIONS ハンドラー（CORS プリフライト）
export async function OPTIONS() {
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

// パフォーマンス監視付きハンドラーをエクスポート
export const GET = withPerformanceMonitoring(handler);