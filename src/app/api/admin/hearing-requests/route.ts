/**
 * 管理者ヒアリング依頼API
 * GET /api/admin/hearing-requests
 * PUT /api/admin/hearing-requests/[id]
 * 
 * 機能:
 * - 管理者による全ヒアリング依頼の閲覧
 * - ヒアリング依頼のステータス更新・管理
 * - 管理者権限チェック
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 管理者権限チェック関数
async function checkAdminPermission(supabase: any) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { error: 'UNAUTHORIZED', message: 'ログインが必要です', status: 401 };
  }

  // 管理者権限チェック
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userError || !userData || userData.role !== 'admin') {
    return { error: 'FORBIDDEN', message: '管理者権限が必要です', status: 403 };
  }

  return { user, userData };
}

// GET: 全ヒアリング依頼一覧取得
export async function GET(request: NextRequest) {
  try {
    // Supabaseクライアント初期化
    const cookieStore = await cookies();
    const supabase = createServerClient(
      env.SUPABASE_URL,
      env.SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch (error) {
              // Server Component での cookie 設定エラーをハンドル
            }
          },
        },
      }
    );

    // 管理者権限チェック
    const authResult = await checkAdminPermission(supabase);
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error, message: authResult.message },
        { status: authResult.status }
      );
    }

    // URLパラメータの取得
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // クエリ構築
    let query = supabase
      .from('hearing_requests')
      .select(`
        id,
        status,
        purpose,
        preferred_date,
        contact_phone,
        contact_email,
        business_overview,
        service_details,
        case_studies,
        competitive_advantage,
        target_market,
        assigned_to,
        scheduled_at,
        completed_at,
        admin_notes,
        interview_summary,
        deliverables_url,
        created_at,
        updated_at,
        organizations (
          id,
          name
        ),
        users:requester_id (
          email
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // ステータスフィルター適用
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: hearingRequests, error: fetchError } = await query;

    if (fetchError) {
      console.error('Database fetch error:', fetchError);
      return NextResponse.json(
        {
          error: 'DATABASE_ERROR',
          message: 'ヒアリング依頼の取得に失敗しました。'
        },
        { status: 500 }
      );
    }

    // 統計情報も取得
    const { data: stats, error: statsError } = await supabase
      .from('hearing_requests')
      .select('status')
      .then(result => {
        if (result.error) return result;
        
        const statusCounts = (result.data || []).reduce((acc: any, item: any) => {
          acc[item.status] = (acc[item.status] || 0) + 1;
          return acc;
        }, {});

        return {
          data: {
            total: result.data?.length || 0,
            pending: statusCounts.pending || 0,
            in_progress: statusCounts.in_progress || 0,
            completed: statusCounts.completed || 0,
            cancelled: statusCounts.cancelled || 0,
          },
          error: null
        };
      });

    return NextResponse.json({
      hearing_requests: hearingRequests || [],
      stats: stats || {
        total: 0,
        pending: 0,
        in_progress: 0,
        completed: 0,
        cancelled: 0,
      },
      pagination: {
        limit,
        offset,
        total: hearingRequests?.length || 0,
      }
    });

  } catch (error) {
    console.error('Admin hearing requests GET API error:', error);
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: '内部エラーが発生しました。'
      },
      { status: 500 }
    );
  }
}

// ヒアリング依頼更新のバリデーションスキーマ
const updateHearingRequestSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
  assigned_to: z.string().uuid().optional(),
  scheduled_at: z.string().datetime().optional(),
  completed_at: z.string().datetime().optional(),
  admin_notes: z.string().max(2000).optional(),
  interview_summary: z.string().max(5000).optional(),
  deliverables_url: z.string().url().optional(),
});

// PUT: ヒアリング依頼更新
export async function PUT(request: NextRequest) {
  try {
    // Supabaseクライアント初期化
    const cookieStore = await cookies();
    const supabase = createServerClient(
      env.SUPABASE_URL,
      env.SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch (error) {
              // Server Component での cookie 設定エラーをハンドル
            }
          },
        },
      }
    );

    // 管理者権限チェック
    const authResult = await checkAdminPermission(supabase);
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error, message: authResult.message },
        { status: authResult.status }
      );
    }

    // リクエスト本文の取得とバリデーション
    const rawBody = await request.json();
    const { id, ...updateData } = rawBody;

    if (!id) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'ヒアリング依頼IDが必要です' },
        { status: 400 }
      );
    }

    let validatedData;
    try {
      validatedData = updateHearingRequestSchema.parse(updateData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: 'VALIDATION_ERROR',
            message: error.errors[0].message,
            details: error.errors
          },
          { status: 400 }
        );
      }
      throw error;
    }

    // ヒアリング依頼の存在確認
    const { data: existingRequest, error: fetchError } = await supabase
      .from('hearing_requests')
      .select('id, status')
      .eq('id', id)
      .single();

    if (fetchError || !existingRequest) {
      return NextResponse.json(
        {
          error: 'NOT_FOUND',
          message: '指定されたヒアリング依頼が見つかりません'
        },
        { status: 404 }
      );
    }

    // 更新データを準備
    const updatePayload = {
      ...validatedData,
      updated_at: new Date().toISOString(),
    };

    // ステータス更新時の自動フィールド設定
    if (validatedData.status === 'completed' && !validatedData.completed_at) {
      updatePayload.completed_at = new Date().toISOString();
    }

    // データベース更新
    const { data: updatedRequest, error: updateError } = await supabase
      .from('hearing_requests')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Database update error:', updateError);
      return NextResponse.json(
        {
          error: 'DATABASE_ERROR',
          message: 'ヒアリング依頼の更新に失敗しました。'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'ヒアリング依頼を更新しました。',
      hearing_request: updatedRequest,
    });

  } catch (error) {
    console.error('Admin hearing requests PUT API error:', error);
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: '内部エラーが発生しました。'
      },
      { status: 500 }
    );
  }
}