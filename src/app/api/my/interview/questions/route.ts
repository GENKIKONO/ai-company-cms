/**
 * P2-4: Interview質問UI拡張API
 * 軸ごとのグルーピング / キーワード連動機能
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUser, requireOrgMember, createAuthErrorResponse } from '@/lib/auth/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import type {
  InterviewQuestionsResponse,
  InterviewQuestionsQuery,
  AxisGroup,
  InterviewQuestionItem,
  OrganizationKeyword,
  InterviewContentType
} from '@/types/interview';

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
  supabase: any, 
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

  return keywords?.map((k: any) => k.keyword.toLowerCase()) || [];
}

/**
 * 質問軸と質問を取得
 */
async function fetchQuestionsWithAxes(
  supabase: any,
  contentType: InterviewContentType,
  lang: string
) {
  // 1. 質問軸を取得
  const { data: axes, error: axesError } = await supabase
    .from('ai_interview_axes')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  if (axesError) {
    throw new Error(`Failed to fetch axes: ${axesError.message}`);
  }

  // 2. 質問を取得（keywordsカラムを含む）
  const { data: questions, error: questionsError } = await supabase
    .from('ai_interview_questions')
    .select('*')
    .eq('content_type', contentType)
    .eq('lang', lang)
    .eq('is_active', true)
    .order('sort_order');

  if (questionsError) {
    throw new Error(`Failed to fetch questions: ${questionsError.message}`);
  }

  return { axes: axes || [], questions: questions || [] };
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
  questions: any[],
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
  axes: any[],
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
    // 認証確認
    const user = await requireAuthUser();
    
    // クエリパラメータ取得
    const { searchParams } = new URL(request.url);
    const contentType = searchParams.get('content_type') as InterviewContentType;
    const lang = searchParams.get('lang') || 'ja';
    const orgId = searchParams.get('orgId');

    // パラメータ検証
    if (!contentType || !isValidContentType(contentType)) {
      return NextResponse.json(
        { error: 'Invalid or missing content_type parameter' },
        { status: 400 }
      );
    }

    if (!lang) {
      return NextResponse.json(
        { error: 'Missing lang parameter' },
        { status: 400 }
      );
    }

    if (!orgId) {
      return NextResponse.json(
        { error: 'Missing orgId parameter' },
        { status: 400 }
      );
    }

    // 組織メンバーシップ確認
    const { organization } = await requireOrgMember(orgId);

    const supabase = await createClient();

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

    return NextResponse.json(response);

  } catch (error: any) {
    // 認証・認可エラーの場合は専用のレスポンスを返す
    if (error.code === 'AUTH_REQUIRED' || error.code === 'ORG_ACCESS_DENIED') {
      return createAuthErrorResponse(error);
    }

    logger.error('Interview questions API error', {
      error: error.message,
      stack: error.stack
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