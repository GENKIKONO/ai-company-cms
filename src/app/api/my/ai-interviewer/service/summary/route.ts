/**
 * AIインタビュアー - サービス要約生成API
 * POST /api/my/ai-interviewer/service/summary
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth/server';
import { generateServiceInterviewSummary } from '@/lib/ai/llm-client';
import { logger } from '@/lib/log';

// リクエスト型定義
export interface ServiceInterviewSummaryRequest {
  answers: { [questionId: string]: string };
}

// レスポンス型定義
export interface ServiceInterviewSummaryResponse {
  ok: boolean;
  summaryText?: string;
  errorMessage?: string;
}

export async function POST(request: NextRequest) {
  try {
    // 1. 認証チェック
    const user = await getServerUser();
    if (!user) {
      logger.warn('Unauthorized access to AI interviewer summary API', {
        component: 'ai-interviewer-api',
        ip: request.headers.get('x-forwarded-for') || 'unknown'
      });
      
      return NextResponse.json(
        { 
          ok: false, 
          errorMessage: 'Authentication required' 
        } satisfies ServiceInterviewSummaryResponse,
        { status: 401 }
      );
    }

    // 2. リクエストボディの解析
    const body: ServiceInterviewSummaryRequest = await request.json();
    
    if (!body.answers || typeof body.answers !== 'object') {
      logger.warn('Invalid request body for AI interviewer summary', {
        component: 'ai-interviewer-api',
        userId: user.id,
        bodyKeys: Object.keys(body || {})
      });
      
      return NextResponse.json(
        { 
          ok: false, 
          errorMessage: 'Invalid request format' 
        } satisfies ServiceInterviewSummaryResponse,
        { status: 400 }
      );
    }

    // 3. 回答数の基本チェック
    const answersCount = Object.keys(body.answers).length;
    if (answersCount === 0) {
      return NextResponse.json(
        { 
          ok: false, 
          errorMessage: '回答が入力されていません。質問にお答えください。' 
        } satisfies ServiceInterviewSummaryResponse,
        { status: 400 }
      );
    }

    logger.info('AI interviewer summary generation started', {
      component: 'ai-interviewer-api',
      userId: user.id,
      userEmail: user.email,
      answersCount
    });

    // 4. LLMによる要約生成
    const summaryResult = await generateServiceInterviewSummary({
      answers: body.answers,
      userId: user.id
    });

    // 5. レスポンス返却
    if (summaryResult.success) {
      logger.info('AI interviewer summary generated successfully', {
        component: 'ai-interviewer-api',
        userId: user.id,
        summaryLength: summaryResult.summaryText?.length || 0
      });

      return NextResponse.json(
        { 
          ok: true, 
          summaryText: summaryResult.summaryText 
        } satisfies ServiceInterviewSummaryResponse
      );
    } else {
      logger.warn('AI interviewer summary generation failed', {
        component: 'ai-interviewer-api',
        userId: user.id,
        error: summaryResult.error
      });

      return NextResponse.json(
        { 
          ok: false, 
          errorMessage: summaryResult.error || 'AI要約の生成に失敗しました' 
        } satisfies ServiceInterviewSummaryResponse,
        { status: 500 }
      );
    }

  } catch (error) {
    logger.error('Unexpected error in AI interviewer summary API', {
      component: 'ai-interviewer-api',
      data: error instanceof Error ? error : new Error(String(error))
    });

    return NextResponse.json(
      {
        ok: false,
        errorMessage: 'Internal server error'
      } satisfies ServiceInterviewSummaryResponse,
      { status: 500 }
    );
  }
}

// 他のHTTPメソッドは405を返す
export async function GET() {
  return NextResponse.json(
    { ok: false, errorMessage: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { ok: false, errorMessage: 'Method not allowed' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { ok: false, errorMessage: 'Method not allowed' },
    { status: 405 }
  );
}