// Single-Org Mode API: /api/my/services/[id]
// 個別サービスの更新・削除API
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import type { ServiceFormData } from '@/types/database';
import { normalizeServicePayload, createAuthError, createNotFoundError, createInternalError, generateErrorId } from '@/lib/utils/data-normalization';

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

// GET - 個別サービスを取得
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

    // Get user organization first for RLS compliance
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('created_by', authData.user.id)
      .single();

    if (orgError || !organization) {
      return createNotFoundError('Organization');
    }

    // RLS compliance: check both organization ownership and created_by
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organization.id)
      .eq('created_by', authData.user.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return createNotFoundError('Service');
    }

    return NextResponse.json({ data });

  } catch (error) {
    const errorId = generateErrorId('get-service');
    logErrorToDiag({
      errorId,
      endpoint: 'GET /api/my/services/[id]',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    
    return createInternalError(errorId);
  }
}

// PUT - サービスを更新
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

    const body: Partial<ServiceFormData> = await request.json();

    // Get user organization first for RLS compliance
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('created_by', authData.user.id)
      .single();

    if (orgError || !organization) {
      return createNotFoundError('Organization');
    }

    // RLS compliance: check both organization ownership and created_by
    const { data: existingService, error: fetchError } = await supabase
      .from('services')
      .select('id')
      .eq('id', id)
      .eq('organization_id', organization.id)
      .eq('created_by', authData.user.id)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json(
        { error: 'Database error', message: fetchError.message },
        { status: 500 }
      );
    }

    if (!existingService) {
      return createNotFoundError('Service');
    }

    // データ正規化
    const normalizedData = normalizeServicePayload(body);
    const updateData = {
      ...normalizedData,
      updated_at: new Date().toISOString(),
    };

    // Update with RLS compliance: both organization_id and created_by filters
    const { data, error } = await supabase
      .from('services')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', organization.id)
      .eq('created_by', authData.user.id)
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
    const errorId = generateErrorId('put-service');
    logErrorToDiag({
      errorId,
      endpoint: 'PUT /api/my/services/[id]',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    
    return createInternalError(errorId);
  }
}

// DELETE - サービスを削除
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

    // Get user organization first for RLS compliance
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('created_by', authData.user.id)
      .single();

    if (orgError || !organization) {
      return createNotFoundError('Organization');
    }

    // RLS compliance: check both organization ownership and created_by
    const { data: existingService, error: fetchError } = await supabase
      .from('services')
      .select('id')
      .eq('id', id)
      .eq('organization_id', organization.id)
      .eq('created_by', authData.user.id)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json(
        { error: 'Database error', message: fetchError.message },
        { status: 500 }
      );
    }

    if (!existingService) {
      return createNotFoundError('Service');
    }

    // Delete with RLS compliance: both organization_id and created_by filters
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id)
      .eq('organization_id', organization.id)
      .eq('created_by', authData.user.id);

    if (error) {
      return NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Service deleted successfully' });

  } catch (error) {
    const errorId = generateErrorId('delete-service');
    logErrorToDiag({
      errorId,
      endpoint: 'DELETE /api/my/services/[id]',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    
    return createInternalError(errorId);
  }
}