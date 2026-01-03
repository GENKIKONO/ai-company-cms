import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserWithClient } from '@/lib/core/auth-state';
import type { QuestionWithDetails } from '@/types/domain/questions';;
import { logger } from '@/lib/utils/logger';

// GET: 現在のユーザーが投稿した質問一覧
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // ユーザー認証チェック（Core経由）
    const user = await getUserWithClient(supabase);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // ユーザーの質問を取得（v_questions_compat互換ビュー使用）
    let query = supabase
      .from('v_questions_compat')
      .select(`
        id, title, body, created_at, question_text, status, answer_text,
        answered_at, answered_by, user_id, company_id,
        author_email, author_full_name, organization_name, answered_by_full_name
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // ステータスフィルター
    if (status && ['open', 'answered', 'closed'].includes(status)) {
      query = query.eq('status', status);
    }

    const { data: questions, error } = await query;

    if (error) {
      logger.error('Error fetching user questions', { data: error instanceof Error ? error : new Error(String(error)) });
      return NextResponse.json(
        { error: 'Failed to fetch questions' },
        { status: 500 }
      );
    }

    // レスポンス形式の変換（v_questions_compat列を使用）
    const formattedQuestions: QuestionWithDetails[] = questions?.map(q => ({
      id: q.id,
      company_id: q.company_id,
      user_id: q.user_id,
      question_text: q.question_text,
      status: q.status,
      answer_text: q.answer_text,
      created_at: q.created_at,
      answered_at: q.answered_at,
      answered_by: q.answered_by,
      user_email: user.email || undefined,
      user_full_name: undefined, // 自分の質問なので表示不要
      company_name: q.organization_name,
      answerer_name: q.answered_by_full_name
    })) || [];

    return NextResponse.json({
      data: formattedQuestions,
      total: formattedQuestions.length,
      offset,
      limit
    });

  } catch (error) {
    logger.error('My questions API error', { data: error instanceof Error ? error : new Error(String(error)) });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}