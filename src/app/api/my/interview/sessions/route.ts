/**
 * /api/my/interview/sessions - AIインタビューセッション一覧/作成API
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
import { z } from 'zod';
import { createApiAuthClient, ApiAuthException, ApiAuthFailure } from '@/lib/supabase/api-auth';
import { logger } from '@/lib/utils/logger';
import { validateOrgAccess, OrgAccessError } from '@/lib/utils/org-access';
import type { SessionListResponse, InterviewAnswersJson } from '@/types/interview-session';
import { isFeatureQuotaLimitReached } from '@/lib/featureGate';

const SessionListParamsSchema = z.object({
  organization_id: z.string().uuid().optional(),
  status: z.enum(['draft', 'in_progress', 'completed']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
});

export async function GET(request: NextRequest): Promise<NextResponse<SessionListResponse | ApiAuthFailure>> {
  try {
    const { supabase, user, applyCookies } = await createApiAuthClient(request);

    // URL パラメータの解析
    const { searchParams } = new URL(request.url);
    const rawParams = {
      organization_id: searchParams.get('organization_id') || undefined,
      status: searchParams.get('status') || undefined,
      page: searchParams.get('page') || undefined,
      page_size: searchParams.get('page_size') || undefined,
    };

    // バリデーション
    const validationResult = SessionListParamsSchema.safeParse(rawParams);
    if (!validationResult.success) {
      return applyCookies(NextResponse.json(
        {
          data: [],
          page: 1,
          pageSize: 20,
          total: 0,
        },
        { status: 400 }
      ));
    }

    const { organization_id, status, page, page_size } = validationResult.data;

    // 組織メンバーチェック（organization_id が指定されている場合）
    if (organization_id) {
      try {
        await validateOrgAccess(organization_id, user.id, 'read');
      } catch (error) {
        if (error instanceof OrgAccessError) {
          return applyCookies(NextResponse.json(
            {
              data: [],
              page: 1,
              pageSize: 20,
              total: 0,
            },
            { status: error.statusCode }
          ));
        }
        throw error;
      }
    }

    // クエリベース構築
    let query = supabase
      .from('ai_interview_sessions')
      .select('id, organization_id, user_id, content_type, status, answers, generated_content, meta, created_at, updated_at, version', { count: 'exact' })
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    // フィルター適用
    if (organization_id) {
      query = query.eq('organization_id', organization_id);
    } else {
      // organization_id が指定されていない場合は、自分のセッションのみ
      query = query.eq('user_id', user.id);
    }

    if (status) {
      query = query.eq('status', status);
    }

    // ページング
    const offset = (page - 1) * page_size;
    query = query.range(offset, offset + page_size - 1);

    const { data, error, count } = await query;

    if (error) {
      logger.error('Failed to fetch interview sessions:', error);
      return applyCookies(NextResponse.json(
        {
          data: [],
          page: 1,
          pageSize: page_size,
          total: 0,
        },
        { status: 500 }
      ));
    }

    const response: SessionListResponse = {
      data: data || [],
      page,
      pageSize: page_size,
      total: count || 0,
    };

    return applyCookies(NextResponse.json(response));

  } catch (error) {
    if (error instanceof ApiAuthException) {
      return error.toResponse();
    }

    logger.error('Session list API error:', error);
    return NextResponse.json(
      {
        data: [],
        page: 1,
        pageSize: 20,
        total: 0,
      },
      { status: 500 }
    );
  }
}

// セッション作成（新統一API）
export async function POST(request: NextRequest): Promise<NextResponse<{ success: boolean; sessionId?: string; error?: string; } | ApiAuthFailure>> {
  const requestId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  try {
    const { supabase, user, applyCookies } = await createApiAuthClient(request);

    // リクエストボディ解析
    const body = await request.json();

    // リクエストバリデーションスキーマ
    const createSessionSchema = z.object({
      organizationId: z.string().uuid().nullable().optional(),
      contentType: z.enum(['service', 'product', 'faq', 'case_study'] as [string, ...string[]]),
      questionIds: z.array(z.string().uuid()).min(1, 'At least one question must be selected')
    });

    const validationResult = createSessionSchema.safeParse(body);
    if (!validationResult.success) {
      return applyCookies(NextResponse.json(
        {
          success: false,
          error: `Validation failed: ${validationResult.error.errors.map(e => e.message).join(', ')}`
        },
        { status: 400 }
      ));
    }

    const { organizationId, contentType, questionIds } = validationResult.data;

    // Phase 5-A: AI面接 quota チェック（新しい統一システムを使用）
    if (organizationId) {
      try {
        const quotaLimitReached = await isFeatureQuotaLimitReached(organizationId, 'ai_interview');
        if (quotaLimitReached) {
          logger.warn('[QUOTA] AI interview quota exceeded for session creation', {
            organizationId,
            userId: user.id,
            requestedQuestions: questionIds.length
          });

          return applyCookies(NextResponse.json(
            {
              success: false,
              error: 'quota_exceeded',
              feature: 'ai_interview',
              message: 'AI面接の利用上限に達しています。プランの見直しまたは管理者への連絡をご検討ください。',
            },
            { status: 429 }
          ));
        }

        logger.info('[QUOTA] AI interview quota check passed', {
          organizationId,
          userId: user.id,
          requestedQuestions: questionIds.length
        });
      } catch (quotaError) {
        // fail-open: quota チェック中にエラーが発生した場合はログ出力して処理を続行
        logger.error('[QUOTA] Failed to check ai_interview quota, proceeding with session creation (fail-open)', {
          error: quotaError instanceof Error ? quotaError.message : String(quotaError),
          organizationId,
          userId: user.id
        });
      }
    }

    // セッション作成（新しいJSON構造を使用）
    const initialAnswers: InterviewAnswersJson = {
      questions: []  // 空の配列から開始、質問回答時に順次追加
    };

    const sessionData = {
      organization_id: organizationId,
      user_id: user.id,
      content_type: contentType,
      status: 'draft' as const,
      answers: initialAnswers,  // 新しいJSON構造を使用
      version: 0, // 楽観ロック用
      meta: {
        question_ids: questionIds,
        created_at: new Date().toISOString(),
        request_id: requestId
      }
    };

    const { data: session, error: createError } = await supabase
      .from('ai_interview_sessions')
      .insert([sessionData])
      .select('id')
      .single();

    if (createError) {
      logger.error('Failed to create interview session:', createError);
      return applyCookies(NextResponse.json(
        { success: false, error: 'Failed to create session' },
        { status: 500 }
      ));
    }

    logger.info('Interview session created via unified API', {
      sessionId: session.id,
      userId: user.id,
      organizationId,
      contentType,
      questionCount: questionIds.length
    });

    return applyCookies(NextResponse.json({
      success: true,
      sessionId: session.id
    }));

  } catch (error) {
    if (error instanceof ApiAuthException) {
      return error.toResponse();
    }

    logger.error('Create interview session API error', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        code: 'SESSION_CREATE_ERROR',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
