/**
 * ヒアリング代行依頼API
 * POST /api/hearing-requests
 * 
 * 機能:
 * - 企業ヒアリング代行依頼の受付
 * - 認証済みユーザーのみアクセス可能
 * - 依頼者の組織所有チェック
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ヒアリング依頼データのバリデーションスキーマ
const hearingRequestSchema = z.object({
  organization_id: z.string().uuid('有効な組織IDを指定してください'),
  purpose: z.string()
    .min(10, '依頼目的は10文字以上で入力してください')
    .max(1000, '依頼目的は1000文字以内で入力してください'),
  preferred_date: z.string().optional(),
  contact_email: z.string().email('有効なメールアドレスを入力してください').optional().or(z.literal('')),
  
  // ヒアリング項目（少なくとも1つは必須）
  business_overview: z.boolean(),
  service_details: z.boolean(),
  case_studies: z.boolean(),
  competitive_advantage: z.boolean(),
  target_market: z.boolean(),
}).refine(
  (data) => data.business_overview || data.service_details || data.case_studies || 
           data.competitive_advantage || data.target_market,
  { message: 'ヒアリング項目を1つ以上選択してください' }
);

export async function POST(request: NextRequest) {
  try {
    // Supabaseクライアント初期化
    const supabase = await supabaseServer();

    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'ログインが必要です' },
        { status: 401 }
      );
    }

    // リクエスト本文の取得とバリデーション
    const rawBody = await request.json();
    let validatedData;
    
    try {
      validatedData = hearingRequestSchema.parse(rawBody);
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

    // 組織の存在確認と所有者チェック
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, created_by')
      .eq('id', validatedData.organization_id)
      .single();

    if (orgError || !organization) {
      return NextResponse.json(
        {
          error: 'ORGANIZATION_NOT_FOUND',
          message: '指定された組織が見つかりません'
        },
        { status: 404 }
      );
    }

    // 依頼者が組織の所有者かチェック
    if (organization.created_by !== user.id) {
      return NextResponse.json(
        {
          error: 'FORBIDDEN',
          message: 'この組織のヒアリング依頼を行う権限がありません'
        },
        { status: 403 }
      );
    }

    // ヒアリング依頼データをDBに保存
    const hearingRequestData = {
      organization_id: validatedData.organization_id,
      requester_id: user.id,
      purpose: validatedData.purpose,
      preferred_date: validatedData.preferred_date || null,
      contact_email: validatedData.contact_email || null,
      business_overview: validatedData.business_overview,
      service_details: validatedData.service_details,
      case_studies: validatedData.case_studies,
      competitive_advantage: validatedData.competitive_advantage,
      target_market: validatedData.target_market,
      status: 'pending',
    };

    const { data: hearingRequest, error: insertError } = await supabase
      .from('hearing_requests')
      .insert([hearingRequestData])
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      return NextResponse.json(
        {
          error: 'DATABASE_ERROR',
          message: 'ヒアリング依頼の保存に失敗しました。しばらく後に再度お試しください。'
        },
        { status: 500 }
      );
    }

    // 成功レスポンス
    return NextResponse.json(
      {
        message: 'ヒアリング依頼を受け付けました。担当者より3営業日以内にご連絡いたします。',
        request_id: hearingRequest.id,
        organization_name: organization.name,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Hearing request API error:', error);
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: '内部エラーが発生しました。しばらく後に再度お試しください。'
      },
      { status: 500 }
    );
  }
}

// GET request support (ユーザーの依頼一覧取得)
export async function GET(request: NextRequest) {
  try {
    // Supabaseクライアント初期化
    const supabase = await supabaseServer();

    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'ログインが必要です' },
        { status: 401 }
      );
    }

    // ユーザーのヒアリング依頼一覧を取得
    const { data: hearingRequests, error: fetchError } = await supabase
      .from('hearing_requests')
      .select(`
        id,
        status,
        purpose,
        preferred_date,
        created_at,
        updated_at,
        organizations (
          id,
          name
        )
      `)
      .eq('requester_id', user.id)
      .order('created_at', { ascending: false });

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

    return NextResponse.json({
      hearing_requests: hearingRequests || [],
    });

  } catch (error) {
    console.error('Hearing request GET API error:', error);
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: '内部エラーが発生しました。'
      },
      { status: 500 }
    );
  }
}