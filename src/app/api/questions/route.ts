import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminAuth } from '@/lib/auth/admin-auth';
import { apiLogger } from '@/lib/utils/logger';
import type { QuestionFormData, QuestionWithDetails } from '@/types/database';

// GET: 管理者用 - 全質問の取得
export async function GET(request: NextRequest) {
  try {
    // 管理者認証が必要
    const authResult = await requireAdminAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = await createClient();
    const url = new URL(request.url);
    
    // パラメータ取得
    const status = url.searchParams.get('status');
    const companyId = url.searchParams.get('companyId');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // クエリ構築
    let query = supabase
      .from('questions')
      .select(`
        *,
        app_users!questions_user_id_fkey(email, full_name),
        organizations!questions_company_id_fkey(name),
        answerer:app_users!questions_answered_by_fkey(full_name)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // フィルター適用
    if (status && ['open', 'answered', 'closed'].includes(status)) {
      query = query.eq('status', status);
    }

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    const { data: questions, error } = await query;

    if (error) {
      apiLogger.error('GET', '/api/questions', error, { companyId, status, limit, offset });
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

    return NextResponse.json({
      data: formattedQuestions,
      total: formattedQuestions.length,
      offset,
      limit
    });

  } catch (error) {
    apiLogger.error('GET', '/api/questions', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: 新規質問の投稿（認証済みユーザーのみ）
export async function POST(request: NextRequest) {
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

    // リクエストボディの解析
    const body: QuestionFormData = await request.json();
    const { company_id, question_text } = body;

    // バリデーション
    if (!company_id || !question_text) {
      return NextResponse.json(
        { error: 'company_id and question_text are required' },
        { status: 400 }
      );
    }

    if (question_text.trim().length < 10) {
      return NextResponse.json(
        { error: 'Question must be at least 10 characters long' },
        { status: 400 }
      );
    }

    if (question_text.length > 1000) {
      return NextResponse.json(
        { error: 'Question must be less than 1000 characters' },
        { status: 400 }
      );
    }

    // 企業の存在確認
    const { data: company, error: companyError } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', company_id)
      .single();

    if (companyError || !company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // 質問データの挿入
    const questionData = {
      company_id,
      user_id: user.id,
      question_text: question_text.trim(),
      status: 'open' as const
    };

    const { data: newQuestion, error: insertError } = await supabase
      .from('questions')
      .insert([questionData])
      .select(`
        *,
        app_users!questions_user_id_fkey(email, full_name),
        organizations!questions_company_id_fkey(name)
      `)
      .single();

    if (insertError) {
      apiLogger.error('POST', '/api/questions', insertError, { userId: user.id, companyId: company_id });
      return NextResponse.json(
        { error: 'Failed to create question' },
        { status: 500 }
      );
    }

    // レスポンス形式の変換
    const formattedQuestion: QuestionWithDetails = {
      id: newQuestion.id,
      company_id: newQuestion.company_id,
      user_id: newQuestion.user_id,
      question_text: newQuestion.question_text,
      status: newQuestion.status,
      answer_text: newQuestion.answer_text,
      created_at: newQuestion.created_at,
      answered_at: newQuestion.answered_at,
      answered_by: newQuestion.answered_by,
      user_email: newQuestion.app_users?.email,
      user_full_name: newQuestion.app_users?.full_name,
      company_name: newQuestion.organizations?.name,
      answerer_name: undefined
    };

    return NextResponse.json({
      success: true,
      data: formattedQuestion
    }, { status: 201 });

  } catch (error) {
    apiLogger.error('POST', '/api/questions', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}