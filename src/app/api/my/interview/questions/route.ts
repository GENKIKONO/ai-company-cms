/**
 * /api/my/interview/questions - Interview質問UI拡張API
 *
 * 軸ごとのグルーピング / キーワード連動機能
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
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  InterviewQuestionsResponse,
  AxisGroup,
  InterviewQuestionItem,
  InterviewContentType
} from '@/types/interview';

// =====================================================
// TYPE DEFINITIONS
// =====================================================

/** キーワード行 */
interface KeywordRow {
  keyword: string;
}

/** 質問軸行 */
interface AxisRow {
  id: string;
  code: string;
  label_ja: string;
  label_en: string;
  description_ja?: string;
  description_en?: string;
  sort_order: number;
  is_active: boolean;
}

/** 質問行 */
interface QuestionRow {
  id: string;
  axis_id: string;
  question_text: string;
  keywords: string[] | null;
  sort_order: number;
  content_type: string;
  lang: string;
  is_active: boolean;
}

/**
 * 有効なcontent_typeかチェック
 */
function isValidContentType(contentType: string): contentType is InterviewContentType {
  const validTypes: InterviewContentType[] = [
    'service', 'product', 'company', 'post', 'other'
  ];
  return validTypes.includes(contentType as InterviewContentType);
}

/**
 * 組織キーワードを取得
 */
async function fetchOrgKeywords(
  supabase: SupabaseClient,
  orgId: string,
  lang: string
): Promise<string[]> {
  const { data: keywords, error } = await supabase
    .from('organization_keywords')
    .select('keyword')
    .eq('organization_id', orgId)
    .eq('is_active', true)
    .in('locale', [lang, null]); // 指定言語またはnull（共通）

  if (error) {
    logger.warn('Failed to fetch organization keywords', { error: error.message, orgId });
    return [];
  }

  return (keywords as KeywordRow[] | null)?.map((k) => k.keyword.toLowerCase()) ?? [];
}

/**
 * 質問軸と質問を取得
 */
async function fetchQuestionsWithAxes(
  supabase: SupabaseClient,
  contentType: InterviewContentType,
  lang: string
): Promise<{ axes: AxisRow[]; questions: QuestionRow[] }> {
  // 1. 質問軸を取得
  const { data: axes, error: axesError } = await supabase
    .from('ai_interview_axes')
    .select('id, code, label_ja, label_en, description_ja, description_en, sort_order, is_active')
    .eq('is_active', true)
    .order('sort_order');

  if (axesError) {
    throw new Error(`Failed to fetch axes: ${axesError.message}`);
  }

  // 2. 質問を取得（keywordsカラムを含む）
  const { data: questions, error: questionsError } = await supabase
    .from('ai_interview_questions')
    .select('id, axis_id, question_text, keywords, sort_order, content_type, lang, is_active')
    .eq('content_type', contentType)
    .eq('lang', lang)
    .eq('is_active', true)
    .order('sort_order');

  if (questionsError) {
    throw new Error(`Failed to fetch questions: ${questionsError.message}`);
  }

  return {
    axes: (axes ?? []) as AxisRow[],
    questions: (questions ?? []) as QuestionRow[]
  };
}

/**
 * キーワードマッチ数を計算
 */
function calculateMatchCount(questionKeywords: string[] | null, orgKeywords: string[]): number {
  if (!questionKeywords || questionKeywords.length === 0 || orgKeywords.length === 0) {
    return 0;
  }

  const questionLower = questionKeywords.map(k => k.toLowerCase());
  return questionLower.filter(qk => orgKeywords.includes(qk)).length;
}

/**
 * 質問データを変換・ソート
 */
function transformAndSortQuestions(
  questions: QuestionRow[],
  orgKeywords: string[]
): InterviewQuestionItem[] {
  return questions.map(q => {
    const keywords = q.keywords || [];
    const matchCount = calculateMatchCount(keywords, orgKeywords);

    return {
      id: q.id,
      axisId: q.axis_id,
      questionText: q.question_text,
      keywords,
      matchCount,
      sortOrder: q.sort_order,
      contentType: q.content_type,
      lang: q.lang,
      isActive: q.is_active
    } as InterviewQuestionItem;
  }).sort((a, b) => {
    // ソート優先順位: 1. matchCount DESC, 2. sortOrder ASC, 3. ID ASC
    if (a.matchCount !== b.matchCount) {
      return b.matchCount - a.matchCount;
    }
    if (a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder;
    }
    return a.id.localeCompare(b.id);
  });
}

/**
 * 軸ごとにグルーピング
 */
function groupQuestionsByAxis(
  axes: AxisRow[],
  questions: InterviewQuestionItem[]
): AxisGroup[] {
  return axes.map(axis => {
    const axisQuestions = questions.filter(q => q.axisId === axis.id);

    return {
      axisId: axis.id,
      axisCode: axis.code,
      labelJa: axis.label_ja,
      labelEn: axis.label_en,
      descriptionJa: axis.description_ja,
      descriptionEn: axis.description_en,
      sortOrder: axis.sort_order,
      questions: axisQuestions
    } as AxisGroup;
  }).sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function GET(request: NextRequest) {
  try {
    const { supabase, user, applyCookies } = await createApiAuthClient(request);

    // クエリパラメータ取得
    const { searchParams } = new URL(request.url);
    const contentType = searchParams.get('content_type') as InterviewContentType;
    const lang = searchParams.get('lang') || 'ja';
    const orgId = searchParams.get('orgId');

    // パラメータ検証
    if (!contentType || !isValidContentType(contentType)) {
      return applyCookies(NextResponse.json(
        { error: 'Invalid or missing content_type parameter' },
        { status: 400 }
      ));
    }

    if (!lang) {
      return applyCookies(NextResponse.json(
        { error: 'Missing lang parameter' },
        { status: 400 }
      ));
    }

    if (!orgId) {
      return applyCookies(NextResponse.json(
        { error: 'Missing orgId parameter' },
        { status: 400 }
      ));
    }

    // 組織メンバーシップ確認
    try {
      await validateOrgAccess(orgId, user.id, 'read');
    } catch (error) {
      if (error instanceof OrgAccessError) {
        return applyCookies(NextResponse.json({
          error: error.code,
          message: error.message
        }, { status: error.statusCode }));
      }
      throw error;
    }

    // 並行して組織キーワードと質問データを取得
    const [orgKeywords, { axes, questions }] = await Promise.all([
      fetchOrgKeywords(supabase, orgId, lang),
      fetchQuestionsWithAxes(supabase, contentType, lang)
    ]);

    // 質問データを変換・ソート（キーワードマッチング含む）
    const transformedQuestions = transformAndSortQuestions(questions, orgKeywords);

    // 軸ごとにグルーピング
    const axesWithQuestions = groupQuestionsByAxis(axes, transformedQuestions);

    // レスポンス構築
    const response: InterviewQuestionsResponse = {
      axes: axesWithQuestions,
      totalCount: transformedQuestions.length,
      orgKeywordsCount: orgKeywords.length
    };

    logger.info('Interview questions API success', {
      userId: user.id,
      orgId,
      contentType,
      lang,
      axesCount: response.axes.length,
      totalQuestions: response.totalCount,
      orgKeywords: response.orgKeywordsCount
    });

    return applyCookies(NextResponse.json(response));

  } catch (error) {
    if (error instanceof ApiAuthException) {
      return error.toResponse();
    }

    const err = error as { message?: string; stack?: string };
    logger.error('Interview questions API error', {
      error: err.message ?? String(error),
      stack: err.stack
    });

    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'INTERVIEW_QUESTIONS_FETCH_ERROR',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
