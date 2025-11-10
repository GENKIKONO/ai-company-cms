/* eslint-disable no-console */
/**
 * Feature Management Admin API
 * プラン機能設定の管理
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { createAuthError, createInternalError, generateErrorId } from '@/lib/utils/data-normalization';
import { logger } from '@/lib/utils/logger';
import { FeatureManagementGetResponse, FeatureManagementUpdateRequest, FeatureManagementUpdateResponse } from '@/types/feature-management';

export const dynamic = 'force-dynamic';

// GET - 機能レジストリとプラン設定を取得
export async function GET() {
  try {
    const supabase = await supabaseServer();
    
    // 管理者認証チェック（テスト用に一時無効化）
    // const { data: authData, error: authError } = await supabase.auth.getUser();
    // if (authError || !authData.user) {
    //   return createAuthError();
    // }

    // feature_registry 取得
    const { data: features, error: featuresError } = await supabase
      .from('feature_registry')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('display_name', { ascending: true });

    if (featuresError) {
      logger.error('Error fetching features:', featuresError);
      return NextResponse.json(
        { error: 'Database error', message: featuresError.message },
        { status: 500 }
      );
    }

    // plan_features 取得
    const { data: planFeatures, error: planFeaturesError } = await supabase
      .from('plan_features')
      .select('*')
      .order('plan_type', { ascending: true })
      .order('feature_key', { ascending: true });

    if (planFeaturesError) {
      logger.error('Error fetching plan features:', planFeaturesError);
      return NextResponse.json(
        { error: 'Database error', message: planFeaturesError.message },
        { status: 500 }
      );
    }

    const response: FeatureManagementGetResponse = {
      features: features || [],
      planFeatures: planFeatures || [],
    };

    return NextResponse.json(response);

  } catch (error) {
    const errorId = generateErrorId('get-feature-management');
    logger.error('[GET /api/admin/feature-management] Unexpected error:', { errorId, error });
    return createInternalError(errorId);
  }
}

// POST - プラン機能設定を一括更新
export async function POST(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    
    // 管理者認証チェック（テスト用に一時無効化）
    // const { data: authData, error: authError } = await supabase.auth.getUser();
    // if (authError || !authData.user) {
    //   return createAuthError();
    // }

    const body: FeatureManagementUpdateRequest = await request.json();

    // バリデーション
    if (!body.updates || !Array.isArray(body.updates)) {
      return NextResponse.json(
        { error: 'Validation error', message: 'updates array is required' },
        { status: 400 }
      );
    }

    // 現在の設定を取得（audit log用）
    const { data: currentSettings, error: currentError } = await supabase
      .from('plan_features')
      .select('*');

    if (currentError) {
      logger.error('Error fetching current settings:', currentError);
      return NextResponse.json(
        { error: 'Database error', message: currentError.message },
        { status: 500 }
      );
    }

    // 一括更新実行
    let updatedCount = 0;
    
    for (const update of body.updates) {
      const { data, error } = await supabase
        .from('plan_features')
        .upsert({
          plan_type: update.plan_type,
          feature_key: update.feature_key,
          config_value: update.config_value,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'plan_type,feature_key'
        });

      if (error) {
        logger.error('Error updating plan feature:', error);
        return NextResponse.json(
          { error: 'Database error', message: error.message },
          { status: 500 }
        );
      }

      updatedCount++;
    }

    // audit log 記録
    const auditLogData = {
      action: 'update_plan_features',
      target_type: 'plan_features',
      user_id: 'test-user', // authData.user.id,
      before_state: currentSettings,
      after_state: body.updates,
      metadata: {
        updated_count: updatedCount,
        timestamp: new Date().toISOString(),
      },
    };

    const { data: auditLog, error: auditError } = await supabase
      .from('audit_logs')
      .insert([auditLogData])
      .select('id')
      .single();

    if (auditError) {
      logger.error('Error creating audit log:', auditError);
      // audit log失敗は警告として扱い、メイン処理は継続
    }

    const response: FeatureManagementUpdateResponse = {
      success: true,
      updated_count: updatedCount,
      audit_log_id: auditLog?.id || 'unknown',
    };

    return NextResponse.json(response);

  } catch (error) {
    const errorId = generateErrorId('post-feature-management');
    logger.error('[POST /api/admin/feature-management] Unexpected error:', { errorId, error });
    return createInternalError(errorId);
  }
}