/**
 * 営業資料管理API
 * プラン制限に基づく営業資料のアップロード・管理
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getFeatureLimit } from '@/lib/org-features';
import { createAuthError, createNotFoundError, createInternalError, generateErrorId } from '@/lib/utils/data-normalization';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

// GET - ユーザー企業の営業資料一覧を取得
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 認証チェック
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return createAuthError();
    }

    // organizationId クエリパラメータ必須チェック
    const url = new URL(request.url);
    const organizationId = url.searchParams.get('organizationId');
    
    if (!organizationId) {
      logger.debug('[my/materials] organizationId parameter required');
      return NextResponse.json({ error: 'organizationId parameter is required' }, { status: 400 });
    }

    // 組織メンバーシップチェック（RLSモデルに準拠）
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('organization_id', organizationId)
      .eq('user_id', authData.user.id)
      .maybeSingle();

    if (membershipError) {
      logger.error('[my/materials] Organization membership check failed', { 
        userId: authData.user.id, 
        organizationId,
        error: membershipError.message 
      });
      return NextResponse.json({ 
        error: 'INTERNAL_ERROR', 
        message: 'メンバーシップ確認に失敗しました' 
      }, { status: 500 });
    }

    if (!membership) {
      logger.warn('[my/materials] User not a member of organization', { 
        userId: authData.user.id, 
        organizationId 
      });
      return NextResponse.json({ 
        error: 'FORBIDDEN', 
        message: 'この組織のメンバーではありません' 
      }, { status: 403 });
    }

    // 営業資料一覧を取得（RLSにより組織メンバーのみアクセス可能）
    const { data, error } = await supabase
      .from('sales_materials')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Database error', { data: error instanceof Error ? error : new Error(String(error)) });
      return NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: data || [] });

  } catch (error) {
    const errorId = generateErrorId('get-materials');
    logger.error('[GET /api/my/materials] Unexpected error:', { data: { errorId, error } });
    return createInternalError(errorId);
  }
}

// POST - 新しい営業資料を作成（プラン制限チェック）
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 認証チェック
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return createAuthError();
    }

    const body = await request.json();

    // 必須フィールドの検証
    if (!body.title || !body.file_path) {
      return NextResponse.json(
        { error: 'Validation error', message: 'Title and file_path are required' },
        { status: 400 }
      );
    }

    // organizationId 必須チェック
    if (!body.organizationId) {
      logger.debug('[my/materials] POST organizationId required');
      return NextResponse.json({ error: 'organizationId is required' }, { status: 400 });
    }

    // 組織メンバーシップチェック（RLSモデルに準拠）
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('organization_id', body.organizationId)
      .eq('user_id', authData.user.id)
      .maybeSingle();

    if (membershipError || !membership) {
      logger.error('[my/materials] POST Organization membership check failed', { 
        userId: authData.user.id, 
        organizationId: body.organizationId,
        error: membershipError?.message 
      });
      return NextResponse.json({ 
        error: 'FORBIDDEN', 
        message: 'この組織のメンバーではありません' 
      }, { status: 403 });
    }

    // 組織情報取得（プラン制限チェック用）
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('id, plan')
      .eq('id', body.organizationId)
      .single();

    if (orgError || !orgData) {
      logger.error('[my/materials] POST Organization data fetch failed', { 
        userId: authData.user.id, 
        organizationId: body.organizationId,
        error: orgError?.message 
      });
      return NextResponse.json({ 
        error: 'INTERNAL_ERROR', 
        message: '組織情報の取得に失敗しました' 
      }, { status: 500 });
    }

    // プラン制限チェック（effective-features使用）
    try {
      const featureLimit = await getFeatureLimit(orgData.id, 'materials');
      
      // null/undefined は無制限扱い
      if (featureLimit !== null && featureLimit !== undefined) {
        const { count: currentCount, error: countError } = await supabase
          .from('sales_materials')
          .select('id', { count: 'exact' })
          .eq('organization_id', orgData.id);

        if (countError) {
          logger.error('Error counting materials:', { data: countError });
          return NextResponse.json(
            { error: 'Database error', message: countError.message },
            { status: 500 }
          );
        }

        if ((currentCount || 0) >= featureLimit) {
          return NextResponse.json(
            {
              error: 'LimitExceeded',
              message: 'ご契約プランの上限に達しています。プランをアップグレードしてください。',
              currentCount,
              limit: featureLimit,
              plan: orgData.plan || 'trial'
            },
            { status: 403 }
          );
        }
      }
    } catch (error) {
      logger.error('Feature limit check failed, allowing creation:', { data: error });
      // TODO: ここは後で要確認 - effective-features エラー時のフォールバック挙動
    }

    // 営業資料データの作成
    const materialData = {
      organization_id: orgData.id,
      title: body.title,
      file_path: body.file_path,
      file_type: body.file_type || null,
      file_size: body.file_size || null,
      uploaded_by: authData.user.id
    };

    const { data, error } = await supabase
      .from('sales_materials')
      .insert([materialData])
      .select()
      .single();

    if (error) {
      logger.error('Database error', { data: error instanceof Error ? error : new Error(String(error)) });
      return NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });

  } catch (error) {
    const errorId = generateErrorId('post-materials');
    logger.error('[POST /api/my/materials] Unexpected error:', { data: { errorId, error } });
    return createInternalError(errorId);
  }
}