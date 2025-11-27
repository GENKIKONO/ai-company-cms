import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { QuestionWithDetails } from '@/types/database';
import { logger } from '@/lib/utils/logger';

// GET: 企業担当者が自社に向けられた質問を取得
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // ユーザー認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // ユーザーの企業IDを取得
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('created_by', user.id)
      .single();

    if (orgError || !orgData) {
      return NextResponse.json(
        { error: 'Organization not found. You must be a company owner to access this endpoint.' },
        { status: 404 }
      );
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // 自社宛ての質問を取得
    let query = supabase
      .from('questions')
      .select(`
        *,
        app_users!questions_user_id_fkey(email, full_name),
        organizations!questions_company_id_fkey(name),
        answerer:app_users!questions_answered_by_fkey(full_name)
      `)
      .eq('company_id', orgData.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // ステータスフィルター
    if (status && ['open', 'answered', 'closed'].includes(status)) {
      query = query.eq('status', status);
    }

    const { data: questions, error } = await query;

    if (error) {
      logger.error('Error fetching company questions', { data: error instanceof Error ? error : new Error(String(error)) });
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
      user_email: q.app_users?.email,
      user_full_name: q.app_users?.full_name,
      company_name: q.organizations?.name,
      answerer_name: q.answerer?.full_name
    })) || [];

    // 統計情報も含める
    const stats = {
      total: formattedQuestions.length,
      open: formattedQuestions.filter(q => q.status === 'open').length,
      answered: formattedQuestions.filter(q => q.status === 'answered').length,
      closed: formattedQuestions.filter(q => q.status === 'closed').length
    };

    return NextResponse.json({
      data: formattedQuestions,
      stats,
      company: {
        id: orgData.id,
        name: orgData.name
      },
      total: formattedQuestions.length,
      offset,
      limit
    });

  } catch (error) {
    logger.error('Company questions API error', { data: error instanceof Error ? error : new Error(String(error)) });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}