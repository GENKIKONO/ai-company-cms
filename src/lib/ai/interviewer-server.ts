/**
 * AIインタビュアー機能のサーバー側ロジック
 * 質問データの取得と整形を行う
 */

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/log';
import { CONTENT_TYPES, SUPPORTED_LANGUAGES, type ContentType, type SupportedLanguage } from '@/types/ai-interviewer';

// フロントエンド用の型定義
export interface InterviewQuestion {
  id: string;
  axisCode: string;
  axisLabel: string;
  contentType: string;
  lang: string;
  questionText: string;
  sortOrder: number;
}

export interface GroupedByAxis {
  axisCode: string;
  axisLabel: string;
  sortOrder: number;
  questions: InterviewQuestion[];
}

/**
 * 指定されたcontent_type×言語の質問リストを軸ごとにグループ化して取得
 * @param contentType コンテンツタイプ（デフォルト: 'service'）
 * @param lang 言語（デフォルト: 'ja'）
 * @returns 軸ごとにグループ化された質問リスト
 */
export async function getInterviewQuestionsByAxis(
  contentType: ContentType = CONTENT_TYPES.SERVICE,
  lang: SupportedLanguage = SUPPORTED_LANGUAGES.JA
): Promise<GroupedByAxis[]> {
  try {
    const supabase = await createClient();
    
    // ai_interview_question_catalog_v1 ビューから質問を取得
    const { data: questionData, error } = await supabase
      .from('ai_interview_question_catalog_v1')
      .select('axis_id, axis_key, axis_code, axis_name, axis_sort_order, axis_active, question_id, question_text, help_text, question_sort_order, question_active, content_type, lang')
      .eq('content_type', contentType)
      .eq('lang', lang)
      .eq('axis_active', true)
      .eq('question_active', true)
      .order('axis_sort_order')
      .order('question_sort_order');

    if (error) {
      logger.error('Failed to fetch interview questions from catalog view', {
        component: 'interviewer-server',
        error: error.message,
        contentType,
        lang
      });
      return [];
    }

    if (!questionData || questionData.length === 0) {
      logger.info('No interview questions found in catalog', {
        component: 'interviewer-server',
        contentType,
        lang
      });
      return [];
    }

    // データを軸ごとにグループ化
    const axisMap = new Map<string, GroupedByAxis>();
    
    questionData.forEach(item => {
      const axisCode = item.axis_code || 'unknown';
      
      // 軸が未登録の場合は新規作成
      if (!axisMap.has(axisCode)) {
        axisMap.set(axisCode, {
          axisCode,
          axisLabel: getAxisLabel(axisCode),
          sortOrder: item.axis_sort_order || 0,
          questions: []
        });
      }

      // 質問データを追加
      const axisGroup = axisMap.get(axisCode)!;
      axisGroup.questions.push({
        id: item.question_id || '',
        axisCode,
        axisLabel: getAxisLabel(axisCode),
        contentType: item.content_type || contentType,
        lang: item.lang || lang,
        questionText: item.question_text || '',
        sortOrder: item.question_sort_order || 0
      });
    });

    // Map を配列に変換し、sort_order 順にソート
    const result = Array.from(axisMap.values()).sort((a, b) => a.sortOrder - b.sortOrder);

    logger.info('Successfully fetched interview questions', {
      component: 'interviewer-server',
      contentType,
      lang,
      axisCount: result.length,
      totalQuestions: result.reduce((sum, axis) => sum + axis.questions.length, 0)
    });

    return result;

  } catch (error) {
    logger.error('Error in getInterviewQuestionsByAxis', {
      component: 'interviewer-server',
      error: error instanceof Error ? error.message : 'Unknown error',
      contentType,
      lang
    });
    return [];
  }
}

/**
 * 軸コードから表示用ラベルを取得
 * TODO: 将来的にはDBから取得するか、i18n化する
 * @param axisCode 軸コード
 * @returns 表示用ラベル
 */
function getAxisLabel(axisCode: string): string {
  const labelMap: Record<string, string> = {
    'basic': '基本情報',
    'pricing': '料金・価格',
    'value': '価値・メリット',
    'differentiation': '差別化・特徴',
    'use_cases': '利用シーン',
    'customer': 'お客様の声',
    'risks': 'リスク・注意点',
  };
  
  return labelMap[axisCode] || axisCode;
}

/**
 * 利用可能なコンテンツタイプ一覧を取得
 * @returns コンテンツタイプの配列
 */
export function getAvailableContentTypes(): ContentType[] {
  return Object.values(CONTENT_TYPES);
}

/**
 * 利用可能な言語一覧を取得
 * @returns 言語コードの配列
 */
export function getAvailableLanguages(): SupportedLanguage[] {
  return Object.values(SUPPORTED_LANGUAGES);
}