// Single-Org Mode API: /api/my/organization
// 各ユーザーが自分の企業情報を管理するためのAPI
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import type { Organization, OrganizationFormData } from '@/types/database';

// デバッグモード判定関数
function isDebugMode(request: NextRequest): boolean {
  return request.nextUrl.searchParams.get('debug') === '1';
}

// 管理者チェック関数
function isAdmin(userEmail?: string): boolean {
  return userEmail === process.env.ADMIN_EMAIL;
}

// デバッグ情報生成関数（管理者かつデバッグモードのみ）
function generateDebugInfo(request: NextRequest, user: any, payload?: any, error?: any) {
  if (!isDebugMode(request) || !isAdmin(user?.email)) {
    return null;
  }
  
  const debugInfo = {
    session: {
      user_id: user?.id || 'N/A',
      email: user?.email || 'N/A',
    },
    request: {
      url: request.url,
      method: request.method,
      timestamp: new Date().toISOString(),
    },
    payload: payload ? {
      ...payload,
      // 秘匿情報をマスク
      ...(payload.email ? { email: payload.email.replace(/(.{2}).*(@.*)/, '$1***$2') } : {}),
    } : undefined,
    error: error ? {
      message: error.message || 'Unknown error',
      code: error.code || 'UNKNOWN',
      details: error.details || error.hint || 'No additional details',
    } : undefined,
  };
  
  return debugInfo;
}

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

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

// GET - ユーザーの企業情報を取得
export async function GET(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    
    // 認証チェック
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      const debugInfo = generateDebugInfo(request, null, null, authError);
      return NextResponse.json(
        { 
          code: 'UNAUTHORIZED', 
          reason: authError ? `Server session error: ${authError.message}` : 'No supabase session cookie at server',
          ...(debugInfo && { debug: debugInfo })
        },
        { 
          status: 401,
          headers: {
            'Cache-Control': 'no-store, must-revalidate'
          }
        }
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
        const debugInfo = generateDebugInfo(request, authData.user, null, error);
        return NextResponse.json(
          { 
            data: null, 
            message: 'No organization found',
            ...(debugInfo && { debug: debugInfo })
          },
          { 
            status: 200,
            headers: {
              'Cache-Control': 'no-store, must-revalidate'
            }
          }
        );
      }
      console.error('Database error:', error);
      const debugInfo = generateDebugInfo(request, authData.user, null, error);
      return NextResponse.json(
        { 
          code: 'DATABASE_ERROR',
          reason: 'Failed to retrieve organization data',
          details: error.message,
          ...(debugInfo && { debug: debugInfo })
        },
        { status: 500 }
      );
    }

    const debugInfo = generateDebugInfo(request, authData.user);
    return NextResponse.json(
      { 
        data,
        ...(debugInfo && { debug: debugInfo })
      }, 
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store, must-revalidate'
        }
      }
    );

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
  let body: OrganizationFormData | null = null;
  try {
    const supabase = await supabaseServer();
    
    // 認証チェック
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      const debugInfo = generateDebugInfo(request, null, null, authError);
      return NextResponse.json(
        { 
          code: 'UNAUTHORIZED', 
          reason: authError ? `Server session error: ${authError.message}` : 'No supabase session cookie at server',
          ...(debugInfo && { debug: debugInfo })
        },
        { 
          status: 401,
          headers: {
            'Cache-Control': 'no-store, must-revalidate'
          }
        }
      );
    }

    body = await request.json();

    // 必須フィールドの検証
    if (!body || !body.name || !body.slug) {
      const debugInfo = generateDebugInfo(request, authData.user, body);
      return NextResponse.json(
        { 
          code: 'VALIDATION_ERROR',
          reason: 'Name and slug are required',
          details: 'Missing required fields',
          ...(debugInfo && { debug: debugInfo })
        },
        { status: 400 }
      );
    }

    // slugバリデーション
    const slugValidation = validateSlug(body.slug);
    if (!slugValidation.isValid) {
      const debugInfo = generateDebugInfo(request, authData.user, body, {
        message: slugValidation.error,
        code: 'SLUG_VALIDATION_FAILED'
      });
      return NextResponse.json(
        { 
          code: 'VALIDATION_ERROR',
          reason: 'Invalid slug format',
          details: slugValidation.error,
          ...(debugInfo && { debug: debugInfo })
        },
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
      const debugInfo = generateDebugInfo(request, authData.user, body);
      return NextResponse.json(
        { 
          code: 'UNIQUE_VIOLATION', 
          reason: 'User already has an organization',
          details: 'Each user can only create one organization',
          ...(debugInfo && { debug: debugInfo })
        },
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
      const debugInfo = generateDebugInfo(request, authData.user, body);
      return NextResponse.json(
        { 
          code: 'UNIQUE_VIOLATION', 
          reason: 'Slug already exists',
          details: 'Organization slug must be unique across all organizations',
          ...(debugInfo && { debug: debugInfo })
        },
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
      const debugInfo = generateDebugInfo(request, authData.user, body, error);
      
      // 制約違反の場合
      if (error.code === '23505') {
        if (error.message.includes('unique_organizations_created_by')) {
          return NextResponse.json(
            { 
              code: 'UNIQUE_VIOLATION', 
              reason: 'User already has an organization',
              details: 'Database constraint: unique_organizations_created_by',
              ...(debugInfo && { debug: debugInfo })
            },
            { status: 409 }
          );
        }
        if (error.message.includes('organizations_slug_key')) {
          return NextResponse.json(
            { 
              code: 'UNIQUE_VIOLATION', 
              reason: 'Slug already exists',
              details: 'Database constraint: organizations_slug_key',
              ...(debugInfo && { debug: debugInfo })
            },
            { status: 409 }
          );
        }
      }
      
      return NextResponse.json(
        { 
          code: 'DATABASE_ERROR',
          reason: 'Failed to create organization',
          details: error.message,
          ...(debugInfo && { debug: debugInfo })
        },
        { status: 500 }
      );
    }

    const debugInfo = generateDebugInfo(request, authData.user, body);
    return NextResponse.json(
      { 
        data,
        ...(debugInfo && { debug: debugInfo })
      }, 
      { 
        status: 201,
        headers: {
          'Cache-Control': 'no-store, must-revalidate'
        }
      }
    );

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
        { 
          code: 'UNAUTHORIZED', 
          reason: authError ? `Server session error: ${authError.message}` : 'No supabase session cookie at server'
        },
        { 
          status: 401,
          headers: {
            'Cache-Control': 'no-store, must-revalidate'
          }
        }
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
          { 
            code: 'CONFLICT', 
            reason: 'Slug already exists' 
          },
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
          { 
            code: 'CONFLICT', 
            reason: 'Slug already exists' 
          },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { data },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store, must-revalidate'
        }
      }
    );

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
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    
    // 認証チェック
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return NextResponse.json(
        { 
          code: 'UNAUTHORIZED', 
          reason: authError ? `Server session error: ${authError.message}` : 'No supabase session cookie at server'
        },
        { 
          status: 401,
          headers: {
            'Cache-Control': 'no-store, must-revalidate'
          }
        }
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

    return NextResponse.json(
      { message: 'Organization deleted successfully' },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store, must-revalidate'
        }
      }
    );

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