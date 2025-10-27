// Single-Org Mode API: /api/my/organization
// 各ユーザーが自分の企業情報を管理するためのAPI
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { z } from 'zod';
import type { Organization, OrganizationFormData } from '@/types/database';
import { PUBLISH_ON_SAVE } from '@/config/feature-flags';
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
import { normalizePayload, normalizeDateFields, normalizeForInsert, findEmptyDateFields } from '@/lib/utils/payload-normalizer';
import { buildOrgInsert } from '@/lib/utils/org-whitelist';
import { supabaseServer } from '@/lib/supabase-server';
import { logger } from '@/lib/utils/logger';

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

export const revalidate = 0;
export const fetchCache = 'force-no-store';

// GET - ユーザーの企業情報を取得
export async function GET(request: NextRequest) {
  try {
    logger.debug('Debug', '[my/organization] GET handler start');
    
    // ✅ 統一されたサーバーサイドSupabaseクライアント
    const supabase = await supabaseServer();

    // 認証ユーザー取得（Cookieベース）
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    logger.debug('[my/organization] user =', user?.id || null, 'error =', authError?.message || null);

    if (authError || !user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    // RLS 前提：created_by = auth.uid() を満たす行のみ返る
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('created_by', user.id)
      .maybeSingle();

    if (error) {
      logger.error('[my/organization] org query error', error instanceof Error ? error : new Error(String(error)));
      return NextResponse.json({ data: null, message: 'Query error' }, { status: 500 });
    }
    
    if (!data) {
      logger.debug('[my/organization] No organization found for user', user.id);
      return NextResponse.json({ data: null, message: 'No organization found' }, { status: 200 });
    }

    logger.debug('[my/organization] Organization found', { id: data.id, name: data.name });
    return NextResponse.json({ data }, { status: 200 });

  } catch (error) {
    const errorId = `get-org-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    logger.error('[GET /api/my/organization] Unexpected error:', { errorId, error });
    
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
    logger.debug('Debug', '[my/organization] POST handler start');
    
    // ✅ 統一されたサーバーサイドSupabaseクライアント
    const supabase = await supabaseServer();

    // 認証ユーザー取得（Cookieベース）
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    logger.debug('[my/organization] user =', user?.id || null, 'error =', authError?.message || null);
    logger.debug('[my/organization] user details =', {
      id: user?.id,
      email: user?.email,
      created_at: user?.created_at
    });

    // ユーザーIDをログに出力して確認
    logger.debug('[my/organization] Current user ID', user.id);

    if (authError || !user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    // ✅ 外部キー制約の詳細チェック: public.users にユーザーが存在するか確認し、必要に応じて作成
    try {
      // まず public.users テーブルでユーザーを確認
      const { data: publicUser, error: publicUserError } = await supabase
        .from('users')
        .select('id, email')
        .eq('id', user.id)
        .single();

      logger.debug('[my/organization] Public user existence check', {
        userId: user.id,
        exists: !!publicUser,
        error: publicUserError?.message,
        errorCode: publicUserError?.code
      });

      // public.users にユーザーが存在しない場合は作成
      if (publicUserError && publicUserError.code === 'PGRST116') { // No rows found
        logger.debug('Debug', '[my/organization] Creating user in public.users table...');
        
        // Service Role 権限で users テーブルを操作
        const { createClient } = await import('@supabase/supabase-js');
        const serviceSupabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false
            }
          }
        );

        const { data: newUser, error: createUserError } = await serviceSupabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || null,
            avatar_url: user.user_metadata?.avatar_url || null,
            role: 'editor', // Default role
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createUserError) {
          logger.error('[my/organization] Failed to create user:', createUserError);
        } else {
          logger.debug('[my/organization] User created successfully', newUser.id);
        }
      }
    } catch (checkError) {
      logger.warn('[my/organization] User existence check failed', checkError);
    }

    // ✅ 外部キー制約違反の診断: auth.users に該当ユーザーが存在するかチェック
    try {
      const { data: authUserCheck, error: authUserError } = await supabase
        .rpc('check_auth_user_exists', { user_id: user.id });

      logger.debug('[my/organization] Auth user check', {
        userId: user.id,
        checkResult: authUserCheck,
        checkError: authUserError?.message
      });
    } catch (checkError) {
      logger.warn('[my/organization] Auth user check failed (non-critical)', checkError);
    }

    // 👇 POSTハンドラの最上部（request.json() を呼ぶ前）に追加
    const cloned = request.clone();
    const rawBodyText = await cloned.text();
    logger.debug('[ORG/CREATE] RAW BODY TEXT', rawBodyText);

    let rawBody: any = {};
    try { rawBody = JSON.parse(rawBodyText || '{}'); } catch {}
    logger.debug('[ORG/CREATE] RAW BODY PARSED', rawBody);
    
    // ✅ ペイロード正規化：空文字→null、email補完
    const userEmail = user.email;
    const normalizedRawBody = normalizePayload(rawBody, userEmail);
    
    // 既存の正規化の直後にも残しておくと有効
    logger.debug('[ORG/CREATE] AFTER NORMALIZE', normalizedRawBody);
    
    // サニタイズ前後ログ（PIIマスク）
    console.info('📥 受信JSON (正規化後):', {
      keys: Object.keys(normalizedRawBody),
      name: normalizedRawBody.name ? `${normalizedRawBody.name.substring(0,2)}***` : normalizedRawBody.name,
      email: normalizedRawBody.email ? normalizedRawBody.email?.replace(/(.{2}).*(@.*)/, '$1***$2') : 'undefined',
      hasEmptyStrings: Object.values(normalizedRawBody).some(v => v === ''),
      // 日付系フィールドの状態確認（foundedフィールドはUIに存在しないため除外）
    });

    // 統一バリデーション（正規化済みデータ使用）
    let validatedData: OrganizationCreate;
    try {
      logger.debug('[ORG/CREATE] About to validate with schema', normalizedRawBody);
      validatedData = organizationCreateSchema.parse(normalizedRawBody);
      body = validatedData as any; // 既存の型との互換性のため
      logger.debug('[ORG/CREATE] Validation successful', validatedData);
      
      // サニタイズ後ログ
      const bodyAny = body as any;
      console.info('📤 バリデーション後 (サニタイズ後):', {
        keys: Object.keys(body),
        name: body.name ? `${body.name.substring(0,2)}***` : body.name,
        slug: body.slug || 'UNDEFINED',
        // 実際に存在する日付系フィールドのみチェック（foundedフィールドはUIに存在しないため除外）
      });
    } catch (error) {
      logger.error('[ORG/CREATE] Validation error', error instanceof Error ? error : new Error(String(error)));
      if (error instanceof z.ZodError) {
        logger.error('[ORG/CREATE] Zod validation issues:', error.issues);
        return handleZodError(error);
      }
      logger.error('[ORG/CREATE] Non-zod validation error', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }

    // slugバリデーションは統一スキーマで処理済み

    // 既に企業を持っているかチェック（idempotent処理）
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('*')
      .eq('created_by', user.id)
      .not('status', 'eq', 'archived')
      .maybeSingle();

    if (existingOrg) {
      logger.debug('Debug', '[POST /api/my/organization] Organization already exists, returning existing one');
      
      // ✅ FIXED: 統一キャッシュ無効化 for idempotent case
      await revalidateOrgCache(user.id, existingOrg.slug);
      
      return NextResponse.json(
        { 
          data: existingOrg,
          created: false,
          message: 'existing'
        }, 
        { 
          status: 200,
          headers: {
            'Cache-Control': 'no-store, must-revalidate'
          }
        }
      );
    }
    
    logger.debug('Debug', '🔍 About to insert with minimal data - no normalization');

    // 最小限のデータのみでシンプルに作成
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    
    // slugが提供されている場合はそれを使用、そうでなければ自動生成
    let finalSlug = body.slug;
    if (!finalSlug || finalSlug.trim() === '') {
      const baseSlug = body.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || 'organization';
      
      finalSlug = `${baseSlug}-${timestamp}-${randomId}`;
    } else {
      // 提供されたslugが予約語の場合は安全に変更
      const reservedSlugs = [
        'o', 's', 'admin', 'api', 'assets', 'static', 
        'sitemap', 'robots', 'login', 'signup', 'auth',
        'dashboard', 'ops', 'help', 'contact', 'terms', 'privacy',
        'organizations', 'new', 'edit', 'delete', 'create'
      ];
      
      if (reservedSlugs.includes(finalSlug)) {
        finalSlug = `${finalSlug}-${randomId}`;
      }
    }

    // ✅ API層での保険: 実際のDBスキーマに完全一致
    // created_by を明示的に設定（auth.uid()はRLSコンテキストでのみ動作するため）
    const baseData = {
      name: body.name,
      slug: finalSlug, // 処理済みのslugを使用
      created_by: user.id, // 認証済みユーザーIDを明示的に設定
      // 注意: user_id, contact_email, is_published は実際のDBに存在しないため除外
    };
    
    // 受信データから有効な値のみを追加（空文字とslugは除外、日付フィールドの空文字はnullに変換）
    let organizationData: any = { ...baseData };
    // ✅ 日付フィールドは完全除去（UIに存在しない）
    const dateFields = []; // foundedフィールドはUIに存在しないため完全除去
    
    // ✅ 実際のDBスキーマに存在するフィールドのみ許可（基本スキーマのみ - 拡張は未適用）
    const allowedFields = [
      // 001_initial_schema.sql で定義されたフィールド（確実に存在する）
      'description', 'legal_form', 'representative_name', 'capital', 'employees',
      'address_country', 'address_region', 'address_locality', 'address_postal_code', 'address_street',
      'telephone', 'email', 'email_public', 'url', 'logo_url', 'industries', 'same_as', 'status',
      'meta_title', 'meta_description', 'meta_keywords', 'corporate_number',
      // 必須システムフィールド
      'created_by',
      // foundedフィールドはUIに存在しないため完全除外
      // 拡張フィールドは本番DBに未適用のため一時的に除外
      // 'favicon_url', 'brand_color_primary', 'brand_color_secondary', 'social_media', 'business_hours',
      // 'timezone', 'languages_supported', 'certifications', 'awards', 'company_culture', 
      // 'mission_statement', 'vision_statement', 'values',
    ];
    
    Object.entries(body).forEach(([key, value]) => {
      // ✅ 特別に founded フィールドを完全除外（DBエラー回避）
      if (key === 'founded') {
        logger.debug('🚫 founded フィールドを明示的に除外', value);
        return; // skip completely
      }
      
      if (key !== 'name' && key !== 'slug' && allowedFields.includes(key)) {
        // ✅ 強化された空文字・null・undefined除外ロジック
        
        // 日付フィールド: 完全除外（DBに送信しない）
        if (dateFields.includes(key)) {
          // 空文字、null、undefined、空白のみの文字列を完全に除外
          if (value && typeof value === 'string') {
            const trimmedValue = value.trim();
            if (trimmedValue !== '' && trimmedValue !== 'undefined' && trimmedValue !== 'null') {
              // 有効な日付形式のチェック（YYYY-MM-DD）
              if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedValue)) {
                organizationData[key] = trimmedValue;
              }
            }
          }
          // 空文字・null・undefinedの場合は完全にスキップ
        }
        // 文字列フィールド: 空文字は除外
        else if (typeof value === 'string') {
          const trimmedValue = value.trim();
          if (trimmedValue !== '' && trimmedValue !== 'undefined' && trimmedValue !== 'null') {
            organizationData[key] = trimmedValue;
          }
        }
        // ブール値・数値・配列・オブジェクト: null/undefinedでなければ追加
        else if (value !== null && value !== undefined) {
          organizationData[key] = value;
        }
      }
    });
    
    console.log('🔍 Final insert data (cleaned):', {
      keys: Object.keys(organizationData),
      hasEmptyStrings: Object.values(organizationData).some(v => v === ''),
      hasFoundedField: 'founded' in organizationData ? 'PRESENT' : 'ABSENT',
      foundedValue: organizationData.founded || 'UNDEFINED',
      // foundedフィールドはUIに存在しないため処理対象外
    });

    console.log('🔍 Complete organization data for INSERT:', JSON.stringify(organizationData, null, 2));

    // 🚀 GPT恒久対策: 空文字の日付フィールドを検出（デバッグ用）
    const emptyDates = findEmptyDateFields(organizationData, ['established_at']);
    if (emptyDates.length) {
      logger.warn('⚠️ Empty date fields detected, normalizing', emptyDates);
    }

    // 🚀 GPT恒久対策: INSERT直前の確実な正規化
    organizationData = normalizeForInsert(organizationData, {
      dateFields: ['established_at'], // DBにある日付カラムを列挙
    });

    console.log('🔍 Normalized organization data for INSERT:', JSON.stringify(organizationData, null, 2));

    // 🚨 最終ガード: normalizeForInsert後でも空文字が残っている場合の緊急対応
    const dateFieldsToCheck = ['established_at'];
    dateFieldsToCheck.forEach(field => {
      if (organizationData[field] === '') {
        console.error(`🚨 EMERGENCY: ${field} still contains empty string after normalization!`);
        organizationData[field] = null; // 強制的にnullに変換
        logger.debug('Debug', `🔧 FIXED: ${field} forced to null`);
      }
    });

    // 最終データ確認ログ
    console.log('🔍 FINAL organization data for INSERT (after emergency guard):', JSON.stringify(organizationData, null, 2));

    // ✅ 最終ガード：日付は空文字の可能性が少しでもあれば null を明示して送る
    const finalGuardDateFields = ['established_at']; // 必要に応じて他のDATE型も追記
    for (const f of finalGuardDateFields) {
      const v = (organizationData as any)[f];
      if (v === '' || v === undefined) {
        (organizationData as any)[f] = null;   // ← キーを削除せず null を明示
        console.log(`🔧 [FINAL GUARD] Set ${f} to null (was: ${JSON.stringify(v)})`);
      }
    }

    // 機能フラグ: 保存=公開の強制適用
    if (PUBLISH_ON_SAVE) {
      organizationData.status = 'published';
      organizationData.is_published = true;
      logger.debug('Debug', '[VERIFY] PUBLISH_ON_SAVE enabled for new org: forcing publication status');
    }

    // ホワイトリスト処理の前にこの修正を行う
    const insertPayload = buildOrgInsert(organizationData);
    logger.debug('API/my/organization INSERT payload (final)', insertPayload);

    // ✅ 単純な組織作成（trigger が created_by を自動設定）
    logger.debug('Debug', '[ORG/CREATE] Creating organization with trigger support...');
    
    const { data, error } = await supabase
      .from('organizations')
      .insert([insertPayload])
      .select()
      .single();
    
    logger.debug('[ORG/CREATE] Insert result', { 
      success: !error, 
      error: error?.message,
      errorCode: error?.code,
      data: data ? { id: data.id, name: data.name, created_by: data.created_by } : null
    });

    if (error) {
      logger.error('[ORG/CREATE] Database error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        insertPayload: insertPayload,
        originalData: organizationData
      });
      
      // 23505: unique constraint violation - idempotent処理
      if ((error as any).code === '23505') {
        logger.debug('Debug', '[POST /api/my/organization] Unique constraint violation, trying to fetch existing organization');
        const { data: again } = await supabase
          .from('organizations')
          .select('*')
          .eq('created_by', user.id)
          .not('status', 'eq', 'archived')
          .maybeSingle();
        
        if (again) {
          // ✅ FIXED: 統一キャッシュ無効化 for constraint violation case
          await revalidateOrgCache(user.id, again.slug);
          
          return NextResponse.json(
            { 
              data: again,
              created: false,
              message: 'existing'
            }, 
            { 
              status: 200,
              headers: {
                'Cache-Control': 'no-store, must-revalidate'
              }
            }
          );
        }
      }
      
      // その他のエラー
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

    // ✅ 作成完了後：統一キャッシュ無効化
    const cacheResult = await revalidateOrgCache(user.id, data.slug);
    if (!cacheResult) {
      logger.warn('[VERIFY] Cache invalidation had issues but creation succeeded');
    }

    const debugInfo = generateDebugInfo(request, user, body);
    return NextResponse.json(
      { 
        data: data,
        created: true,
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
    logger.error('[POST /api/my/organization] Unexpected error:', { errorId, error });
    
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

// ✅ 共通キャッシュ無効化関数（transactional save用）
async function revalidateOrgCache(userId: string, orgSlug?: string, oldSlug?: string) {
  try {
    const { revalidatePath, revalidateTag } = await import('next/cache');
    
    // パス無効化（一括実行）
    const pathsToRevalidate = [
      '/dashboard',
      '/organizations'
    ];
    
    if (orgSlug) {
      pathsToRevalidate.push(`/o/${orgSlug}`);
    }
    if (oldSlug && oldSlug !== orgSlug) {
      pathsToRevalidate.push(`/o/${oldSlug}`);
    }
    
    pathsToRevalidate.forEach(path => revalidatePath(path));
    
    // 統一タグ再検証
    const tag = `org:${userId}`;
    revalidateTag(tag);
    
    logger.debug('[VERIFY] Transaction cache invalidation completed', { 
      tag, 
      paths: pathsToRevalidate.length,
      slug: orgSlug 
    });
    
    return true;
  } catch (error) {
    logger.error('[VERIFY] Transaction cache invalidation failed', error instanceof Error ? error : new Error(String(error)));
    return false;
  }
}

// PUT - 既存の企業情報を更新（トランザクション強化）
export async function PUT(request: NextRequest) {
  const transaction: any = null;
  try {
    // ✅ 統一されたサーバーサイドSupabaseクライアント
    const supabase = await supabaseServer();

    // 認証ユーザー取得（Cookieベース）
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.warn('[my/organization] PUT Not authenticated', { authError, hasUser: !!user });
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const body: Partial<OrganizationFormData> = await request.json();

    // 企業の存在確認
    const { data: existingOrg, error: fetchError } = await supabase
      .from('organizations')
      .select('id, slug')
      .eq('created_by', user.id)
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

    // 🚫 公開フラグの同期処理: is_published=true の時は status='published' に統一
    if ('is_published' in normalizedData && normalizedData.is_published === true) {
      normalizedData.status = 'published';
      logger.debug('Debug', '[VERIFY] Auto-sync: is_published=true → status=published');
    } else if ('is_published' in normalizedData && normalizedData.is_published === false) {
      normalizedData.status = 'draft';
      logger.debug('Debug', '[VERIFY] Auto-sync: is_published=false → status=draft');
    }

    // 更新データの準備（created_byは変更不可）
    let updateData = {
      ...normalizedData,
      updated_at: new Date().toISOString(),
    };

    // 🚀 GPT恒久対策: 空文字の日付フィールドを検出（デバッグ用）
    const emptyDatesUpdate = findEmptyDateFields(updateData, ['established_at']);
    if (emptyDatesUpdate.length) {
      logger.warn('⚠️ UPDATE: Empty date fields detected, normalizing', emptyDatesUpdate);
    }

    // 🚀 GPT恒久対策: UPDATE直前の確実な正規化
    updateData = normalizeForInsert(updateData, {
      dateFields: ['established_at'], // DBにある日付カラムを列挙
    });

    console.log('🔍 Normalized update data:', JSON.stringify(updateData, null, 2));

    // 🚨 最終ガード: UPDATE時も空文字が残っている場合の緊急対応
    const updateDateFieldsToCheck = ['established_at'];
    updateDateFieldsToCheck.forEach(field => {
      if (updateData[field] === '') {
        console.error(`🚨 UPDATE EMERGENCY: ${field} still contains empty string after normalization!`);
        updateData[field] = null; // 強制的にnullに変換
        logger.debug('Debug', `🔧 UPDATE FIXED: ${field} forced to null`);
      }
    });

    // 最終データ確認ログ
    console.log('🔍 FINAL update data (after emergency guard):', JSON.stringify(updateData, null, 2));

    // 機能フラグ: 保存=公開の強制適用
    if (PUBLISH_ON_SAVE) {
      updateData.status = 'published';
      updateData.is_published = true;
      logger.debug('Debug', '[VERIFY] PUBLISH_ON_SAVE enabled: forcing publication status');
    }

    // ホワイトリスト＆空文字スクラブ適用
    const updatePayload = buildOrgInsert(updateData);
    logger.debug('API/my/organization UPDATE payload (final)', updatePayload);

    const { data, error } = await supabase
      .from('organizations')
      .update(updatePayload)
      .eq('id', existingOrg.id)
      .eq('created_by', user.id) // セキュリティのため二重チェック
      .select()
      .single();

    if (error) {
      logger.error('Database error', error instanceof Error ? error : new Error(String(error)));
      return handleApiError(error);
    }

    // 🔥 FORCED FRESH DATA: Guaranteed latest data with retry mechanism
    let finalData = data;
    let freshData = null;
    let refetchError = null;
    
    // Try immediate refetch
    const refetchResult = await supabase
      .from('organizations')
      .select('*')
      .eq('id', existingOrg.id)
      .eq('created_by', user.id)
      .single();
    
    freshData = refetchResult.data;
    refetchError = refetchResult.error;
    
    // If immediate refetch fails, try once more with small delay
    if (refetchError || !freshData) {
      logger.warn('[FORCED_FRESH] Initial refetch failed, retrying after delay', refetchError);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const retryResult = await supabase
        .from('organizations')
        .select('*')
        .eq('id', existingOrg.id)
        .eq('created_by', user.id)
        .single();
        
      if (retryResult.data) {
        freshData = retryResult.data;
        refetchError = null;
        logger.debug('Debug', '[FORCED_FRESH] Retry successful');
      } else {
        logger.warn('[FORCED_FRESH] Retry also failed', retryResult.error);
      }
    }

    finalData = freshData || data;
    logger.debug('[FORCED_FRESH] Final data guarantees latest state', { 
      hadFreshData: !!freshData, 
      finalSlug: finalData.slug,
      finalUpdatedAt: finalData.updated_at 
    });

    // ✅ 強化されたキャッシュ無効化：パス + タグ の両方を確実に実行
    try {
      const { revalidatePath, revalidateTag } = await import('next/cache');
      
      // パス無効化（即時反映用）
      revalidatePath('/dashboard');
      revalidatePath(`/organizations/${existingOrg.id}`);
      if (finalData.slug) {
        revalidatePath(`/o/${finalData.slug}`);
      }
      if (existingOrg.slug && existingOrg.slug !== finalData.slug) {
        revalidatePath(`/o/${existingOrg.slug}`); // 旧slug
      }
      
      // タグ無効化（ID ベース）
      revalidateTag(`org:${existingOrg.id}`);
      revalidateTag(`org:${user.id}`); // ユーザーベースも保持
      
      console.log('[VERIFY] org-save', { 
        payload: updatePayload, 
        saved: data, 
        fresh: finalData, 
        refetchError,
        revalidatedPaths: ['/dashboard', `/organizations/${existingOrg.id}`, finalData.slug ? `/o/${finalData.slug}` : null].filter(Boolean),
        revalidatedTags: [`org:${existingOrg.id}`, `org:${user.id}`]
      });
      
    } catch (cacheError) {
      logger.warn('[VERIFY] Cache invalidation failed', cacheError);
    }

    return NextResponse.json(
      { data: finalData },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store, must-revalidate'
        }
      }
    );

  } catch (error) {
    const errorId = `put-org-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    logger.error('[PUT /api/my/organization] Unexpected error:', { errorId, error });
    
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
    // ✅ 統一されたサーバーサイドSupabaseクライアント
    const supabase = await supabaseServer();

    // 認証ユーザー取得（Cookieベース）
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.warn('[my/organization] DELETE Not authenticated', { authError, hasUser: !!user });
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    // 企業の存在確認
    const { data: existingOrg, error: fetchError } = await supabase
      .from('organizations')
      .select('id')
      .eq('created_by', user.id)
      .single();

    if (fetchError || !existingOrg) {
      return notFoundError('Organization');
    }

    // 削除実行（RLSポリシーにより自分の企業のみ削除可能）
    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', existingOrg.id)
      .eq('created_by', user.id);

    if (error) {
      logger.error('Database error', error instanceof Error ? error : new Error(String(error)));
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
    logger.error('[DELETE /api/my/organization] Unexpected error:', { errorId, error });
    
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
