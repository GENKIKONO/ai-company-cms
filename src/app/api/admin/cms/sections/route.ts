/**
 * CMS セクション管理 API
 *
 * ⚠️ Requires site_admin authentication.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isAuthorized } from '@/lib/auth/require-admin';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { handleApiError, handleDatabaseError, validationError } from '@/lib/api/error-responses';

// セクション一覧取得
export async function GET(request: NextRequest) {
  // 管理者認証チェック
  const authResult = await requireAdmin();
  if (!isAuthorized(authResult)) {
    return authResult.response;
  }

  try {
    const supabase = await createClient();

    const url = new URL(request.url);
    const pageKey = url.searchParams.get('page_key');
    const activeOnly = url.searchParams.get('active_only') === 'true';

    let query = supabase
      .from('cms_sections')
      .select('id, page_key, section_key, section_type, title, content, display_order, is_active, created_at, updated_at')
      .order('page_key')
      .order('display_order');

    if (pageKey) {
      query = query.eq('page_key', pageKey);
    }

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data: sections, error } = await query;

    if (error) {
      logger.error('[CMS Sections] Failed to fetch sections', { data: error });
      
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        return NextResponse.json({
          success: true,
          data: [],
          message: 'CMS tables not yet created'
        });
      }
      
      return handleDatabaseError(error);
    }

    return NextResponse.json({
      success: true,
      data: sections || [],
      total: sections?.length || 0
    });

  } catch (error) {
    logger.error('[CMS Sections] Unexpected error', { data: error });
    return handleApiError(error);
  }
}

// セクション作成・更新
export async function POST(request: NextRequest) {
  // 管理者認証チェック
  const authResult = await requireAdmin();
  if (!isAuthorized(authResult)) {
    return authResult.response;
  }

  try {
    const supabase = await createClient();

    const body = await request.json();
    const { 
      page_key, 
      section_key, 
      section_type, 
      title, 
      content, 
      display_order = 0, 
      is_active = true 
    } = body;

    if (!page_key || !section_key || !section_type) {
      return validationError([
        { field: 'page_key', message: 'page_key, section_key, and section_type are required' }
      ]);
    }

    const sectionData = {
      page_key,
      section_key,
      section_type,
      title,
      content: content || {},
      display_order,
      is_active,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('cms_sections')
      .upsert(sectionData, {
        onConflict: 'page_key,section_key'
      })
      .select()
      .single();

    if (error) {
      logger.error('[CMS Sections] Failed to save section', { data: error });
      
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        return NextResponse.json(
          { error: 'CMS tables not yet created. Please run migration first.' },
          { status: 503 }
        );
      }
      
      return handleDatabaseError(error);
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Section saved successfully'
    });

  } catch (error) {
    logger.error('[CMS Sections] POST error', { data: error });
    return handleApiError(error);
  }
}

// セクション削除
export async function DELETE(request: NextRequest) {
  // 管理者認証チェック
  const authResult = await requireAdmin();
  if (!isAuthorized(authResult)) {
    return authResult.response;
  }

  try {
    const supabase = await createClient();

    const url = new URL(request.url);
    const pageKey = url.searchParams.get('page_key');
    const sectionKey = url.searchParams.get('section_key');

    if (!pageKey || !sectionKey) {
      return validationError([
        { field: 'page_key', message: 'page_key and section_key are required' }
      ]);
    }

    const { error } = await supabase
      .from('cms_sections')
      .delete()
      .eq('page_key', pageKey)
      .eq('section_key', sectionKey);

    if (error) {
      logger.error('[CMS Sections] Failed to delete section', { data: error });
      return handleDatabaseError(error);
    }

    return NextResponse.json({
      success: true,
      message: 'Section deleted successfully'
    });

  } catch (error) {
    logger.error('[CMS Sections] DELETE error', { data: error });
    return handleApiError(error);
  }
}