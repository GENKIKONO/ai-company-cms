/**
 * P2-6: CMS統合ダッシュボード - コンテンツ一覧API
 * 複数のコンテンツタイプを統合したビューを提供
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireOrgMember } from '@/lib/api/auth-middleware';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import type { 
  AdminContentListResponse,
  AdminContentApiError,
  AdminContentListQuery,
  AdminContentListItem,
  CmsContentType,
  CmsContentStatus
} from '@/types/cms-content';

// Valid sort options
const VALID_SORT_OPTIONS = [
  'updated_desc', 'updated_asc',
  'created_desc', 'created_asc',
  'title_asc', 'title_desc',
  'published_desc', 'published_asc'
] as const;

type SortOption = typeof VALID_SORT_OPTIONS[number];

/**
 * クエリパラメータの検証とパース
 */
function parseQueryParams(url: URL): AdminContentListQuery & { sort?: SortOption } {
  const orgId = url.searchParams.get('orgId');
  if (!orgId) {
    throw new Error('orgId parameter is required');
  }

  const sortParam = url.searchParams.get('sort');
  const sort = VALID_SORT_OPTIONS.includes(sortParam as SortOption)
    ? (sortParam as SortOption)
    : 'updated_desc';

  return {
    orgId,
    contentType: url.searchParams.get('contentType') || undefined,
    status: (url.searchParams.get('status') as CmsContentStatus) || undefined,
    q: url.searchParams.get('q') || undefined,
    page: parseInt(url.searchParams.get('page') || '1'),
    pageSize: Math.min(parseInt(url.searchParams.get('pageSize') || '20'), 100), // 最大100件制限
    sort
  };
}

/**
 * ORDER BY句の構築
 */
function buildOrderByClause(sort: SortOption): string {
  const sortMap: Record<SortOption, string> = {
    updated_desc: 'updated_at DESC NULLS LAST',
    updated_asc: 'updated_at ASC NULLS FIRST',
    created_desc: 'created_at DESC',
    created_asc: 'created_at ASC',
    title_asc: 'title ASC NULLS LAST',
    title_desc: 'title DESC NULLS LAST',
    published_desc: 'published_at DESC NULLS LAST',
    published_asc: 'published_at ASC NULLS FIRST',
  };
  return sortMap[sort] || 'updated_at DESC NULLS LAST';
}

/**
 * WHERE句の構築（フィルタ条件）
 */
function buildWhereClause(query: AdminContentListQuery): { whereClause: string; params: any[] } {
  const conditions: string[] = ['organization_id = $1'];
  const params: any[] = [query.orgId];
  let paramIndex = 2;

  // コンテンツタイプフィルタ（カンマ区切り対応）
  if (query.contentType) {
    const contentTypes = query.contentType.split(',').map(t => t.trim()).filter(Boolean);
    if (contentTypes.length === 1) {
      conditions.push(`content_type = $${paramIndex}`);
      params.push(contentTypes[0]);
      paramIndex++;
    } else if (contentTypes.length > 1) {
      const placeholders = contentTypes.map(() => `$${paramIndex++}`).join(', ');
      conditions.push(`content_type IN (${placeholders})`);
      params.push(...contentTypes);
    }
  }

  // ステータスフィルタ
  if (query.status) {
    conditions.push(`status = $${paramIndex}`);
    params.push(query.status);
    paramIndex++;
  }

  // 検索キーワード（タイトルとスラッグ）
  if (query.q) {
    conditions.push(`(title ILIKE $${paramIndex} OR slug ILIKE $${paramIndex})`);
    params.push(`%${query.q}%`);
    paramIndex++;
  }

  return {
    whereClause: conditions.join(' AND '),
    params
  };
}

export async function GET(request: NextRequest) {
  try {
    // クエリパラメータ解析
    const query = parseQueryParams(new URL(request.url));
    
    // 認証・認可チェック
    const authResult = await requireOrgMember(query.orgId, request);
    if (authResult.success === false) {
      return NextResponse.json(
        { 
          success: false, 
          code: authResult.code,
          message: authResult.message
        } as AdminContentApiError,
        { status: 401 }
      );
    }

    const supabase = await createClient();

    // WHERE句構築
    const { whereClause, params } = buildWhereClause(query);

    // 総件数取得（ページネーション用）
    const countQuery = `
      SELECT COUNT(*) as total
      FROM v_admin_contents 
      WHERE ${whereClause}
    `;
    
    const { data: countResult, error: countError } = await supabase.rpc('exec_sql', {
      query: countQuery,
      params
    });

    if (countError) {
      throw new Error(`Count query failed: ${countError.message}`);
    }

    const total = parseInt(countResult?.[0]?.total || '0');

    // ページネーション計算
    const offset = (query.page - 1) * query.pageSize;
    const hasMore = offset + query.pageSize < total;

    // ORDER BY構築
    const orderBy = buildOrderByClause(query.sort || 'updated_desc');

    // データ取得クエリ
    const dataQuery = `
      SELECT
        id,
        organization_id,
        content_type,
        title,
        slug,
        status,
        created_at,
        updated_at,
        published_at,
        locale,
        region_code,
        base_path,
        meta,
        source_table
      FROM v_admin_contents
      WHERE ${whereClause}
      ORDER BY ${orderBy}, id DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const { data: items, error: dataError } = await supabase.rpc('exec_sql', {
      query: dataQuery,
      params: [...params, query.pageSize, offset]
    });

    if (dataError) {
      throw new Error(`Data query failed: ${dataError.message}`);
    }

    // レスポンス構築
    const response: AdminContentListResponse = {
      success: true,
      items: (items || []) as AdminContentListItem[],
      page: query.page,
      pageSize: query.pageSize,
      total,
      hasMore
    };

    logger.info('Admin contents fetched successfully', {
      orgId: query.orgId,
      contentType: query.contentType,
      status: query.status,
      itemsCount: response.items.length,
      total: response.total,
      page: response.page
    });

    return NextResponse.json(response);

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    const errStack = error instanceof Error ? error.stack : undefined;

    logger.error('Failed to fetch admin contents:', {
      error: errMsg,
      stack: errStack
    });

    const errorResponse: AdminContentApiError = {
      success: false,
      code: 'FETCH_CONTENTS_ERROR',
      message: errMsg || 'Failed to fetch contents',
      details: process.env.NODE_ENV === 'development' ? errStack : undefined
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}