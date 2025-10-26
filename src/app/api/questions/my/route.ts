import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import type { QuestionWithDetails } from '@/types/database';

// GET: 現在のユーザーが投稿した質問一覧
export async function GET(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    
    // ユーザー認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // ユーザーの質問を取得
    let query = supabase
      .from('questions')
      .select(`
        *,
        organizations!questions_company_id_fkey(name),
        answerer:app_users!questions_answered_by_fkey(full_name)
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
      console.error('Error fetching user questions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch questions' },
        { status: 500 }
      );
    }

    // レスポンス形式の変換
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
      company_name: q.organizations?.name,
      answerer_name: q.answerer?.full_name
    })) || [];

    return NextResponse.json({
      data: formattedQuestions,
      total: formattedQuestions.length,
      offset,
      limit
    });

  } catch (error) {
    console.error('My questions API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}