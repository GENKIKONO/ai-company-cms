import { PostgrestError } from '@supabase/supabase-js'

/**
 * 標準化されたエラーレスポンス型
 */
export interface StandardError {
  /** HTTPステータスコード */
  status: 401 | 403 | 404 | 409 | 422 | 500
  /** エラーコード（API統一用） */
  code: string
  /** ユーザー向けメッセージ */
  message: string
  /** デバッグ用の詳細情報 */
  details?: string
}

/**
 * Supabaseのエラーコードマッピング
 * PostgreSQLエラーコード参考: https://www.postgresql.org/docs/current/errcodes-appendix.html
 */
const POSTGRES_ERROR_MAP: Record<string, Pick<StandardError, 'status' | 'code' | 'message'>> = {
  // 認証系エラー
  '42501': { status: 403, code: 'INSUFFICIENT_PRIVILEGE', message: 'アクセス権限がありません' },
  
  // データ不整合エラー
  '23505': { status: 409, code: 'DUPLICATE_KEY', message: 'データが重複しています' },
  '23503': { status: 422, code: 'FOREIGN_KEY_VIOLATION', message: '関連するデータが見つかりません' },
  '23502': { status: 422, code: 'NOT_NULL_VIOLATION', message: '必須項目が入力されていません' },
  '23514': { status: 422, code: 'CHECK_CONSTRAINT_VIOLATION', message: '入力値が無効です' },
  
  // データ型・フォーマット系
  '22P02': { status: 422, code: 'INVALID_TEXT_REPRESENTATION', message: '入力値の形式が正しくありません' },
  '22023': { status: 422, code: 'INVALID_PARAMETER_VALUE', message: 'パラメータの値が無効です' },
  
  // リソース系
  '53300': { status: 500, code: 'TOO_MANY_CONNECTIONS', message: '一時的にサービスが混雑しています' },
  
  // その他のシステムエラー
  '08006': { status: 500, code: 'CONNECTION_FAILURE', message: 'データベース接続エラー' },
  '57014': { status: 500, code: 'QUERY_CANCELED', message: '処理がタイムアウトしました' },
}

/**
 * Supabaseのエラーメッセージパターンマッピング
 */
const MESSAGE_PATTERN_MAP: Array<{
  pattern: RegExp
  mapping: Pick<StandardError, 'status' | 'code' | 'message'>
}> = [
  // 認証関連
  {
    pattern: /JWT expired|Invalid JWT|User not found/i,
    mapping: { status: 401, code: 'AUTHENTICATION_REQUIRED', message: 'ログインが必要です' }
  },
  {
    pattern: /RLS policy|Row-level security/i,
    mapping: { status: 403, code: 'ACCESS_DENIED', message: 'このリソースにアクセスする権限がありません' }
  },
  
  // リソース未発見
  {
    pattern: /No rows found|not found/i,
    mapping: { status: 404, code: 'NOT_FOUND', message: '指定されたデータが見つかりません' }
  },
  
  // 重複・競合
  {
    pattern: /duplicate key value|already exists/i,
    mapping: { status: 409, code: 'CONFLICT', message: '既に存在するデータです' }
  },
  
  // バリデーション系
  {
    pattern: /invalid input|constraint violation/i,
    mapping: { status: 422, code: 'VALIDATION_ERROR', message: '入力データが無効です' }
  },
]

/**
 * Supabaseエラーを標準化されたエラーレスポンスにマッピング
 */
export function mapSupabaseError(error: PostgrestError | Error | unknown): StandardError {
  // PostgrestError（Supabase）の場合
  if (error && typeof error === 'object' && 'code' in error) {
    const pgError = error as PostgrestError
    
    // PostgreSQLエラーコードから直接マッピング
    if (pgError.code && POSTGRES_ERROR_MAP[pgError.code]) {
      const mapping = POSTGRES_ERROR_MAP[pgError.code]
      return {
        ...mapping,
        details: pgError.details || pgError.hint || pgError.message
      }
    }
    
    // メッセージパターンからマッピング
    const message = pgError.message || ''
    for (const { pattern, mapping } of MESSAGE_PATTERN_MAP) {
      if (pattern.test(message)) {
        return {
          ...mapping,
          details: pgError.details || pgError.hint || message
        }
      }
    }
    
    // 未分類のSupabaseエラー
    return {
      status: 500,
      code: 'SUPABASE_ERROR',
      message: 'データベース処理でエラーが発生しました',
      details: message
    }
  }
  
  // 一般的なエラー
  if (error instanceof Error) {
    return {
      status: 500,
      code: 'UNKNOWN_ERROR',
      message: 'システムエラーが発生しました',
      details: error.message
    }
  }
  
  // 不明なエラー
  return {
    status: 500,
    code: 'SYSTEM_ERROR',
    message: 'システムエラーが発生しました',
    details: String(error)
  }
}

/**
 * maybeSingle()の結果に対する統一的なハンドリング
 */
export function handleMaybeSingleResult<T>(
  result: { data: T | null; error: PostgrestError | null },
  resourceName: string = 'リソース'
): T {
  // エラーがある場合
  if (result.error) {
    throw mapSupabaseError(result.error)
  }
  
  // データが見つからない場合
  if (result.data === null) {
    const notFoundError: StandardError = {
      status: 404,
      code: 'NOT_FOUND',
      message: `${resourceName}が見つかりません`
    }
    throw notFoundError
  }
  
  return result.data
}

/**
 * 認証必須リソースの標準的な処理パターン
 * 1. メンバーシップ確認
 * 2. リソース取得
 */
export async function fetchAuthenticatedResource<T>(
  checkMembership: () => Promise<void>,
  fetchResource: () => Promise<{ data: T | null; error: PostgrestError | null }>,
  resourceName: string = 'リソース'
): Promise<T> {
  try {
    // Step 1: メンバーシップ確認
    await checkMembership()
    
    // Step 2: リソース取得
    const result = await fetchResource()
    return handleMaybeSingleResult(result, resourceName)
  } catch (error) {
    // 既にStandardError形式の場合はそのまま投げ直し
    if (error && typeof error === 'object' && 'status' in error && 'code' in error) {
      throw error
    }
    
    // それ以外はマッピングして投げ直し
    throw mapSupabaseError(error)
  }
}

/**
 * ErrorBoundary用のエラー判定ヘルパー
 */
export function isStandardError(error: unknown): error is StandardError {
  if (error === null || typeof error !== 'object') {
    return false;
  }
  const obj = error as Record<string, unknown>;
  return (
    typeof obj.status === 'number' &&
    typeof obj.code === 'string' &&
    typeof obj.message === 'string'
  );
}

/**
 * Next.js API Route用のエラーレスポンス生成
 */
export function createErrorResponse(error: unknown): Response {
  const standardError = isStandardError(error) ? error : mapSupabaseError(error)
  
  return Response.json(
    {
      error: {
        code: standardError.code,
        message: standardError.message,
        ...(process.env.NODE_ENV === 'development' && { details: standardError.details })
      }
    },
    { status: standardError.status }
  )
}

/**
 * 組織メンバーシップの確認（認証済みユーザー向け）
 * 2段階パターンの第1段階として使用
 */
export async function ensureMembership(
  supabase: any,
  userId: string,
  organizationId?: string
): Promise<{ organizationId: string }> {
  try {
    // 組織IDが指定されていない場合は、ユーザーの所属組織を取得
    let targetOrgId = organizationId;
    
    if (!targetOrgId) {
      const result = await supabase
        .from('organizations')
        .select('id')
        .eq('created_by', userId)
        .maybeSingle();

      const org = handleMaybeSingleResult<{ id: string }>(result, '所属組織');
      targetOrgId = org.id;
    }
    
    // 組織への所属確認（RLS経由で確認）
    const membershipResult = await supabase
      .from('organizations')
      .select('id')
      .eq('id', targetOrgId)
      .eq('created_by', userId)
      .maybeSingle();
    
    try {
      handleMaybeSingleResult(membershipResult, '組織のメンバーシップ');
      return { organizationId: targetOrgId };
    } catch (error) {
      // 404を403に変換（セキュリティ上、存在しないのか権限がないのかを隠す）
      if (isStandardError(error) && error.status === 404) {
        const accessDenied: StandardError = {
          status: 403,
          code: 'ACCESS_DENIED',
          message: 'この組織にアクセスする権限がありません'
        };
        throw accessDenied;
      }
      throw error;
    }
  } catch (error) {
    if (isStandardError(error)) {
      throw error;
    }
    throw mapSupabaseError(error);
  }
}

/**
 * 組織スコープのリソース取得パターン
 * Step 1: ensureMembership → Step 2: fetchResource
 */
export async function fetchOrganizationResource<T>(
  supabase: any,
  userId: string,
  tableName: string,
  resourceId: string,
  resourceName: string = 'リソース',
  organizationId?: string
): Promise<T> {
  // Step 1: メンバーシップ確認
  const { organizationId: confirmedOrgId } = await ensureMembership(
    supabase, 
    userId, 
    organizationId
  );
  
  // Step 2: リソース取得
  const result = await supabase
    .from(tableName)
    .select('*')
    .eq('id', resourceId)
    .eq('organization_id', confirmedOrgId)
    .maybeSingle();
  
  return handleMaybeSingleResult(result, resourceName);
}

/**
 * ユーザー専用リソース取得パターン
 * 組織IDは不要、ユーザーIDのみで制御
 */
export async function fetchUserResource<T>(
  supabase: any,
  userId: string,
  tableName: string,
  resourceId: string,
  resourceName: string = 'リソース'
): Promise<T> {
  const result = await supabase
    .from(tableName)
    .select('*')
    .eq('id', resourceId)
    .eq('user_id', userId)
    .maybeSingle();
  
  return handleMaybeSingleResult(result, resourceName);
}