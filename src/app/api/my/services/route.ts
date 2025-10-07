// Single-Org Mode API: /api/my/services
// ユーザーの企業のサービスを管理するためのAPI
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import type { Service, ServiceFormData } from '@/types/database';
import { normalizeServicePayload, createAuthError, createNotFoundError, createInternalError, generateErrorId } from '@/lib/utils/data-normalization';
import { PLAN_LIMITS, PlanType, getServiceLimitMessage } from '@/config/plans';

// エラーログ送信関数（失敗しても無視）
async function logErrorToDiag(errorInfo: any) {
  try {
    await fetch('/api/diag/ui', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'server_error',
        ...errorInfo
      }),
      cache: 'no-store'
    });
  } catch {
    // 診断ログ送信失敗は無視
  }
}

export const dynamic = 'force-dynamic';

// GET - ユーザー企業のサービス一覧を取得
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

    // サービス一覧を取得（RLSポリシーにより自動的に自分の企業のサービスのみ取得）
    const { data, error } = await supabase
      .from('services')
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
    const errorId = generateErrorId('get-services');
    console.error('[GET /api/my/services] Unexpected error:', { errorId, error });
    
    // エラーログを診断APIに送信
    logErrorToDiag({
      errorId,
      endpoint: 'GET /api/my/services',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    
    return createInternalError(errorId);
  }
}

// POST - 新しいサービスを作成
export async function POST(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    
    // 認証チェック
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return createAuthError();
    }

    const body: ServiceFormData = await request.json();

    // 必須フィールドの検証
    if (!body.name) {
      return NextResponse.json(
        { error: 'Validation error', message: 'Name is required' },
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
    const serviceLimit = PLAN_LIMITS[currentPlan].services;
    
    // 無制限以外の場合は制限チェック
    if (serviceLimit !== Number.POSITIVE_INFINITY) {
      const { count: currentCount, error: countError } = await supabase
        .from('services')
        .select('id', { count: 'exact' })
        .eq('organization_id', orgData.id);

      if (countError) {
        console.error('Error counting services:', countError);
        return NextResponse.json(
          { error: 'Database error', message: countError.message },
          { status: 500 }
        );
      }

      if ((currentCount || 0) >= serviceLimit) {
        return NextResponse.json(
          {
            error: 'LimitExceeded',
            message: getServiceLimitMessage(currentPlan),
            currentCount,
            limit: serviceLimit,
            plan: currentPlan
          },
          { status: 403 }
        );
      }
    }

    // データの正規化
    const normalizedData = normalizeServicePayload(body);

    // サービスデータの作成
    const serviceData = {
      ...normalizedData,
      organization_id: orgData.id,
    };

    const { data, error } = await supabase
      .from('services')
      .insert([serviceData])
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
    const errorId = generateErrorId('post-services');
    console.error('[POST /api/my/services] Unexpected error:', { errorId, error });
    
    // エラーログを診断APIに送信
    logErrorToDiag({
      errorId,
      endpoint: 'POST /api/my/services',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    
    return createInternalError(errorId);
  }
}