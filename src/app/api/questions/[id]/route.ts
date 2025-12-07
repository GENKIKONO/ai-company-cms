import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminAuth } from '@/lib/auth/admin-auth';
import { apiLogger } from '@/lib/utils/logger';
import type { QuestionAnswerData, QuestionWithDetails } from '@/types/domain/questions';;

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET: 特定の質問を取得
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const resolvedParams = await params;
    const questionId = resolvedParams.id;

    // 認証チェック（管理者または質問者本人のみ）
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 質問の取得
    const { data: question, error } = await supabase
      .from('questions')
      .select(`
        *,
        app_users!questions_user_id_fkey(email, full_name),
        organizations!questions_company_id_fkey(name),
        answerer:app_users!questions_answered_by_fkey(full_name)
      `)
      .eq('id', questionId)
      .single();

    if (error || !question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // アクセス権限チェック
    const isAdmin = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()).includes(user.email || '');
    const isQuestionOwner = question.user_id === user.id;
    
    // 企業担当者かチェック
    let isCompanyUser = false;
    if (!isAdmin && !isQuestionOwner) {
      const { data: orgData } = await supabase
        .from('organizations')
        .select('id')
        .eq('created_by', user.id)
        .eq('id', question.company_id)
        .single();
      
      isCompanyUser = !!orgData;
    }

    if (!isAdmin && !isQuestionOwner && !isCompanyUser) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // レスポンス形式の変換
    const formattedQuestion: QuestionWithDetails = {
      id: question.id,
      company_id: question.company_id,
      user_id: question.user_id,
      question_text: question.question_text,
      status: question.status,
      answer_text: question.answer_text,
      created_at: question.created_at,
      answered_at: question.answered_at,
      answered_by: question.answered_by,
      user_email: question.app_users?.email,
      user_full_name: question.app_users?.full_name,
      company_name: question.organizations?.name,
      answerer_name: question.answerer?.full_name
    };

    return NextResponse.json({
      data: formattedQuestion
    });

  } catch (error) {
    apiLogger.error('GET', `/api/questions/[id]`, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: 質問の回答・ステータス更新（管理者・企業担当者のみ）
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const resolvedParams = await params;
    const questionId = resolvedParams.id;

    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // リクエストボディの解析
    const body = await request.json();
    const { answer_text, status } = body;

    // 質問の存在確認
    const { data: existingQuestion, error: fetchError } = await supabase
      .from('questions')
      .select('*')
      .eq('id', questionId)
      .single();

    if (fetchError || !existingQuestion) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // アクセス権限チェック
    const isAdmin = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()).includes(user.email || '');
    
    // 企業担当者かチェック
    let isCompanyUser = false;
    if (!isAdmin) {
      const { data: orgData } = await supabase
        .from('organizations')
        .select('id')
        .eq('created_by', user.id)
        .eq('id', existingQuestion.company_id)
        .single();
      
      isCompanyUser = !!orgData;
    }

    if (!isAdmin && !isCompanyUser) {
      return NextResponse.json(
        { error: 'Access denied. Only admin or company users can update questions.' },
        { status: 403 }
      );
    }

    // バリデーション
    if (status && !['open', 'answered', 'closed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be open, answered, or closed.' },
        { status: 400 }
      );
    }

    if (answer_text && answer_text.length > 2000) {
      return NextResponse.json(
        { error: 'Answer must be less than 2000 characters' },
        { status: 400 }
      );
    }

    // 更新データの準備
    const updateData: any = {};
    
    if (answer_text !== undefined) {
      updateData.answer_text = answer_text.trim();
      updateData.answered_by = user.id;
      updateData.answered_at = new Date().toISOString();
      
      // 回答が追加された場合、ステータスを'answered'に更新
      if (answer_text.trim() && !status) {
        updateData.status = 'answered';
      }
    }

    if (status) {
      updateData.status = status;
    }

    // 質問の更新
    const { data: updatedQuestion, error: updateError } = await supabase
      .from('questions')
      .update(updateData)
      .eq('id', questionId)
      .select(`
        *,
        app_users!questions_user_id_fkey(email, full_name),
        organizations!questions_company_id_fkey(name),
        answerer:app_users!questions_answered_by_fkey(full_name)
      `)
      .single();

    if (updateError) {
      apiLogger.error('PUT', `/api/questions/${questionId}`, updateError, { userId: user.id, questionId });
      return NextResponse.json(
        { error: 'Failed to update question' },
        { status: 500 }
      );
    }

    // レスポンス形式の変換
    const formattedQuestion: QuestionWithDetails = {
      id: updatedQuestion.id,
      company_id: updatedQuestion.company_id,
      user_id: updatedQuestion.user_id,
      question_text: updatedQuestion.question_text,
      status: updatedQuestion.status,
      answer_text: updatedQuestion.answer_text,
      created_at: updatedQuestion.created_at,
      answered_at: updatedQuestion.answered_at,
      answered_by: updatedQuestion.answered_by,
      user_email: updatedQuestion.app_users?.email,
      user_full_name: updatedQuestion.app_users?.full_name,
      company_name: updatedQuestion.organizations?.name,
      answerer_name: updatedQuestion.answerer?.full_name
    };

    return NextResponse.json({
      success: true,
      data: formattedQuestion
    });

  } catch (error) {
    apiLogger.error('PUT', `/api/questions/[id]`, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: 質問の削除（管理者のみ）
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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
    const resolvedParams = await params;
    const questionId = resolvedParams.id;

    // 質問の削除
    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', questionId);

    if (error) {
      apiLogger.error('DELETE', `/api/questions/${questionId}`, error, { questionId });
      return NextResponse.json(
        { error: 'Failed to delete question' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Question deleted successfully'
    });

  } catch (error) {
    apiLogger.error('DELETE', `/api/questions/[id]`, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}