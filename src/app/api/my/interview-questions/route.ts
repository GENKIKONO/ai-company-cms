/**
 * インタビュー質問取得API
 * 指定されたコンテンツタイプ・言語での質問軸・質問・組織キーワードを取得
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { CONTENT_TYPES, SUPPORTED_LANGUAGES } from '@/types/ai-interviewer';
import { INTERVIEW_CONTENT_TYPE, type InterviewContentType } from '@/types/enums';
import type { InterviewQuestion, InterviewAxis } from '@/types/interview-session';

// TODO: [SUPABASE_TYPE_FOLLOWUP] Supabase Database 型定義を再構築後に復元する
// Supabase型定義のエイリアス（一時的に any でバイパス）
type OrganizationKeywordRow = any;

// レスポンス型定義
interface InterviewQuestionsResponse {
  data: {
    axes: InterviewAxis[];
    questions: InterviewQuestion[];
    keywords: OrganizationKeywordRow[];
  };
}

/**
 * 有効な content_type かチェック
 */
function isValidContentType(contentType: string): boolean {
  return Object.values(CONTENT_TYPES).includes(contentType as any);
}

/**
 * 有効な言語コードかチェック
 */
function isValidLanguage(lang: string): boolean {
  return Object.values(SUPPORTED_LANGUAGES).includes(lang as any);
}

export async function GET(request: NextRequest): Promise<NextResponse<InterviewQuestionsResponse | { error: string }>> {
  try {
    // 認証確認
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // クエリパラメータ取得
    const { searchParams } = new URL(request.url);
    const contentType = searchParams.get('content_type') || CONTENT_TYPES.SERVICE;
    const lang = searchParams.get('lang') || SUPPORTED_LANGUAGES.JA;
    const organizationId = searchParams.get('organization_id');

    // パラメータ検証
    if (!isValidContentType(contentType)) {
      return NextResponse.json(
        { error: `Invalid content_type. Must be one of: ${Object.values(CONTENT_TYPES).join(', ')}` },
        { status: 400 }
      );
    }

    if (!isValidLanguage(lang)) {
      return NextResponse.json(
        { error: `Invalid lang. Must be one of: ${Object.values(SUPPORTED_LANGUAGES).join(', ')}` },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 1. 質問軸を取得
    const { data: axesData, error: axesError } = await supabase
      .from('ai_interview_axes')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (axesError) {
      logger.error('Failed to fetch interview axes', axesError);
      throw new Error(`Failed to fetch axes: ${axesError.message}`);
    }

    // 2. 質問を取得（指定されたcontentType・langでフィルタ）
    const { data: questionsData, error: questionsError } = await supabase
      .from('ai_interview_questions')
      .select('*')
      .eq('content_type', contentType)
      .eq('lang', lang)
      .eq('is_active', true)
      .order('sort_order');

    if (questionsError) {
      logger.error('Failed to fetch interview questions', questionsError);
      throw new Error(`Failed to fetch questions: ${questionsError.message}`);
    }

    // 3. 組織キーワードを取得（organizationIdが指定されている場合のみ）
    let keywordsData: OrganizationKeywordRow[] = [];
    if (organizationId) {
      // 簡易的な権限チェック（組織メンバーかどうか確認）
      const { data: memberCheck, error: memberError } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (memberError || !memberCheck) {
        logger.warn('User not authorized for organization keywords', memberError?.message);
        // 権限がない場合はキーワードを空で返す（エラーにはしない）
      } else {
        const { data: keywords, error: keywordsError } = await supabase
          .from('organization_keywords')
          .select('*')
          .eq('organization_id', organizationId)
          .eq('is_active', true)
          .eq('locale', lang)
          .order('priority', { ascending: false });

        if (keywordsError) {
          logger.error('Failed to fetch organization keywords', keywordsError);
          // キーワード取得エラーは致命的でないので、空配列で継続
        } else {
          keywordsData = keywords || [];
        }
      }
    }

    // 4. レスポンス構築（Supabase型からUI型への変換）
    const axes: InterviewAxis[] = (axesData || []).map(axis => ({
      id: axis.id,
      axis_code: axis.code,
      label_ja: axis.label_ja || '',
      label_en: axis.label_en || '',
      description_ja: axis.description_ja,
      description_en: axis.description_en,
      sort_order: axis.sort_order,
      is_active: axis.is_active
    }));

    const questions: InterviewQuestion[] = (questionsData || []).map(question => ({
      id: question.id,
      axis_code: axes.find(axis => axis.id === question.axis_id)?.axis_code || '',
      question_text: question.question_text,
      content_type: question.content_type,
      lang: question.lang,
      sort_order: question.sort_order,
      is_active: question.is_active
    }));

    const response: InterviewQuestionsResponse = {
      data: {
        axes,
        questions,
        keywords: keywordsData
      }
    };

    logger.info('Interview questions API success', {
      userId: user.id,
      contentType,
      axesCount: response.data.axes.length,
      questionsCount: response.data.questions.length
    });

    return NextResponse.json(response);

  } catch (error) {
    logger.error('Interview questions API error', error);

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