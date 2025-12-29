// Single-Org Mode API: /api/my/faqs/[id]
// 個別FAQの更新・削除API
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserWithClient } from '@/lib/core/auth-state';
import type { FAQFormData } from '@/types/domain/content';;
import { normalizeFAQPayload, createAuthError, createNotFoundError, createInternalError, generateErrorId } from '@/lib/utils/data-normalization';

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

// GET - 個別FAQを取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 認証（Core経由）
    const user = await getUserWithClient(supabase);
    if (!user) {
      return createAuthError();
    }

    const { data, error } = await supabase
      .from('faqs')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return createNotFoundError('FAQ');
    }

    return NextResponse.json({ data });

  } catch (error) {
    const errorId = generateErrorId('get-faq');
    logErrorToDiag({
      errorId,
      endpoint: 'GET /api/my/faqs/[id]',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    
    return createInternalError(errorId);
  }
}

// PUT - FAQを更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // 認証チェック（Core経由）
    const user = await getUserWithClient(supabase);
    if (!user) {
      return createAuthError();
    }

    const body: Partial<FAQFormData> = await request.json();

    // 存在確認
    const { data: existingFAQ, error: fetchError } = await supabase
      .from('faqs')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (fetchError || !existingFAQ) {
      return createNotFoundError('FAQ');
    }

    // データ正規化
    const normalizedData = normalizeFAQPayload(body);
    const updateData = {
      ...normalizedData,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('faqs')
      .update(updateData)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });

  } catch (error) {
    const errorId = generateErrorId('put-faq');
    logErrorToDiag({
      errorId,
      endpoint: 'PUT /api/my/faqs/[id]',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    
    return createInternalError(errorId);
  }
}

// DELETE - FAQを削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // 認証チェック（Core経由）
    const user = await getUserWithClient(supabase);
    if (!user) {
      return createAuthError();
    }

    // 存在確認
    const { data: existingFAQ, error: fetchError } = await supabase
      .from('faqs')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (fetchError || !existingFAQ) {
      return createNotFoundError('FAQ');
    }

    const { error } = await supabase
      .from('faqs')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'FAQ deleted successfully' });

  } catch (error) {
    const errorId = generateErrorId('delete-faq');
    logErrorToDiag({
      errorId,
      endpoint: 'DELETE /api/my/faqs/[id]',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    
    return createInternalError(errorId);
  }
}