/**
 * CMS サイト設定 API
 * TODO: [SUPABASE_CMS_MIGRATION] 現在は key-value 形式だが、Supabase の「正」では組織ごとの構造化設定になります
 * 将来的には organization_id ベースの構造化設定 (logo_url, hero_title, seo_title 等) に移行予定
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

// サイト設定一覧取得
export async function GET(request: NextRequest) {
  // 管理者認証チェック
  const authResult = await requireAdmin();
  if (!isAuthorized(authResult)) {
    return authResult.response;
  }

  try {
    const supabase = await createClient();

    const url = new URL(request.url);
    const isPublicOnly = url.searchParams.get('public_only') === 'true';

    let query = supabase
      .from('cms_site_settings')
      .select('id, key, value, description, data_type, is_public, created_at, updated_at')
      .order('key');

    if (isPublicOnly) {
      query = query.eq('is_public', true);
    }

    const { data: settings, error } = await query;

    if (error) {
      logger.error('[CMS Site Settings] Failed to fetch settings', { data: error });
      
      // テーブル不存在の場合は空配列を返す
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
      data: settings || [],
      total: settings?.length || 0
    });

  } catch (error) {
    logger.error('[CMS Site Settings] Unexpected error', { data: error });
    return handleApiError(error);
  }
}

// サイト設定更新・作成
export async function POST(request: NextRequest) {
  // 管理者認証チェック
  const authResult = await requireAdmin();
  if (!isAuthorized(authResult)) {
    return authResult.response;
  }

  try {
    const supabase = await createClient();

    const body = await request.json();
    const { key, value, description, data_type = 'text', is_public = false } = body;

    if (!key) {
      return validationError([
        { field: 'key', message: 'Setting key is required' }
      ]);
    }

    const settingData = {
      key,
      value,
      description,
      data_type,
      is_public,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('cms_site_settings')
      .upsert(settingData, {
        onConflict: 'key'
      })
      .select()
      .single();

    if (error) {
      logger.error('[CMS Site Settings] Failed to save setting', { data: error });
      
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
      message: 'Site setting saved successfully'
    });

  } catch (error) {
    logger.error('[CMS Site Settings] POST error', { data: error });
    return handleApiError(error);
  }
}

// サイト設定削除
export async function DELETE(request: NextRequest) {
  // 管理者認証チェック
  const authResult = await requireAdmin();
  if (!isAuthorized(authResult)) {
    return authResult.response;
  }

  try {
    const supabase = await createClient();

    const url = new URL(request.url);
    const key = url.searchParams.get('key');

    if (!key) {
      return validationError([
        { field: 'key', message: 'Setting key is required' }
      ]);
    }

    const { error } = await supabase
      .from('cms_site_settings')
      .delete()
      .eq('key', key);

    if (error) {
      logger.error('[CMS Site Settings] Failed to delete setting', { data: error });
      return handleDatabaseError(error);
    }

    return NextResponse.json({
      success: true,
      message: 'Site setting deleted successfully'
    });

  } catch (error) {
    logger.error('[CMS Site Settings] DELETE error', { data: error });
    return handleApiError(error);
  }
}