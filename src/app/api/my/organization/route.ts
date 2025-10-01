// Single-Org Mode API: /api/my/organization
// 各ユーザーが自分の企業情報を管理するためのAPI
import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { z } from 'zod';
import type { Organization, OrganizationFormData } from '@/types/database';
import { 
  organizationCreateSchema, 
  organizationUpdateSchema,
  type OrganizationCreate 
} from '@/lib/schemas/organization';
import { 
  requireAuth, 
  requireSelfServeAccess, 
  type AuthContext 
} from '@/lib/api/auth-middleware';
import {
  handleApiError,
  validationError,
  conflictError,
  notFoundError,
  handleZodError,
  unauthorizedError,
  createErrorResponse
} from '@/lib/api/error-responses';
import { normalizeOrganizationPayload } from '@/lib/utils/data-normalization';
import { normalizePayload } from '@/lib/utils/payload-normalizer';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// デバッグモード判定関数
function isDebugMode(request: NextRequest): boolean {
  return request.nextUrl.searchParams.get('debug') === '1';
}

// 管理者チェック関数
function isAdmin(userEmail?: string): boolean {
  return userEmail?.toLowerCase().trim() === env.ADMIN_EMAIL;
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
    // 統一認証チェック
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    // セルフサーブアクセスチェック
    const selfServeCheck = requireSelfServeAccess(authResult as AuthContext);
    if (selfServeCheck) {
      return selfServeCheck;
    }
    
    const cookieStore = await cookies();
    const supabase = createServerClient(
      env.SUPABASE_URL,
      env.SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch (error) {
              // Server Component での cookie 設定エラーをハンドル
            }
          },
        },
      }
    );

    // ユーザーの企業情報を取得（RLSポリシーにより自動的に自分の企業のみ取得）
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('created_by', (authResult as AuthContext).user.id)
      .single();

    if (error) {
      // 企業が存在しない場合（初回）
      if (error.code === 'PGRST116') {
        const debugInfo = generateDebugInfo(request, (authResult as AuthContext).user, null, error);
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
      const debugInfo = generateDebugInfo(request, (authResult as AuthContext).user, null, error);
      return createErrorResponse(
        'DATABASE_ERROR',
        'Failed to retrieve organization data',
        500,
        { originalError: error.message, ...(debugInfo && { debug: debugInfo }) }
      );
    }

    const debugInfo = generateDebugInfo(request, (authResult as AuthContext).user);
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
    
    return handleApiError(error);
  }
}

// POST - 新しい企業を作成（ユーザーが企業を持っていない場合のみ）
export async function POST(request: NextRequest) {
  let body: OrganizationFormData | null = null;
  try {
    // 統一認証チェック
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    // セルフサーブアクセスチェック
    const selfServeCheck = requireSelfServeAccess(authResult as AuthContext);
    if (selfServeCheck) {
      return selfServeCheck;
    }
    
    const cookieStore = await cookies();
    const supabase = createServerClient(
      env.SUPABASE_URL,
      env.SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch (error) {
              // Server Component での cookie 設定エラーをハンドル
            }
          },
        },
      }
    );

    const rawBody = await request.json();
    
    // ✅ ペイロード正規化：空文字→null、email補完
    const userEmail = (authResult as AuthContext).user.email;
    const normalizedRawBody = normalizePayload(rawBody, userEmail);
    
    // サニタイズ前後ログ（PIIマスク）
    console.info('📥 受信JSON (正規化後):', {
      keys: Object.keys(normalizedRawBody),
      name: normalizedRawBody.name ? `${normalizedRawBody.name.substring(0,2)}***` : normalizedRawBody.name,
      email: normalizedRawBody.email ? normalizedRawBody.email?.replace(/(.{2}).*(@.*)/, '$1***$2') : 'undefined',
      hasEmptyStrings: Object.values(normalizedRawBody).some(v => v === ''),
      // 日付系フィールドの状態確認
      ...(normalizedRawBody.founded !== undefined && { founded: normalizedRawBody.founded }),
    });

    // 統一バリデーション（正規化済みデータ使用）
    let validatedData: OrganizationCreate;
    try {
      validatedData = organizationCreateSchema.parse(normalizedRawBody);
      body = validatedData as any; // 既存の型との互換性のため
      
      // サニタイズ後ログ
      const bodyAny = body as any;
      console.info('📤 バリデーション後 (サニタイズ後):', {
        keys: Object.keys(body),
        name: body.name ? `${body.name.substring(0,2)}***` : body.name,
        slug: body.slug || 'UNDEFINED',
        // 日付系フィールドを型キャストで安全にチェック
        ...(bodyAny.establishment_date !== undefined && { establishment_date: bodyAny.establishment_date }),
        ...(bodyAny.founded !== undefined && { founded: bodyAny.founded }),
        ...(bodyAny.created_at !== undefined && { created_at: bodyAny.created_at }),
        ...(bodyAny.updated_at !== undefined && { updated_at: bodyAny.updated_at }),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return handleZodError(error);
      }
      throw error;
    }

    // slugバリデーションは統一スキーマで処理済み

    // 既に企業を持っているかチェック
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('created_by', (authResult as AuthContext).user.id)
      .single();

    if (existingOrg) {
      return conflictError('Organization', 'user');
    }
    
    console.log('🔍 About to insert with minimal data - no normalization');

    // 最小限のデータのみでシンプルに作成
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const baseSlug = body.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'organization';
    
    const uniqueSlug = `${baseSlug}-${timestamp}-${randomId}`;

    // ✅ API層での保険: 空文字を完全除外、slug競合回避
    const baseData = {
      name: body.name,
      slug: uniqueSlug, // 常にユニークなslugを使用
      created_by: (authResult as AuthContext).user.id,
      user_id: (authResult as AuthContext).user.id, // 必須フィールド
      contact_email: (authResult as AuthContext).user.email || '', // 必須フィールド
      is_published: false, // 必須フィールド
    };
    
    // 受信データから有効な値のみを追加（空文字とslugは除外、日付フィールドの空文字はnullに変換）
    const organizationData: any = { ...baseData };
    const dateFields = ['founded', 'established_at', 'establishment_date'];
    
    // データベースに存在する有効なフィールドのみ許可
    const allowedFields = [
      'description', 'legal_form', 'representative_name', 'founded', 'established_at', 'capital', 'employees',
      'address_country', 'address_region', 'address_locality', 'address_postal_code', 'address_street',
      'telephone', 'email', 'email_public', 'url', 'logo_url', 'industries', 'same_as', 'status',
      'meta_title', 'meta_description', 'meta_keywords', 'postal_code', 'street_address', 'corporate_type',
      'city', 'prefecture', 'country', 'phone', 'website_url'
    ];
    
    Object.entries(body).forEach(([key, value]) => {
      if (key !== 'name' && key !== 'slug' && allowedFields.includes(key)) {
        // 日付フィールドの場合、空文字をnullに変換
        if (dateFields.includes(key) && value === '') {
          organizationData[key] = null;
        }
        // その他のフィールドで有効な値のみを追加
        else if (value !== '' && value !== null && value !== undefined) {
          organizationData[key] = value;
        }
      }
    });
    
    console.log('🔍 Final insert data (cleaned):', {
      keys: Object.keys(organizationData),
      hasEmptyStrings: Object.values(organizationData).some(v => v === ''),
    });

    console.log('Simple organization data:', organizationData);

    const { data, error } = await supabase
      .from('organizations')
      .insert([organizationData])
      .select()
      .single();

    if (error) {
      console.error('Database error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        data: organizationData
      });
      
      // より具体的なエラーメッセージを返す
      return new Response(JSON.stringify({
        error: {
          code: 'DATABASE_ERROR',
          message: 'Database operation failed',
          details: error.message,
          hint: error.hint,
          timestamp: new Date().toISOString()
        }
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const debugInfo = generateDebugInfo(request, (authResult as AuthContext).user, body);
    return NextResponse.json(
      { 
        data: {
          id: data.id,
          name: data.name,
          slug: data.slug
        },
        message: 'created',
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
    
    return handleApiError(error);
  }
}

// PUT - 既存の企業情報を更新
export async function PUT(request: NextRequest) {
  try {
    // 統一認証チェック
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    // セルフサーブアクセスチェック
    const selfServeCheck = requireSelfServeAccess(authResult as AuthContext);
    if (selfServeCheck) {
      return selfServeCheck;
    }
    
    const cookieStore = await cookies();
    const supabase = createServerClient(
      env.SUPABASE_URL,
      env.SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch (error) {
              // Server Component での cookie 設定エラーをハンドル
            }
          },
        },
      }
    );

    const body: Partial<OrganizationFormData> = await request.json();

    // 企業の存在確認
    const { data: existingOrg, error: fetchError } = await supabase
      .from('organizations')
      .select('id, slug')
      .eq('created_by', (authResult as AuthContext).user.id)
      .single();

    if (fetchError || !existingOrg) {
      return notFoundError('Organization');
    }

    // slugが変更される場合、バリデーション  
    if (body.slug) {
      const slugValidation = validateSlug(body.slug);
      if (!slugValidation.isValid) {
        return validationError({ slug: slugValidation.error }, 'Slug validation failed');
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
        return conflictError('Organization', 'slug');
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
      .eq('created_by', (authResult as AuthContext).user.id) // セキュリティのため二重チェック
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return handleApiError(error);
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
    
    return handleApiError(error);
  }
}

// DELETE - 企業を削除（必要に応じて）
export async function DELETE(request: NextRequest) {
  try {
    // 統一認証チェック
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    // セルフサーブアクセスチェック
    const selfServeCheck = requireSelfServeAccess(authResult as AuthContext);
    if (selfServeCheck) {
      return selfServeCheck;
    }
    
    const cookieStore = await cookies();
    const supabase = createServerClient(
      env.SUPABASE_URL,
      env.SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch (error) {
              // Server Component での cookie 設定エラーをハンドル
            }
          },
        },
      }
    );

    // 企業の存在確認
    const { data: existingOrg, error: fetchError } = await supabase
      .from('organizations')
      .select('id')
      .eq('created_by', (authResult as AuthContext).user.id)
      .single();

    if (fetchError || !existingOrg) {
      return notFoundError('Organization');
    }

    // 削除実行（RLSポリシーにより自分の企業のみ削除可能）
    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', existingOrg.id)
      .eq('created_by', (authResult as AuthContext).user.id);

    if (error) {
      console.error('Database error:', error);
      return handleApiError(error);
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
    
    return handleApiError(error);
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

// 統一バリデーションスキーマを使用（既存のローカルスキーマは削除）

// データ正規化ヘルパー関数（強化版）
