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

/**
 * クエリパラメータの検証とパース
 */
function parseQueryParams(url: URL): AdminContentListQuery {
  const orgId = url.searchParams.get('orgId');
  if (!orgId) {
    throw new Error('orgId parameter is required');
  }

  return {
    orgId,
    contentType: url.searchParams.get('contentType') || undefined,
    status: (url.searchParams.get('status') as CmsContentStatus) || undefined,
    q: url.searchParams.get('q') || undefined,
    page: parseInt(url.searchParams.get('page') || '1'),
    pageSize: Math.min(parseInt(url.searchParams.get('pageSize') || '20'), 100) // 最大100件制限
  };
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
      ORDER BY updated_at DESC, created_at DESC
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

  } catch (error: any) {
    logger.error('Failed to fetch admin contents:', {
      error: error.message,
      stack: error.stack
    });

    const errorResponse: AdminContentApiError = {
      success: false,
      code: 'FETCH_CONTENTS_ERROR',
      message: error.message || 'Failed to fetch contents',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}