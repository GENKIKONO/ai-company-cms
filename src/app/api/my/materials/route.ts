/**
 * /api/my/materials - 営業資料管理API
 *
 * 【認証方式】
 * - createApiAuthClient を使用（統一認証ヘルパー）
 * - getUser() が唯一の Source of Truth
 * - Cookie 同期は applyCookies で行う
 *
 * @see src/lib/supabase/api-auth.ts
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createApiAuthClient, ApiAuthException } from '@/lib/supabase/api-auth';
import { getOrgFeatureLimit as getFeatureLimit } from '@/lib/featureGate';
import { logger } from '@/lib/utils/logger';

// GET - ユーザー企業の営業資料一覧を取得
export async function GET(request: NextRequest) {
  try {
    const { supabase, user, applyCookies, requestId } = await createApiAuthClient(request);

    // organizationId クエリパラメータ必須チェック
    const url = new URL(request.url);
    const organizationId = url.searchParams.get('organizationId');

    if (!organizationId) {
      logger.debug('[my/materials] organizationId parameter required');
      return applyCookies(NextResponse.json({ error: 'organizationId parameter is required' }, { status: 400 }));
    }

    // 組織メンバーシップチェック（RLSモデルに準拠）
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (membershipError) {
      logger.error('[my/materials] Organization membership check failed', {
        userId: user.id,
        organizationId,
        error: membershipError.message
      });
      return applyCookies(NextResponse.json({
        error: 'INTERNAL_ERROR',
        message: 'メンバーシップ確認に失敗しました'
      }, { status: 500 }));
    }

    if (!membership) {
      logger.warn('[my/materials] User not a member of organization', {
        userId: user.id,
        organizationId
      });
      return applyCookies(NextResponse.json({
        error: 'FORBIDDEN',
        message: 'この組織のメンバーではありません'
      }, { status: 403 }));
    }

    // 営業資料取得
    const { data, error } = await supabase
      .from('sales_materials')
      .select('id, organization_id, title, description, file_path, mime_type, size_bytes, is_public, status, created_by, created_at')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('[my/materials] Failed to fetch materials', {
        userId: user.id,
        organizationId,
        error: error.message
      });
      return applyCookies(NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      ));
    }

    return applyCookies(NextResponse.json({ data: data || [] }, { status: 200 }));

  } catch (error) {
    if (error instanceof ApiAuthException) {
      return error.toResponse();
    }

    logger.error('[GET /api/my/materials] Unexpected error', { data: error });
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST - 新しい営業資料を作成
export async function POST(request: NextRequest) {
  try {
    const { supabase, user, applyCookies, requestId } = await createApiAuthClient(request);

    const body = await request.json();

    // 必須フィールドの検証
    if (!body.title || !body.file_path) {
      return applyCookies(NextResponse.json(
        { error: 'Validation error', message: 'Title and file_path are required' },
        { status: 400 }
      ));
    }

    // organizationId 必須チェック
    if (!body.organizationId) {
      logger.debug('[my/materials] POST organizationId required');
      return applyCookies(NextResponse.json({ error: 'organizationId is required' }, { status: 400 }));
    }

    // 組織メンバーシップチェック（RLSモデルに準拠）
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('organization_id', body.organizationId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (membershipError || !membership) {
      logger.error('[my/materials] POST Organization membership check failed', {
        userId: user.id,
        organizationId: body.organizationId,
        error: membershipError?.message
      });
      return applyCookies(NextResponse.json({
        error: 'FORBIDDEN',
        message: 'この組織のメンバーではありません'
      }, { status: 403 }));
    }

    // 組織情報取得（プラン制限チェック用）
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('id, plan')
      .eq('id', body.organizationId)
      .maybeSingle();

    if (orgError || !orgData) {
      logger.error('[my/materials] POST Organization data fetch failed', {
        userId: user.id,
        organizationId: body.organizationId,
        error: orgError?.message
      });
      return applyCookies(NextResponse.json({
        error: 'INTERNAL_ERROR',
        message: '組織情報の取得に失敗しました'
      }, { status: 500 }));
    }

    // プラン制限チェック
    try {
      const featureLimit = await getFeatureLimit(orgData.id, 'materials');

      if (featureLimit !== null && featureLimit !== undefined) {
        const { count: currentCount, error: countError } = await supabase
          .from('sales_materials')
          .select('id', { count: 'exact' })
          .eq('organization_id', orgData.id);

        if (countError) {
          logger.error('[my/materials] Error counting materials', { data: countError });
          return applyCookies(NextResponse.json(
            { error: 'Database error', message: countError.message },
            { status: 500 }
          ));
        }

        if ((currentCount || 0) >= featureLimit) {
          return applyCookies(NextResponse.json(
            {
              error: 'LimitExceeded',
              message: 'ご契約プランの上限に達しています。プランをアップグレードしてください。',
              currentCount,
              limit: featureLimit,
              plan: orgData.plan || 'trial'
            },
            { status: 403 }
          ));
        }
      }
    } catch (error) {
      logger.error('[my/materials] Feature limit check failed, allowing creation', { data: error });
    }

    // 営業資料データの作成
    const materialData = {
      organization_id: orgData.id,
      title: body.title,
      file_path: body.file_path,
      mime_type: body.file_type || body.mime_type || null,
      size_bytes: body.file_size || body.size_bytes || null,
      created_by: user.id
    };

    const { data, error } = await supabase
      .from('sales_materials')
      .insert([materialData])
      .select();

    if (error) {
      logger.error('[my/materials POST] Failed to create material', {
        userId: user.id,
        orgId: orgData.id,
        error: error.message
      });

      // RLS エラーの場合は 403 を返す
      if (error.code === '42501' || error.message?.includes('RLS')) {
        return applyCookies(NextResponse.json({
          error: 'RLS_FORBIDDEN',
          message: 'Row Level Security によって拒否されました'
        }, { status: 403 }));
      }

      return applyCookies(NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      ));
    }

    return applyCookies(NextResponse.json({ data }, { status: 201 }));

  } catch (error) {
    if (error instanceof ApiAuthException) {
      return error.toResponse();
    }

    logger.error('[POST /api/my/materials] Unexpected error', { data: error });
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
