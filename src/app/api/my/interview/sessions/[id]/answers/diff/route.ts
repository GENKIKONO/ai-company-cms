import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuthUser, requireOrgMember } from '@/lib/auth/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { logInterviewQuestion } from '@/lib/interview/question-logging';
import type { 
  SaveAnswerDiffRequest,
  SaveAnswerDiffResponse,
  InterviewAnswersJson,
  InterviewAnswerQuestion,
  InterviewAnswerTurn
} from '@/types/interview-session';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * JSON形式判定: 新形式（InterviewAnswersJson）か旧形式（Record<string, unknown>）かを判定
 */
function isNewAnswersFormat(answers: any): answers is InterviewAnswersJson {
  return answers && 
         typeof answers === 'object' && 
         Array.isArray(answers.questions);
}

/**
 * 新形式用: 特定questionIdの回答を差分更新
 */
function updateNewFormatAnswers(
  currentAnswers: InterviewAnswersJson, 
  questionId: string, 
  newAnswer: string | null,
  contentType: string
): InterviewAnswersJson {
  const updatedAnswers = { ...currentAnswers };
  if (!updatedAnswers.questions) {
    updatedAnswers.questions = [];
  }

  // 既存の question を探す
  const questionIndex = updatedAnswers.questions.findIndex(q => q.question_id === questionId);
  
  if (newAnswer === null || newAnswer === '') {
    // 回答削除の場合
    if (questionIndex >= 0) {
      updatedAnswers.questions.splice(questionIndex, 1);
    }
  } else {
    // 回答追加/更新の場合
    const newTurn: InterviewAnswerTurn = {
      turn_index: 0, // TODO: 深掘り質問対応時は適切なturn_indexを設定
      question_text: '', // TODO: 実際の質問文を設定
      answer_text: newAnswer,
      meta: {}
    };

    if (questionIndex >= 0) {
      // 既存の question を更新
      if (!updatedAnswers.questions[questionIndex].turns) {
        updatedAnswers.questions[questionIndex].turns = [];
      }
      // turn_index 0 の既存回答があれば更新、なければ追加
      const turnIndex = updatedAnswers.questions[questionIndex].turns.findIndex(t => t.turn_index === 0);
      if (turnIndex >= 0) {
        updatedAnswers.questions[questionIndex].turns[turnIndex] = newTurn;
      } else {
        updatedAnswers.questions[questionIndex].turns.push(newTurn);
      }
    } else {
      // 新しい question を追加
      const newQuestion: InterviewAnswerQuestion = {
        question_id: questionId,
        axis_id: null, // TODO: 必要に応じて axis_id を設定
        content_type: contentType,
        lang: 'ja', // TODO: 動的に設定
        turns: [newTurn]
      };
      updatedAnswers.questions.push(newQuestion);
    }
  }

  return updatedAnswers;
}

/**
 * 旧形式用: 特定questionIdの回答を差分更新
 */
function updateOldFormatAnswers(
  currentAnswers: Record<string, unknown>,
  questionId: string,
  newAnswer: string | null
): Record<string, unknown> {
  const updatedAnswers = { ...currentAnswers };
  
  if (newAnswer === null || newAnswer === '') {
    delete updatedAnswers[questionId];
  } else {
    updatedAnswers[questionId] = newAnswer;
  }
  
  return updatedAnswers;
}

/**
 * EPIC 2-2: 差分保存API with 楽観ロック
 * 
 * セッション全体ではなく、特定のquestionIdの回答のみを差分更新します。
 * 
 * 【楽観ロックの理由】
 * - 「後から保存した方が必ず勝つ」ではなく、「最新状態を持っているクライアントだけが保存できる」ルール
 * - なぜ previousUpdatedAt を送っているのか: 他のタブや他のユーザーが同時に編集している可能性があるため
 * - なぜ 409 を返すのか: クライアントに「他で変更されているので再読み込みしてください」と伝えるため
 * 
 * 【複数タブの競合ルール】
 * - 常に「最新の updated_at を持っているクライアントだけが保存できる」
 * - 409 Conflict 時は UI でダイアログ表示: 「他の画面で更新されました。再読み込みして最新の内容を確認してください」
 */

const SaveAnswerDiffSchema = z.object({
  questionId: z.string().min(1),
  newAnswer: z.string().nullable(),
  previousUpdatedAt: z.string(), // ISO文字列形式
});

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<SaveAnswerDiffResponse>> {
  try {
    // 認証確認
    const user = await requireAuthUser();
    const { id } = await params;

    // UUID形式チェック
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { 
          success: false, 
          code: 'validation_error', 
          message: 'Invalid session ID format' 
        },
        { status: 400 }
      );
    }

    // リクエストボディの解析・バリデーション
    const body = await request.json();
    const validationResult = SaveAnswerDiffSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          code: 'validation_error', 
          message: 'Invalid request body: ' + validationResult.error.message 
        },
        { status: 400 }
      );
    }

    const { questionId, newAnswer, previousUpdatedAt } = validationResult.data;

    const supabase = await createClient();

    // 【ステップ1】セッション取得と権限チェック
    const { data: session, error: fetchError } = await supabase
      .from('ai_interview_sessions')
      .select('id, organization_id, user_id, status, answers, updated_at, version, content_type')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (fetchError) {
      logger.error('Failed to fetch session for diff save:', fetchError);
      return NextResponse.json(
        { 
          success: false, 
          code: 'database_error', 
          message: 'Failed to fetch session' 
        },
        { status: 500 }
      );
    }

    if (!session) {
      return NextResponse.json(
        { 
          success: false, 
          code: 'not_found', 
          message: 'Session not found' 
        },
        { status: 404 }
      );
    }

    // セッションがcompletedの場合は編集不可
    if (session.status === 'completed') {
      return NextResponse.json(
        { 
          success: false, 
          code: 'readonly_session', 
          message: 'Cannot modify completed session' 
        },
        { status: 400 }
      );
    }

    // 権限チェック
    if (session.organization_id) {
      try {
        await requireOrgMember(session.organization_id);
      } catch (error) {
        logger.warn('Unauthorized access to session for diff save:', { 
          sessionId: id, 
          userId: user.id, 
          organizationId: session.organization_id,
          error 
        });
        return NextResponse.json(
          { 
            success: false, 
            code: 'forbidden', 
            message: 'Forbidden' 
          },
          { status: 403 }
        );
      }
    } else {
      if (session.user_id !== user.id) {
        logger.warn('Unauthorized access to personal session for diff save:', { 
          sessionId: id, 
          userId: user.id, 
          sessionUserId: session.user_id 
        });
        return NextResponse.json(
          { 
            success: false, 
            code: 'forbidden', 
            message: 'Forbidden' 
          },
          { status: 403 }
        );
      }
    }

    // 【ステップ2】楽観ロック: updated_at 比較
    const serverUpdatedAt = new Date(session.updated_at).toISOString();
    const clientUpdatedAt = new Date(previousUpdatedAt).toISOString();

    if (serverUpdatedAt !== clientUpdatedAt) {
      // 競合発生
      logger.warn('Diff save conflict detected:', {
        sessionId: id,
        userId: user.id,
        clientUpdatedAt,
        serverUpdatedAt
      });

      return NextResponse.json(
        {
          success: false,
          code: 'conflict',
          message: 'Session has been updated elsewhere.',
          latest: {
            id: session.id,
            version: session.version,
            updated_at: session.updated_at,
            answers: session.answers,
          }
        },
        { status: 409 }
      );
    }

    // 【ステップ3】差分更新: 新旧形式対応で answers の特定キーのみ更新
    const currentAnswers = session.answers || {};
    let updatedAnswers: InterviewAnswersJson | Record<string, unknown>;

    if (isNewAnswersFormat(currentAnswers)) {
      // 新形式（InterviewAnswersJson）の場合
      updatedAnswers = updateNewFormatAnswers(
        currentAnswers as InterviewAnswersJson, 
        questionId, 
        newAnswer,
        session.content_type
      );
      logger.debug('Updated new format answers:', { sessionId: id, questionId, hasContent: !!newAnswer });
    } else {
      // 旧形式（Record<string, unknown>）の場合 - 後方互換性のため
      updatedAnswers = updateOldFormatAnswers(
        currentAnswers as Record<string, unknown>,
        questionId,
        newAnswer
      );
      logger.debug('Updated old format answers:', { sessionId: id, questionId, hasContent: !!newAnswer });
    }

    // 【ステップ4】データベース更新
    const now = new Date().toISOString();
    const newVersion = session.version + 1;

    const { data: updatedSession, error: updateError } = await supabase
      .from('ai_interview_sessions')
      .update({
        answers: updatedAnswers,
        version: newVersion,
        updated_at: now
      })
      .eq('id', id)
      .eq('version', session.version) // 楽観ロック: version も確認
      .is('deleted_at', null)
      .select('id, answers, updated_at, version')
      .maybeSingle();

    if (updateError) {
      logger.error('Failed to update session answers:', updateError);
      return NextResponse.json(
        { 
          success: false, 
          code: 'database_error', 
          message: 'Failed to update session' 
        },
        { status: 500 }
      );
    }

    if (!updatedSession) {
      // 更新対象が見つからない = 他で変更されている
      logger.warn('Session update failed - version conflict:', {
        sessionId: id,
        expectedVersion: session.version,
        userId: user.id
      });

      // 最新データを再取得
      const { data: latest, error: latestError } = await supabase
        .from('ai_interview_sessions')
        .select('id, version, updated_at, answers')
        .eq('id', id)
        .is('deleted_at', null)
        .maybeSingle();

      if (latestError || !latest) {
        return NextResponse.json(
          { 
            success: false, 
            code: 'database_error', 
            message: 'Failed to fetch latest session data' 
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          code: 'conflict',
          message: 'Session has been updated elsewhere.',
          latest: {
            id: latest.id,
            version: latest.version,
            updated_at: latest.updated_at,
            answers: latest.answers,
          }
        },
        { status: 409 }
      );
    }

    // 【ステップ5】質問ログ記録（fire-and-forget）
    if (newAnswer && newAnswer.trim() && session.organization_id) {
      // 新しい回答が保存された場合のみログ記録
      const turnIndex = 0; // TODO: 深掘り質問の場合は適切なturn_indexを設定
      logInterviewQuestion(supabase, {
        organization_id: session.organization_id,
        session_id: id,
        question_id: questionId,
        turn_index: turnIndex,
      });
    }

    // 【ステップ6】成功レスポンス
    logger.info('Session answer diff saved successfully:', {
      sessionId: id,
      questionId,
      userId: user.id,
      oldVersion: session.version,
      newVersion: updatedSession.version,
      updatedAt: updatedSession.updated_at
    });

    return NextResponse.json({
      ok: true,
      updatedAt: updatedSession.updated_at,
      answers: updatedSession.answers,
      version: updatedSession.version
    });

  } catch (error) {
    logger.error('Session diff save API error:', error);

    // 認証エラーの場合
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json(
        { 
          success: false, 
          code: 'authentication_required', 
          message: 'Authentication required' 
        },
        { status: 401 }
      );
    }

    // 組織メンバーアクセスエラーの場合
    if (error instanceof Error && (error.message.includes('Organization') || error.message.includes('Forbidden'))) {
      return NextResponse.json(
        { 
          success: false, 
          code: 'forbidden', 
          message: 'Forbidden' 
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        code: 'internal_error', 
        message: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// GET, PUT, PATCH, DELETE メソッドは許可しない
export async function GET() {
  return NextResponse.json(
    { 
      success: false, 
      code: 'method_not_allowed', 
      message: 'Method not allowed' 
    }, 
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { 
      success: false, 
      code: 'method_not_allowed', 
      message: 'Method not allowed' 
    }, 
    { status: 405 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    { 
      success: false, 
      code: 'method_not_allowed', 
      message: 'Method not allowed' 
    }, 
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { 
      success: false, 
      code: 'method_not_allowed', 
      message: 'Method not allowed' 
    }, 
    { status: 405 }
  );
}