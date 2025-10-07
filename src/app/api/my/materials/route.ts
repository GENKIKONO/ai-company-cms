/**
 * 営業資料管理API
 * プラン制限に基づく営業資料のアップロード・管理
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { PLAN_LIMITS, PlanType, getMaterialLimitMessage } from '@/config/plans';
import { createAuthError, createNotFoundError, createInternalError, generateErrorId } from '@/lib/utils/data-normalization';

export const dynamic = 'force-dynamic';

// GET - ユーザー企業の営業資料一覧を取得
export async function GET() {
  try {
    const supabase = await supabaseServer();
    
    // 認証チェック
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return createAuthError();
    }

    // ユーザーの企業IDを取得
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('created_by', authData.user.id)
      .single();

    if (orgError || !orgData) {
      return createNotFoundError('Organization');
    }

    // 営業資料一覧を取得（RLSポリシーにより自動的に自分の企業の資料のみ取得）
    const { data, error } = await supabase
      .from('sales_materials')
      .select('*')
      .eq('organization_id', orgData.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: data || [] });

  } catch (error) {
    const errorId = generateErrorId('get-materials');
    console.error('[GET /api/my/materials] Unexpected error:', { errorId, error });
    return createInternalError(errorId);
  }
}

// POST - 新しい営業資料を作成（プラン制限チェック）
export async function POST(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    
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

    // ユーザーの企業IDとプラン情報を取得
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('id, plan')
      .eq('created_by', authData.user.id)
      .single();

    if (orgError || !orgData) {
      return createNotFoundError('Organization');
    }

    // プラン制限チェック
    const currentPlan = (orgData.plan || 'free') as PlanType;
    const materialLimit = PLAN_LIMITS[currentPlan].materials;
    
    // 無制限以外の場合は制限チェック
    if (materialLimit !== Number.POSITIVE_INFINITY) {
      const { count: currentCount, error: countError } = await supabase
        .from('sales_materials')
        .select('id', { count: 'exact' })
        .eq('organization_id', orgData.id);

      if (countError) {
        console.error('Error counting materials:', countError);
        return NextResponse.json(
          { error: 'Database error', message: countError.message },
          { status: 500 }
        );
      }

      if ((currentCount || 0) >= materialLimit) {
        return NextResponse.json(
          {
            error: 'LimitExceeded',
            message: getMaterialLimitMessage(currentPlan),
            currentCount,
            limit: materialLimit,
            plan: currentPlan
          },
          { status: 403 }
        );
      }
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
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });

  } catch (error) {
    const errorId = generateErrorId('post-materials');
    console.error('[POST /api/my/materials] Unexpected error:', { errorId, error });
    return createInternalError(errorId);
  }
}