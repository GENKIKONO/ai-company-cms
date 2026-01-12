import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserWithClient } from '@/lib/core/auth-state';
import type { QuestionWithDetails } from '@/types/domain/questions';;
import { logger } from '@/lib/utils/logger';

// GET: 企業担当者が自社に向けられた質問を取得
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

    // ユーザーの所属組織を取得（organization_members経由）
    const { data: membershipData, error: membershipError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (membershipError) {
      logger.error('Error fetching organization membership:', { data: membershipError });
      return NextResponse.json(
        { error: 'Failed to fetch organization membership' },
        { status: 500 }
      );
    }

    if (!membershipData) {
      return NextResponse.json(
        { error: 'Organization membership not found. You must be a member of an organization to access this endpoint.' },
        { status: 404 }
      );
    }

    // 組織詳細を取得
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', membershipData.organization_id)
      .single();

    if (orgError || !orgData) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // 自社宛ての質問を取得（v_questions_compat互換ビュー使用）
    let query = supabase
      .from('v_questions_compat')
      .select(`
        id, title, body, created_at, question_text, status, answer_text,
        answered_at, answered_by, user_id, company_id,
        author_email, author_full_name, organization_name, answered_by_full_name
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
      user_email: q.author_email,
      user_full_name: q.author_full_name,
      company_name: q.organization_name,
      answerer_name: q.answered_by_full_name
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