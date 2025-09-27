// Single-Org Mode API: /api/my/organization
// 各ユーザーが自分の企業情報を管理するためのAPI
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import type { Organization, OrganizationFormData } from '@/types/database';

// エラーログ送信関数（失敗しても無視）
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

// GET - ユーザーの企業情報を取得
export async function GET() {
  try {
    const supabase = await supabaseServer();
    
    // 認証チェック
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // ユーザーの企業情報を取得（RLSポリシーにより自動的に自分の企業のみ取得）
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('created_by', authData.user.id)
      .single();

    if (error) {
      // 企業が存在しない場合（初回）
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { data: null, message: 'No organization found' },
          { status: 200 }
        );
      }
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });

  } catch (error) {
    const errorId = `get-org-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.error('[GET /api/my/organization] Unexpected error:', { errorId, error });
    
    // エラーログを診断APIに送信
    logErrorToDiag({
      errorId,
      endpoint: 'GET /api/my/organization',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      { error: 'Internal server error', errorId },
      { status: 500 }
    );
  }
}

// POST - 新しい企業を作成（ユーザーが企業を持っていない場合のみ）
export async function POST(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    
    // 認証チェック
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const body: OrganizationFormData = await request.json();

    // 必須フィールドの検証
    if (!body.name || !body.slug) {
      return NextResponse.json(
        { error: 'Validation error', message: 'Name and slug are required' },
        { status: 400 }
      );
    }

    // slugバリデーション
    const slugValidation = validateSlug(body.slug);
    if (!slugValidation.isValid) {
      return NextResponse.json(
        { error: 'Validation error', message: slugValidation.error },
        { status: 400 }
      );
    }

    // 既に企業を持っているかチェック
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('created_by', authData.user.id)
      .single();

    if (existingOrg) {
      return NextResponse.json(
        { error: 'Conflict', message: 'User already has an organization' },
        { status: 409 }
      );
    }

    // slugの重複チェック
    const { data: slugCheck } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', body.slug)
      .single();

    if (slugCheck) {
      return NextResponse.json(
        { error: 'Conflict', message: 'Slug already exists' },
        { status: 409 }
      );
    }

    // データの正規化
    const normalizedData = normalizeOrganizationPayload(body);

    // 企業データの作成
    const organizationData: Partial<Organization> = {
      ...normalizedData,
      created_by: authData.user.id,
      status: 'draft' as const,
      is_published: false, // 初期は非公開
    };

    const { data, error } = await supabase
      .from('organizations')
      .insert([organizationData])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      
      // 制約違反の場合
      if (error.code === '23505') {
        if (error.message.includes('unique_organizations_created_by')) {
          return NextResponse.json(
            { error: 'Conflict', message: 'User already has an organization' },
            { status: 409 }
          );
        }
        if (error.message.includes('organizations_slug_key')) {
          return NextResponse.json(
            { error: 'Conflict', message: 'Slug already exists' },
            { status: 409 }
          );
        }
      }
      
      return NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });

  } catch (error) {
    const errorId = `post-org-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.error('[POST /api/my/organization] Unexpected error:', { errorId, error });
    
    // エラーログを診断APIに送信
    logErrorToDiag({
      errorId,
      endpoint: 'POST /api/my/organization',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      { error: 'Internal server error', errorId },
      { status: 500 }
    );
  }
}

// PUT - 既存の企業情報を更新
export async function PUT(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    
    // 認証チェック
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const body: Partial<OrganizationFormData> = await request.json();

    // 企業の存在確認
    const { data: existingOrg, error: fetchError } = await supabase
      .from('organizations')
      .select('id, slug')
      .eq('created_by', authData.user.id)
      .single();

    if (fetchError || !existingOrg) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Organization not found' },
        { status: 404 }
      );
    }

    // slugが変更される場合、バリデーション
    if (body.slug) {
      const slugValidation = validateSlug(body.slug);
      if (!slugValidation.isValid) {
        return NextResponse.json(
          { error: 'Validation error', message: slugValidation.error },
          { status: 400 }
        );
      }
    }

    // slugが変更される場合、重複チェック
    if (body.slug && body.slug !== existingOrg.slug) {
      const { data: slugCheck } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', body.slug)
        .neq('id', existingOrg.id)
        .single();

      if (slugCheck) {
        return NextResponse.json(
          { error: 'Conflict', message: 'Slug already exists' },
          { status: 409 }
        );
      }
    }

    // データの正規化
    const normalizedData = normalizeOrganizationPayload(body);

    // 更新データの準備（created_byは変更不可）
    const updateData = {
      ...normalizedData,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', existingOrg.id)
      .eq('created_by', authData.user.id) // セキュリティのため二重チェック
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      
      // 制約違反の場合
      if (error.code === '23505' && error.message.includes('organizations_slug_key')) {
        return NextResponse.json(
          { error: 'Conflict', message: 'Slug already exists' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });

  } catch (error) {
    const errorId = `put-org-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.error('[PUT /api/my/organization] Unexpected error:', { errorId, error });
    
    // エラーログを診断APIに送信
    logErrorToDiag({
      errorId,
      endpoint: 'PUT /api/my/organization',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      { error: 'Internal server error', errorId },
      { status: 500 }
    );
  }
}

// DELETE - 企業を削除（必要に応じて）
export async function DELETE() {
  try {
    const supabase = await supabaseServer();
    
    // 認証チェック
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // 企業の存在確認
    const { data: existingOrg, error: fetchError } = await supabase
      .from('organizations')
      .select('id')
      .eq('created_by', authData.user.id)
      .single();

    if (fetchError || !existingOrg) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Organization not found' },
        { status: 404 }
      );
    }

    // 削除実行（RLSポリシーにより自分の企業のみ削除可能）
    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', existingOrg.id)
      .eq('created_by', authData.user.id);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Organization deleted successfully' });

  } catch (error) {
    const errorId = `delete-org-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.error('[DELETE /api/my/organization] Unexpected error:', { errorId, error });
    
    // エラーログを診断APIに送信
    logErrorToDiag({
      errorId,
      endpoint: 'DELETE /api/my/organization',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      { error: 'Internal server error', errorId },
      { status: 500 }
    );
  }
}

// slugバリデーション関数
function validateSlug(slug: string): { isValid: boolean; error?: string } {
  if (!slug || typeof slug !== 'string') {
    return { isValid: false, error: 'Slug is required' };
  }
  
  // 空文字チェック
  if (slug.trim() === '') {
    return { isValid: false, error: 'Slug cannot be empty' };
  }
  
  // 全角文字チェック
  if (!/^[a-zA-Z0-9-_]+$/.test(slug)) {
    return { isValid: false, error: 'Slug must contain only alphanumeric characters, hyphens, and underscores' };
  }
  
  // 長さチェック
  if (slug.length < 2 || slug.length > 50) {
    return { isValid: false, error: 'Slug must be between 2 and 50 characters' };
  }
  
  // 予約語チェック
  const reservedSlugs = ['api', 'admin', 'www', 'mail', 'ftp', 'new', 'edit', 'delete', 'search'];
  if (reservedSlugs.includes(slug.toLowerCase())) {
    return { isValid: false, error: 'This slug is reserved and cannot be used' };
  }
  
  return { isValid: true };
}

// データ正規化ヘルパー関数
function normalizeOrganizationPayload(data: any) {
  const normalized = { ...data };
  
  // DATE型フィールド - 空文字をnullに変換
  const dateFields = ['founded'];
  
  // オプショナルテキストフィールド - 空文字をnullに変換
  const optionalTextFields = [
    'description', 'legal_form', 'representative_name',
    'address_region', 'address_locality', 'address_postal_code', 'address_street',
    'telephone', 'email', 'url', 'logo_url', 'meta_title', 'meta_description'
  ];
  
  // 日付フィールドの正規化
  dateFields.forEach(field => {
    if (normalized[field] === '') {
      normalized[field] = null;
    }
  });
  
  // オプショナルテキストフィールドの正規化
  optionalTextFields.forEach(field => {
    if (normalized[field] === '') {
      normalized[field] = null;
    }
  });
  
  // 数値フィールドの正規化
  if (normalized.capital === '') normalized.capital = null;
  if (normalized.employees === '') normalized.employees = null;
  
  return normalized;
}