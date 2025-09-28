// Partner-Only API: /api/organizations
// 代理店（パートナー）のみがアクセス可能な企業管理API
import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { z } from 'zod';
import {
  requireAuth,
  requirePartnerAccess,
  type AuthContext
} from '@/lib/api/auth-middleware';
import {
  handleApiError,
  validationError,
  conflictError,
  notFoundError,
  handleZodError,
  createErrorResponse
} from '@/lib/api/error-responses';
import { normalizeOrganizationPayload } from '@/lib/utils/data-normalization';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Organization, OrganizationFormData } from '@/types/database';
import {
  organizationCreateSchema,
  organizationUpdateSchema,
  type OrganizationCreate
} from '@/lib/schemas/organization';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

// GET - パートナーが管理可能な企業リストを取得
export async function GET(request: NextRequest) {
  try {
    // 統一認証チェック
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    // パートナーアクセスチェック
    const partnerCheck = requirePartnerAccess(authResult as AuthContext);
    if (partnerCheck) {
      return partnerCheck;
    }
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '24'), 100);
    const industry = searchParams.get('industry');
    const region = searchParams.get('region');
    const size = searchParams.get('size');
    const search = searchParams.get('q');
    const status = searchParams.get('status');
    const is_published = searchParams.get('is_published');

    const offset = (page - 1) * limit;

    const cookieStore = await cookies();
    const supabase = createServerClient(
      env.SUPABASE_URL,
      env.SUPABASE_ANON_KEY,
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
            } catch (error) {
              // Server Component での cookie 設定エラーをハンドル
            }
          },
        },
      }
    );
    
    let query = supabase
      .from('organizations')
      .select('*', { count: 'exact' });
    
    // パートナーの場合、アクセス可能な企業のみ表示
    if ((authResult as AuthContext).userAccess.flow === 'partner' && (authResult as AuthContext).userAccess.accessibleOrgIds.length > 0) {
      query = query.in('id', (authResult as AuthContext).userAccess.accessibleOrgIds);
    }
    // 管理者の場合は全企業にアクセス可能（フィルタなし）

    // Apply filters
    if (is_published !== null && is_published !== undefined) {
      query = query.eq('is_published', is_published === 'true');
    }
    
    if (status) {
      const statuses = status.split(',');
      query = query.in('status', statuses);
    }
    
    if (industry) {
      const industries = industry.split(',');
      query = query.overlaps('industries', industries);
    }

    if (region) {
      const regions = region.split(',');
      query = query.in('address_region', regions);
    }

    if (size) {
      const sizes = size.split(',');
      query = query.in('size', sizes);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,keywords.ilike.%${search}%`);
    }

    const { data, error, count } = await query
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Database error:', error);
      return handleApiError(error);
    }

    return NextResponse.json(
      {
        data: data || [],
        meta: {
          total: count || 0,
          page,
          limit,
          has_more: (count || 0) > offset + limit,
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store, must-revalidate'
        }
      }
    );

  } catch (error) {
    console.error('[GET /api/organizations] Unexpected error:', error);
    return handleApiError(error);
  }
}

// データ正規化は統一ライブラリを使用

// POST - パートナーが新しい企業を作成
export async function POST(request: NextRequest) {
  try {
    // 統一認証チェック
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    // パートナーアクセスチェック
    const partnerCheck = requirePartnerAccess(authResult as AuthContext);
    if (partnerCheck) {
      return partnerCheck;
    }
    
    const rawBody = await request.json();

    // 統一バリデーション
    let validatedData: OrganizationCreate;
    try {
      validatedData = organizationCreateSchema.parse(rawBody);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return handleZodError(error);
      }
      throw error;
    }

    // データの正規化
    const normalizedBody = normalizeOrganizationPayload(validatedData);

    const cookieStore = await cookies();
    const supabase = createServerClient(
      env.SUPABASE_URL,
      env.SUPABASE_ANON_KEY,
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
            } catch (error) {
              // Server Component での cookie 設定エラーをハンドル
            }
          },
        },
      }
    );
    
    // slugの重複チェック
    const { data: slugCheck } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', validatedData.slug)
      .single();

    if (slugCheck) {
      return conflictError('Organization', 'slug');
    }

    const organizationData: Partial<Organization> = {
      ...normalizedBody,
      created_by: (authResult as AuthContext).user.id,
      status: normalizedBody.status || 'draft',
      is_published: false, // パートナー作成時は初期非公開
    };

    const { data, error } = await supabase
      .from('organizations')
      .insert([organizationData])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return handleApiError(error);
    }

    return NextResponse.json(
      { 
        data: {
          id: data.id,
          name: data.name,
          slug: data.slug,
          status: data.status
        },
        message: 'Organization created successfully'
      }, 
      { 
        status: 201,
        headers: {
          'Cache-Control': 'no-store, must-revalidate'
        }
      }
    );

  } catch (error) {
    console.error('[POST /api/organizations] Unexpected error:', error);
    return handleApiError(error);
  }
}