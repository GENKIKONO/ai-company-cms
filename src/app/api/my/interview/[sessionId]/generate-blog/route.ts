/**
 * /api/my/interview/[sessionId]/generate-blog - AIインタビューからブログ生成API
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
import { logger } from '@/lib/utils/logger';
import { validateOrgAccess, OrgAccessError } from '@/lib/utils/org-access';
import {
  fetchInterviewData,
  generatePrompt,
  generateContentWithOpenAI,
  parseGeneratedContent,
  createGenerationJob,
  updateGenerationJob,
  saveGeneratedContent,
  createContentLinks,
  calculateOpenAICost
} from '@/lib/interview-generation';
import type {
  GenerateContentApiResponse,
  GenerateContentError
} from '@/types/interview-generated';

interface RouteParams {
  params: Promise<{
    sessionId: string;
  }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const startTime = Date.now();
  let jobId: string | null = null;
  let sessionId: string = 'unknown';

  try {
    const { supabase, user, applyCookies } = await createApiAuthClient(request);

    const resolvedParams = await params;
    sessionId = resolvedParams.sessionId;

    // インタビューデータ取得
    const { session, contentUnits } = await fetchInterviewData(sessionId);

    // 組織アクセスチェック
    if (session.organization_id) {
      try {
        await validateOrgAccess(session.organization_id, user.id, 'write');
      } catch (error) {
        if (error instanceof OrgAccessError) {
          return applyCookies(NextResponse.json({
            success: false,
            code: error.code,
            message: error.message
          } as GenerateContentError, { status: error.statusCode }));
        }
        throw error;
      }
    } else {
      // 組織に属さないセッションの場合、作成者本人のみアクセス可能
      if (session.user_id !== user.id) {
        return applyCookies(NextResponse.json({
          success: false,
          code: 'FORBIDDEN',
          message: 'Access denied'
        } as GenerateContentError, { status: 403 }));
      }
    }

    // コンテンツの十分性チェック
    if (!session.answers || Object.keys(session.answers).length === 0) {
      const error: GenerateContentError = {
        success: false,
        code: 'INSUFFICIENT_CONTENT',
        message: 'Interview session has no answers to generate content from'
      };
      return applyCookies(NextResponse.json(error, { status: 400 }));
    }

    // 生成ジョブ作成
    jobId = await createGenerationJob(session.organization_id, sessionId, 'blog');

    // プロンプト生成
    const prompt = generatePrompt('blog', session, contentUnits);

    // OpenAI呼び出し
    const { generatedText, usage } = await generateContentWithOpenAI(prompt);
    const cost = calculateOpenAICost(usage);

    // 生成テキストを解析
    const parsedContent = parseGeneratedContent(generatedText, 'blog');

    // バリデーション
    if (!parsedContent.title || !parsedContent.content) {
      throw new Error('Generated content is incomplete');
    }

    // コンテンツ保存
    const contentId = await saveGeneratedContent({
      ...parsedContent,
      contentType: 'blog',
      sessionId,
      orgId: session.organization_id
    });

    // リンク作成
    await createContentLinks(contentId, 'blog', sessionId, contentUnits);

    // ジョブ完了更新
    await updateGenerationJob(jobId, {
      target_content_id: contentId,
      openai_calls: 1,
      cost_usd: cost,
      meta: {
        completed_at: new Date().toISOString(),
        generation_time_ms: Date.now() - startTime,
        usage: usage
      }
    });

    // 成功レスポンス
    const response: GenerateContentApiResponse = {
      success: true,
      data: {
        content: {
          id: contentId,
          title: parsedContent.title!,
          content: parsedContent.content!,
          summary: parsedContent.summary,
          slug: parsedContent.slug!,
          contentType: 'blog',
          tableName: 'posts'
        },
        job: {
          id: jobId,
          openai_calls: 1,
          cost_usd: cost
        },
        content_units: {
          linked_count: Math.min(contentUnits.length, 5),
          source_units: contentUnits
            .sort((a, b) => (b.visibility_score || 0) - (a.visibility_score || 0))
            .slice(0, 5)
            .map(unit => ({
              unit_id: unit.id,
              section_key: unit.section_key,
              title: unit.title,
              visibility_score: unit.visibility_score
            }))
        }
      }
    };

    logger.info('Blog generation completed successfully', {
      sessionId,
      contentId,
      jobId,
      orgId: session.organization_id,
      cost,
      usage,
      processingTime: Date.now() - startTime
    });

    return applyCookies(NextResponse.json(response));

  } catch (error: any) {
    if (error instanceof ApiAuthException) {
      return error.toResponse();
    }

    const processingTime = Date.now() - startTime;

    logger.error('Blog generation failed', {
      data: error instanceof Error ? error : new Error(String(error)),
      sessionId: sessionId,
      jobId,
      processingTime
    });

    // ジョブにエラー記録（内部用のみスタックトレースを保持）
    if (jobId) {
      try {
        await updateGenerationJob(jobId, {
          error_message: error.message,
          meta: {
            failed_at: new Date().toISOString(),
            processing_time_ms: processingTime
          }
        });
      } catch (updateError) {
        logger.error('Failed to update job with error', { updateError });
      }
    }

    // エラーレスポンス
    let errorCode: string = 'GENERATION_ERROR';
    let statusCode = 500;
    let userMessage = 'ブログ生成中にエラーが発生しました';

    if (error.message.includes('Session not found')) {
      errorCode = 'SESSION_NOT_FOUND';
      statusCode = 404;
      userMessage = 'セッションが見つかりません';
    } else if (error.message.includes('OpenAI')) {
      errorCode = 'OPENAI_ERROR';
      userMessage = 'AI処理中にエラーが発生しました';
    } else if (error.message.includes('save content')) {
      errorCode = 'CONTENT_SAVE_ERROR';
      userMessage = 'コンテンツの保存に失敗しました';
    }

    const errorResponse: GenerateContentError = {
      success: false,
      code: errorCode,
      message: userMessage,
      details: {
        job_id: jobId || undefined
      }
    };

    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
