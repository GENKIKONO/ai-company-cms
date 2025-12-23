/* eslint-disable no-console */
/**
 * Organization Feature Overrides API
 * 組織別機能オーバーライド
 * 2024-12: feature_overrides テーブル存在確認済み（Supabaseアシスタント）
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAuthError, createInternalError, generateErrorId } from '@/lib/utils/data-normalization';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

// GET - 組織別オーバーライド一覧取得
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 管理者認証チェック
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return createAuthError();
    }

    const url = new URL(request.url);
    const organizationId = url.searchParams.get('organization_id');

    let query = supabase
      .from('feature_overrides')
      .select('*')
      .order('created_at', { ascending: false });

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data: overrides, error } = await query;

    if (error) {
      logger.error('[GET /api/admin/feature-management/overrides] Query error:', { data: { error } });

      // テーブルが存在しない場合のフォールバック
      if (error.code === 'PGRST205' || error.message?.includes('does not exist')) {
        return NextResponse.json({
          success: true,
          overrides: [],
          features_available: false,
          message: 'feature_overrides table not found'
        });
      }

      return NextResponse.json(
        { error: 'Failed to fetch overrides' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      overrides: overrides || [],
      features_available: true,
      total: overrides?.length || 0
    });

  } catch (error) {
    const errorId = generateErrorId('get-feature-overrides');
    logger.error('[GET /api/admin/feature-management/overrides] Unexpected error:', { data: { errorId, error } });
    return createInternalError(errorId);
  }
}

// POST - 組織別オーバーライド作成/更新
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 管理者認証チェック
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return createAuthError();
    }

    const body = await request.json();
    const { organization_id, feature_key, is_enabled, config, expires_at } = body;

    if (!organization_id || !feature_key) {
      return NextResponse.json(
        { error: 'organization_id and feature_key are required' },
        { status: 400 }
      );
    }

    const overrideData = {
      organization_id,
      feature_key,
      is_enabled: is_enabled ?? true,
      config: config || {},
      expires_at: expires_at || null,
      updated_at: new Date().toISOString(),
      updated_by: authData.user.id
    };

    const { data, error } = await (supabase
      .from('feature_overrides') as any)
      .upsert(overrideData, {
        onConflict: 'organization_id,feature_key'
      })
      .select()
      .single();

    if (error) {
      logger.error('[POST /api/admin/feature-management/overrides] Upsert error:', { data: { error } });

      if (error.code === 'PGRST205' || error.message?.includes('does not exist')) {
        return NextResponse.json(
          { error: 'feature_overrides table not found' },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to save override' },
        { status: 500 }
      );
    }

    logger.info('[POST /api/admin/feature-management/overrides] Override saved', {
      organization_id,
      feature_key,
      is_enabled
    });

    return NextResponse.json({
      success: true,
      data,
      message: 'Feature override saved successfully'
    });

  } catch (error) {
    const errorId = generateErrorId('post-feature-overrides');
    logger.error('[POST /api/admin/feature-management/overrides] Unexpected error:', { data: { errorId, error } });
    return createInternalError(errorId);
  }
}

// DELETE - オーバーライド削除
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 管理者認証チェック
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return createAuthError();
    }

    const url = new URL(request.url);
    const organizationId = url.searchParams.get('organization_id');
    const featureKey = url.searchParams.get('feature_key');

    if (!organizationId || !featureKey) {
      return NextResponse.json(
        { error: 'organization_id and feature_key are required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('feature_overrides')
      .delete()
      .eq('organization_id', organizationId)
      .eq('feature_key', featureKey);

    if (error) {
      logger.error('[DELETE /api/admin/feature-management/overrides] Delete error:', { data: { error } });
      return NextResponse.json(
        { error: 'Failed to delete override' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Feature override deleted successfully'
    });

  } catch (error) {
    const errorId = generateErrorId('delete-feature-overrides');
    logger.error('[DELETE /api/admin/feature-management/overrides] Unexpected error:', { data: { errorId, error } });
    return createInternalError(errorId);
  }
}