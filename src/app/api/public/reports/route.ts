/**
 * 公開通報API
 * POST /api/public/reports
 * 
 * 機能:
 * - 組織コンテンツの不適切な内容を通報
 * - スパム防止機能（IP制限、レート制限）
 * - 匿名通報対応
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 通報データのバリデーションスキーマ
const reportSchema = z.object({
  organization_id: z.string().uuid('有効な組織IDを指定してください'),
  report_type: z.enum([
    'inappropriate_content',
    'fake_information', 
    'spam',
    'copyright_violation',
    'harassment',
    'other'
  ], { errorMap: () => ({ message: '有効な通報理由を選択してください' }) }),
  description: z.string()
    .min(10, '詳細説明は10文字以上で入力してください')
    .max(1000, '詳細説明は1000文字以内で入力してください'),
  reported_url: z.string().url('有効なURLを指定してください').optional(),
});

// スパム防止: 同一IPからの連続通報制限（1時間に3回まで）
const reportLimits = new Map<string, { count: number; lastReport: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const hourAgo = now - 60 * 60 * 1000; // 1時間前
  
  const current = reportLimits.get(ip);
  if (!current) {
    reportLimits.set(ip, { count: 1, lastReport: now });
    return true;
  }
  
  // 1時間経過していればリセット
  if (current.lastReport < hourAgo) {
    reportLimits.set(ip, { count: 1, lastReport: now });
    return true;
  }
  
  // 制限内かチェック
  if (current.count >= 3) {
    return false;
  }
  
  // カウント増加
  current.count++;
  current.lastReport = now;
  return true;
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (cfConnectingIP) return cfConnectingIP;
  if (realIP) return realIP;
  if (forwarded) return forwarded.split(',')[0].trim();
  
  return 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    // リクエスト本文の取得とバリデーション
    const rawBody = await request.json();
    let validatedData;
    
    try {
      validatedData = reportSchema.parse(rawBody);
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

    // スパム防止: IP制限チェック
    const clientIP = getClientIP(request);
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json(
        {
          error: 'RATE_LIMIT_EXCEEDED',
          message: '通報の送信頻度が高すぎます。しばらく時間をおいてから再度お試しください。'
        },
        { status: 429 }
      );
    }

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

    // 組織の存在確認
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, status')
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

    // 通報データをDBに保存
    const reportData = {
      organization_id: validatedData.organization_id,
      report_type: validatedData.report_type,
      description: validatedData.description,
      reported_url: validatedData.reported_url,
      reporter_ip: clientIP,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    const { data: report, error: insertError } = await supabase
      .from('reports')
      .insert([reportData])
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      return NextResponse.json(
        {
          error: 'DATABASE_ERROR',
          message: '通報の保存に失敗しました。しばらく後に再度お試しください。'
        },
        { status: 500 }
      );
    }

    // 成功レスポンス
    return NextResponse.json(
      {
        message: '通報を受け付けました。ご報告いただきありがとうございます。',
        report_id: report.id,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Report API error:', error);
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: '内部エラーが発生しました。しばらく後に再度お試しください。'
      },
      { status: 500 }
    );
  }
}

// OPTIONS request support (CORS preflight)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    }
  });
}