// Single-Org Mode API: /api/my/case-studies/[id]
// 個別事例の更新・削除API
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
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
    const supabase = await createClient();
    
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

    // Map database 'outcome' field to frontend 'result' field for consistency
    const mappedData = data ? {
      ...data,
      result: data.outcome,
      outcome: undefined
    } : null;

    return NextResponse.json({ data: mappedData });

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
    const supabase = await createClient();
    
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return createAuthError();
    }

    const body: Partial<CaseStudyFormData> & { organizationId?: string } = await request.json();

    // organizationId を除去（snake_case 変換は不要、RLSで制御）
    const { organizationId, ...restBody } = body;

    // 存在確認 + RLS チェック（created_by を含む）
    const { data: existingCaseStudy, error: fetchError } = await supabase
      .from('case_studies')
      .select('id, organization_id, created_by')
      .eq('id', id)
      .eq('created_by', authData.user.id) // RLS compliance: 作成者のみ更新可能
      .single();

    if (fetchError || !existingCaseStudy) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Case study not found or access denied' },
        { status: 404 }
      );
    }

    // organizationId が指定されている場合は、既存レコードの organization_id と一致するかチェック
    if (organizationId && existingCaseStudy.organization_id !== organizationId) {
      return NextResponse.json(
        { error: 'Validation error', message: 'Cannot change organization of existing case study' },
        { status: 400 }
      );
    }

    // organizationId を除去したデータを正規化
    const normalizedData = normalizeCaseStudyPayload(restBody);
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

    // Map database 'outcome' field to frontend 'result' field for consistency
    const mappedData = data ? {
      ...data,
      result: data.outcome,
      outcome: undefined
    } : null;

    return NextResponse.json({ data: mappedData });

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
    const supabase = await createClient();
    
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return createAuthError();
    }

    // 存在確認 + RLS チェック（created_by を含む）
    const { data: existingCaseStudy, error: fetchError } = await supabase
      .from('case_studies')
      .select('id, created_by')
      .eq('id', id)
      .eq('created_by', authData.user.id) // RLS compliance: 作成者のみ削除可能
      .single();

    if (fetchError || !existingCaseStudy) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Case study not found or access denied' },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from('case_studies')
      .delete()
      .eq('id', id)
      .eq('created_by', authData.user.id); // 削除時にも created_by チェック

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

