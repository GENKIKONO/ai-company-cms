/**
 * P2-8: AIインタビューからケーススタディ生成API
 * POST /api/my/interview/[sessionId]/generate-case-study
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
    jobId = await createGenerationJob(session.organization_id, sessionId, 'case_study');
    
    // プロンプト生成
    const prompt = generatePrompt('case_study', session, contentUnits);
    
    // OpenAI呼び出し
    const { generatedText, usage } = await generateContentWithOpenAI(prompt);
    const cost = calculateOpenAICost(usage);

    // 生成テキストを解析
    const parsedContent = parseGeneratedContent(generatedText, 'case_study');
    
    // バリデーション
    if (!parsedContent.title || !parsedContent.content) {
      throw new Error('Generated case study content is incomplete');
    }

    // コンテンツ保存
    const contentId = await saveGeneratedContent({
      ...parsedContent,
      contentType: 'case_study',
      sessionId,
      orgId: session.organization_id
    });

    // リンク作成
    await createContentLinks(contentId, 'case_study', sessionId, contentUnits);

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
          contentType: 'case_study',
          tableName: 'case_studies'
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

    logger.info('Case study generation completed successfully', {
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

    logger.error('Case study generation failed', {
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
    let userMessage = 'ケーススタディ生成中にエラーが発生しました';

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