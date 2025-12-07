/**
 * AI Interview 質問ログ記録ユーティリティ
 * ai_interview_question_logs テーブルへの INSERT 処理
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { logger } from '@/lib/utils/logger';

type SupabaseClientType = SupabaseClient<Database>;

export interface QuestionLogEntry {
  organization_id: string;
  session_id?: string | null;
  question_id?: string | null;
  turn_index: number;
}

/**
 * 質問ログを記録する（fire-and-forget）
 * エラーが発生してもメインの処理を停止させない
 */
export async function logInterviewQuestion(
  supabase: SupabaseClientType,
  entry: QuestionLogEntry
): Promise<void> {
  try {
    const logData: Database['public']['Tables']['ai_interview_question_logs']['Insert'] = {
      organization_id: entry.organization_id,
      session_id: entry.session_id,
      question_id: entry.question_id,
      turn_index: entry.turn_index,
      // asked_at は DEFAULT now() に任せる
    };

    const { error } = await supabase
      .from('ai_interview_question_logs')
      .insert([logData]);

    if (error) {
      // エラーログを出力するが処理は継続
      logger.warn('Failed to log interview question', {
        error: error.message,
        entry,
        code: error.code,
      });
    } else {
      logger.debug('Interview question logged successfully', entry);
    }
  } catch (error) {
    // 予期しないエラーもログに記録して処理継続
    logger.warn('Interview question logging exception', {
      error: error instanceof Error ? error.message : 'Unknown error',
      entry,
    });
  }
}

/**
 * バッチでの質問ログ記録
 * 複数の質問を一度に記録する場合に使用
 */
export async function logInterviewQuestionBatch(
  supabase: SupabaseClientType,
  entries: QuestionLogEntry[]
): Promise<void> {
  if (entries.length === 0) {
    return;
  }

  try {
    const logData: Database['public']['Tables']['ai_interview_question_logs']['Insert'][] = 
      entries.map(entry => ({
        organization_id: entry.organization_id,
        session_id: entry.session_id,
        question_id: entry.question_id,
        turn_index: entry.turn_index,
      }));

    const { error } = await supabase
      .from('ai_interview_question_logs')
      .insert(logData);

    if (error) {
      logger.warn('Failed to log interview questions batch', {
        error: error.message,
        entriesCount: entries.length,
        code: error.code,
      });
    } else {
      logger.debug('Interview questions batch logged successfully', {
        count: entries.length,
      });
    }
  } catch (error) {
    logger.warn('Interview questions batch logging exception', {
      error: error instanceof Error ? error.message : 'Unknown error',
      entriesCount: entries.length,
    });
  }
}

/**
 * 新仕様のAnswersJSONから質問ログエントリを生成する
 */
export function generateLogEntriesFromAnswers(
  organizationId: string,
  sessionId: string,
  answersJson: any
): QuestionLogEntry[] {
  const entries: QuestionLogEntry[] = [];

  if (!answersJson || !answersJson.questions || !Array.isArray(answersJson.questions)) {
    return entries;
  }

  answersJson.questions.forEach((question: any) => {
    if (!question.turns || !Array.isArray(question.turns)) {
      return;
    }

    question.turns.forEach((turn: any) => {
      if (typeof turn.turn_index === 'number' && turn.answer_text) {
        entries.push({
          organization_id: organizationId,
          session_id: sessionId,
          question_id: question.question_id || null,
          turn_index: turn.turn_index,
        });
      }
    });
  });

  return entries;
}