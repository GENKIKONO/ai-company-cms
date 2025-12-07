/**
 * P2-6: CMS統合ダッシュボード - コンテンツ詳細・更新・削除API
 * 特定のコンテンツアイテムの操作を提供
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireOrgMember } from '@/lib/api/auth-middleware';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import type { 
  AdminContentDetailResponse,
  AdminContentApiError,
  AdminContentUpdateRequest,
  AdminContentListItem,
  SourceTableType,
  CmsContentStatus
} from '@/types/cms-content';
import { isValidSourceTable } from '@/types/cms-content';

interface RouteParams {
  params: Promise<{
    sourceTable: string;
    id: string;
  }>;
}

/**
 * 元テーブルから詳細データを取得
 */
async function fetchSourceData(supabase: any, sourceTable: SourceTableType, id: string): Promise<any> {
  const tableQueries = {
    posts: `SELECT id, title, content, summary, slug, status, published_at, created_at, updated_at FROM posts WHERE id = $1`,
    news: `SELECT id, title, content, summary, slug, status, published_at, created_at, updated_at FROM news WHERE id = $1`,
    faqs: `SELECT id, question as title, answer as content, category, slug, status, created_at, updated_at FROM faqs WHERE id = $1`,
    case_studies: `SELECT id, title, content, summary, client, industry, slug, status, published_at, created_at, updated_at FROM case_studies WHERE id = $1`,
    qa_entries: `SELECT id, question as title, answer as content, category, difficulty, slug, status, created_at, updated_at FROM qa_entries WHERE id = $1`,
    sales_materials: `SELECT id, title, description as content, file_path, file_type, slug, status, created_at, updated_at FROM sales_materials WHERE id = $1`,
    ai_interview_sessions: `SELECT id, title, summary as content, session_type, duration_minutes, slug, status, created_at, updated_at FROM ai_interview_sessions WHERE id = $1`
  };

  const query = tableQueries[sourceTable];
  if (!query) {
    throw new Error(`Unsupported source table: ${sourceTable}`);
  }

  const { data, error } = await supabase.rpc('exec_sql', {
    query,
    params: [id]
  });

  if (error) {
    throw new Error(`Failed to fetch source data: ${error.message}`);
  }

  return data?.[0] || null;
}

/**
 * 元テーブルのデータを更新
 */
async function updateSourceData(
  supabase: any, 
  sourceTable: SourceTableType, 
  id: string, 
  updateData: AdminContentUpdateRequest
): Promise<void> {
  const updateFields: string[] = [];
  const params: any[] = [id]; // ID は常に $1
  let paramIndex = 2;

  // 共通フィールドの更新
  if (updateData.title !== undefined) {
    updateFields.push(`title = $${paramIndex}`);
    params.push(updateData.title);
    paramIndex++;
  }

  if (updateData.slug !== undefined) {
    updateFields.push(`slug = $${paramIndex}`);
    params.push(updateData.slug);
    paramIndex++;
  }

  if (updateData.status !== undefined) {
    updateFields.push(`status = $${paramIndex}`);
    params.push(updateData.status);
    paramIndex++;
  }

  if (updateData.published_at !== undefined) {
    updateFields.push(`published_at = $${paramIndex}`);
    params.push(updateData.published_at);
    paramIndex++;
  }

  // メタデータフィールド（テーブル固有）
  if (updateData.meta && Object.keys(updateData.meta).length > 0) {
    // テーブル固有のメタデータフィールド更新ロジック
    Object.entries(updateData.meta).forEach(([key, value]) => {
      updateFields.push(`${key} = $${paramIndex}`);
      params.push(value);
      paramIndex++;
    });
  }

  // 更新日時を追加
  updateFields.push(`updated_at = NOW()`);

  if (updateFields.length === 1) { // updated_at のみの場合は更新不要
    return;
  }

  const updateQuery = `
    UPDATE ${sourceTable} 
    SET ${updateFields.join(', ')}
    WHERE id = $1 AND organization_id = $${paramIndex}
  `;
  params.push(updateData.meta?.organization_id); // RLS用の組織ID

  const { error } = await supabase.rpc('exec_sql', {
    query: updateQuery,
    params
  });

  if (error) {
    throw new Error(`Failed to update source data: ${error.message}`);
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    const { sourceTable, id } = resolvedParams;

    // パラメータ検証
    if (!isValidSourceTable(sourceTable)) {
      return NextResponse.json(
        {
          success: false,
          code: 'INVALID_SOURCE_TABLE',
          message: `Invalid source table: ${sourceTable}`
        } as AdminContentApiError,
        { status: 400 }
      );
    }

    // 組織IDを取得（URLクエリまたはヘッダーから）
    const url = new URL(request.url);
    const orgId = url.searchParams.get('orgId');
    if (!orgId) {
      return NextResponse.json(
        {
          success: false,
          code: 'MISSING_ORG_ID',
          message: 'orgId parameter is required'
        } as AdminContentApiError,
        { status: 400 }
      );
    }

    // 認証・認可チェック
    const authResult = await requireOrgMember(orgId, request);
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

    // v_admin_contents から基本情報を取得
    const { data: adminItem, error: adminError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT 
          id, organization_id, content_type, title, slug, status,
          created_at, updated_at, published_at, locale, region_code,
          base_path, meta, source_table
        FROM v_admin_contents 
        WHERE id = $1 AND organization_id = $2 AND source_table = $3
      `,
      params: [id, orgId, sourceTable]
    });

    if (adminError) {
      throw new Error(`Failed to fetch admin content: ${adminError.message}`);
    }

    if (!adminItem || adminItem.length === 0) {
      return NextResponse.json(
        {
          success: false,
          code: 'CONTENT_NOT_FOUND',
          message: 'Content not found'
        } as AdminContentApiError,
        { status: 404 }
      );
    }

    const item = adminItem[0] as AdminContentListItem;

    // 元テーブルから詳細データを取得
    const sourceData = await fetchSourceData(supabase, sourceTable as SourceTableType, id);

    const response: AdminContentDetailResponse = {
      success: true,
      item,
      sourceData
    };

    logger.info('Admin content detail fetched successfully', {
      id,
      sourceTable,
      orgId,
      contentType: item.content_type
    });

    return NextResponse.json(response);

  } catch (error: any) {
    logger.error('Failed to fetch admin content detail:', {
      error: error.message,
      url: request.url
    });

    const errorResponse: AdminContentApiError = {
      success: false,
      code: 'FETCH_DETAIL_ERROR',
      message: error.message || 'Failed to fetch content detail',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    const { sourceTable, id } = resolvedParams;

    // パラメータ検証
    if (!isValidSourceTable(sourceTable)) {
      return NextResponse.json(
        {
          success: false,
          code: 'INVALID_SOURCE_TABLE',
          message: `Invalid source table: ${sourceTable}`
        } as AdminContentApiError,
        { status: 400 }
      );
    }

    // リクエストボディ解析
    const updateData: AdminContentUpdateRequest = await request.json();

    // 組織IDを取得
    const url = new URL(request.url);
    const orgId = url.searchParams.get('orgId');
    if (!orgId) {
      return NextResponse.json(
        {
          success: false,
          code: 'MISSING_ORG_ID',
          message: 'orgId parameter is required'
        } as AdminContentApiError,
        { status: 400 }
      );
    }

    // 認証・認可チェック
    const authResult = await requireOrgMember(orgId, request);
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

    // 元テーブルのデータを更新
    updateData.meta = { ...updateData.meta, organization_id: orgId };
    await updateSourceData(supabase, sourceTable as SourceTableType, id, updateData);

    // 更新後のデータを取得して返却
    const { data: updatedItem, error: fetchError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT 
          id, organization_id, content_type, title, slug, status,
          created_at, updated_at, published_at, locale, region_code,
          base_path, meta, source_table
        FROM v_admin_contents 
        WHERE id = $1 AND organization_id = $2 AND source_table = $3
      `,
      params: [id, orgId, sourceTable]
    });

    if (fetchError || !updatedItem || updatedItem.length === 0) {
      throw new Error('Failed to fetch updated content');
    }

    const response: AdminContentDetailResponse = {
      success: true,
      item: updatedItem[0] as AdminContentListItem
    };

    logger.info('Admin content updated successfully', {
      id,
      sourceTable,
      orgId,
      updatedFields: Object.keys(updateData)
    });

    return NextResponse.json(response);

  } catch (error: any) {
    logger.error('Failed to update admin content:', {
      error: error.message,
      url: request.url
    });

    const errorResponse: AdminContentApiError = {
      success: false,
      code: 'UPDATE_ERROR',
      message: error.message || 'Failed to update content',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    const { sourceTable, id } = resolvedParams;

    // パラメータ検証
    if (!isValidSourceTable(sourceTable)) {
      return NextResponse.json(
        {
          success: false,
          code: 'INVALID_SOURCE_TABLE',
          message: `Invalid source table: ${sourceTable}`
        } as AdminContentApiError,
        { status: 400 }
      );
    }

    // 組織IDを取得
    const url = new URL(request.url);
    const orgId = url.searchParams.get('orgId');
    if (!orgId) {
      return NextResponse.json(
        {
          success: false,
          code: 'MISSING_ORG_ID',
          message: 'orgId parameter is required'
        } as AdminContentApiError,
        { status: 400 }
      );
    }

    // 認証・認可チェック
    const authResult = await requireOrgMember(orgId, request);
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

    // 元テーブルからデータを削除
    const deleteQuery = `DELETE FROM ${sourceTable} WHERE id = $1 AND organization_id = $2`;
    const { error: deleteError } = await supabase.rpc('exec_sql', {
      query: deleteQuery,
      params: [id, orgId]
    });

    if (deleteError) {
      throw new Error(`Failed to delete content: ${deleteError.message}`);
    }

    logger.info('Admin content deleted successfully', {
      id,
      sourceTable,
      orgId
    });

    return NextResponse.json({
      success: true,
      message: 'Content deleted successfully'
    });

  } catch (error: any) {
    logger.error('Failed to delete admin content:', {
      error: error.message,
      url: request.url
    });

    const errorResponse: AdminContentApiError = {
      success: false,
      code: 'DELETE_ERROR',
      message: error.message || 'Failed to delete content',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}