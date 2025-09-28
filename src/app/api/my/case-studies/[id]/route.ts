// Single-Org Mode API: /api/my/case-studies/[id]
// 個別事例の更新・削除API
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import type { CaseStudyFormData } from '@/types/database';
import { normalizeCaseStudyPayload, createAuthError, createNotFoundError, createInternalError, generateErrorId } from '@/lib/utils/data-normalization';

async function logErrorToDiag(errorInfo: any) {
  try {
    await fetch('/api/diag/ui', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'server_error',
        ...errorInfo
      }),
      cache: 'no-store'
    });
  } catch {
    // 診断ログ送信失敗は無視
  }
}

export const dynamic = 'force-dynamic';

// GET - 個別事例を取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await supabaseServer();
    
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return createAuthError();
    }

    const { data, error } = await supabase
      .from('case_studies')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Not Found', message: 'Case study not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });

  } catch (error) {
    const errorId = `get-case-study-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    logErrorToDiag({
      errorId,
      endpoint: 'GET /api/my/case-studies/[id]',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      { error: 'Internal server error', errorId },
      { status: 500 }
    );
  }
}

// PUT - 事例を更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await supabaseServer();
    
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return createAuthError();
    }

    const body: Partial<CaseStudyFormData> = await request.json();

    // 存在確認
    const { data: existingCaseStudy, error: fetchError } = await supabase
      .from('case_studies')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError || !existingCaseStudy) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Case study not found' },
        { status: 404 }
      );
    }

    // データ正規化
    const normalizedData = normalizeCaseStudyPayload(body);
    const updateData = {
      ...normalizedData,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('case_studies')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });

  } catch (error) {
    const errorId = `put-case-study-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    logErrorToDiag({
      errorId,
      endpoint: 'PUT /api/my/case-studies/[id]',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      { error: 'Internal server error', errorId },
      { status: 500 }
    );
  }
}

// DELETE - 事例を削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await supabaseServer();
    
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return createAuthError();
    }

    // 存在確認
    const { data: existingCaseStudy, error: fetchError } = await supabase
      .from('case_studies')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError || !existingCaseStudy) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Case study not found' },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from('case_studies')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Case study deleted successfully' });

  } catch (error) {
    const errorId = `delete-case-study-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    logErrorToDiag({
      errorId,
      endpoint: 'DELETE /api/my/case-studies/[id]',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      { error: 'Internal server error', errorId },
      { status: 500 }
    );
  }
}

