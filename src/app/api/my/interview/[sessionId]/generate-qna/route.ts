/**
 * P2-8: AIインタビューからQ&A生成API
 * POST /api/my/interview/[sessionId]/generate-qna
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireOrgOwner } from '@/lib/api/auth-middleware';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
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
    const resolvedParams = await params;
    sessionId = resolvedParams.sessionId;

    // 認証チェック
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) {
      return authResult; // 認証エラー
    }

    // インタビューデータ取得
    const { session, contentUnits } = await fetchInterviewData(sessionId);

    // 組織アクセスチェック
    const orgAccessError = requireOrgOwner(authResult, session.organization_id);
    if (orgAccessError) {
      return orgAccessError; // 認可エラー
    }

    // Supabase クライアント作成
    const supabase = await createClient();

    // コンテンツの十分性チェック
    if (!session.answers || Object.keys(session.answers).length === 0) {
      const error: GenerateContentError = {
        success: false,
        code: 'INSUFFICIENT_CONTENT',
        message: 'Interview session has no answers to generate content from'
      };
      return NextResponse.json(error, { status: 400 });
    }

    // 生成ジョブ作成
    jobId = await createGenerationJob(session.organization_id, sessionId, 'qna');
    
    // プロンプト生成
    const prompt = generatePrompt('qna', session, contentUnits);
    
    // OpenAI呼び出し
    const { generatedText, usage } = await generateContentWithOpenAI(prompt);
    const cost = calculateOpenAICost(usage);

    // 生成テキストを解析
    const parsedContent = parseGeneratedContent(generatedText, 'qna');
    
    // バリデーション
    if (!parsedContent.title || !parsedContent.content) {
      throw new Error('Generated Q&A content is incomplete');
    }

    // コンテンツ保存
    const contentId = await saveGeneratedContent({
      ...parsedContent,
      contentType: 'qna',
      sessionId,
      orgId: session.organization_id
    });

    // リンク作成
    await createContentLinks(contentId, 'qna', sessionId, contentUnits);

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
          contentType: 'qna',
          tableName: 'qa_entries'
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

    logger.info('Q&A generation completed successfully', {
      sessionId,
      contentId,
      jobId,
      orgId: session.organization_id,
      cost,
      usage,
      processingTime: Date.now() - startTime
    });

    return NextResponse.json(response);

  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    
    logger.error('Q&A generation failed', {
      error: error.message,
      sessionId: sessionId,
      jobId,
      processingTime,
      stack: error.stack
    });

    // ジョブにエラー記録
    if (jobId) {
      try {
        await updateGenerationJob(jobId, {
          error_message: error.message,
          meta: {
            failed_at: new Date().toISOString(),
            processing_time_ms: processingTime,
            error_details: error.stack
          }
        });
      } catch (updateError) {
        logger.error('Failed to update job with error', { updateError });
      }
    }

    // エラーレスポンス
    let errorCode: string = 'GENERATION_ERROR';
    let statusCode = 500;

    if (error.message.includes('Session not found')) {
      errorCode = 'SESSION_NOT_FOUND';
      statusCode = 404;
    } else if (error.message.includes('OpenAI')) {
      errorCode = 'OPENAI_ERROR';
    } else if (error.message.includes('save content')) {
      errorCode = 'CONTENT_SAVE_ERROR';
    }

    const errorResponse: GenerateContentError = {
      success: false,
      code: errorCode,
      message: error.message,
      details: {
        job_id: jobId || undefined,
        openai_error: error.message.includes('OpenAI') ? error.message : undefined
      }
    };

    return NextResponse.json(errorResponse, { status: statusCode });
  }
}