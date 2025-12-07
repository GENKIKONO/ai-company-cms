/**
 * Edge Functions 用認証・認可ヘルパー
 * 
 * Supabase Assistant 回答準拠 (Q5, Q6, Q7):
 * - JWKS エンドポイントから公開鍵取得・JWT検証 (Q5)
 * - auth.jwt()はEdge Functionsで使用不可 (Q6)
 * - aud検証推奨（"authenticated"） (Q7)
 * - auth.getUser() 併用でユーザー情報取得
 * - P1-3 との整合性確保
 * - has_org_role RPC で組織認可
 */

import { type User } from 'npm:@supabase/supabase-js@2.45.4';
import * as jose from 'npm:jose@5.2.0'; // JWT検証用
import { createAuthenticatedClient } from './supabase.ts';
import { type EdgeLogger } from './logging.ts';

/**
 * 認証済みユーザー情報
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  user: User; // Supabase User オブジェクト
}

/**
 * 組織ロール定義 (P1-3 と統一)
 */
export type OrgRole = 'owner' | 'admin' | 'member' | 'viewer';

/**
 * 組織権限チェック結果
 */
export interface OrgAuthResult {
  user: AuthenticatedUser;
  organization_id: string;
  role: OrgRole;
  hasPermission: boolean;
}

/**
 * 認証エラー種別
 */
export class EdgeAuthError extends Error {
  constructor(
    message: string,
    public code: 'MISSING_AUTH' | 'INVALID_TOKEN' | 'USER_NOT_FOUND' | 'ORG_ACCESS_DENIED' | 'INSUFFICIENT_ROLE',
    public statusCode: number = 401
  ) {
    super(message);
    this.name = 'EdgeAuthError';
  }
}

// ============================================
// JWT検証関連 (Q5, Q7対応)
// ============================================

/**
 * JWKS キャッシュ
 * Edge Function起動時に初期化、メモリ内キャッシュ
 */
interface JWKSCache {
  keySet: jose.KeyLike | null;
  expiresAt: number;
}

let jwksCache: JWKSCache = { keySet: null, expiresAt: 0 };

/**
 * JWKS から公開鍵取得 (Q5対応)
 * プロジェクトの JWKS エンドポイントから公開鍵を取得・キャッシュ
 */
async function getJWKS(): Promise<jose.KeyLike> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL environment variable is required');
  }

  // キャッシュ確認
  const now = Date.now();
  if (jwksCache.keySet && now < jwksCache.expiresAt) {
    return jwksCache.keySet;
  }

  try {
    const jwksUrl = `${supabaseUrl}/auth/v1/.well-known/jwks.json`;
    const jwksResponse = await fetch(jwksUrl);
    
    if (!jwksResponse.ok) {
      throw new Error(`Failed to fetch JWKS: ${jwksResponse.status}`);
    }

    const jwks = await jwksResponse.json();
    const keySet = await jose.createLocalJWKSet(jwks);
    
    // 1時間キャッシュ
    jwksCache = {
      keySet,
      expiresAt: now + 3600000 // 1時間
    };

    return keySet;
  } catch (error) {
    throw new Error(`JWKS fetch failed: ${error.message}`);
  }
}

/**
 * JWT トークン検証 (Q5, Q7対応)
 * JWKS公開鍵とaud検証を含む厳密な検証
 */
async function verifyJWT(token: string): Promise<{ 
  payload: any; 
  header: any; 
}> {
  try {
    const keySet = await getJWKS();
    
    // JWT検証（署名・期限・aud）
    const { payload, protectedHeader } = await jose.jwtVerify(token, keySet, {
      audience: 'authenticated', // Q7: aud検証推奨
      issuer: Deno.env.get('SUPABASE_URL'), // issuerも検証
    });

    return { payload, header: protectedHeader };
  } catch (error) {
    throw new Error(`JWT verification failed: ${error.message}`);
  }
}

/**
 * Authorization ヘッダーから JWT トークン抽出
 */
function extractBearerToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7); // "Bearer " を除去
}

/**
 * リクエストからユーザー認証
 * 
 * @param request - HTTP Request
 * @param logger - ロガー
 * @param verifyMode - JWT検証モード: 'supabase' | 'direct' | 'both'
 * @returns 認証済みユーザー情報
 * @throws EdgeAuthError - 認証失敗時
 */
export async function authenticateUser(
  request: Request,
  logger: EdgeLogger,
  verifyMode: 'supabase' | 'direct' | 'both' = 'both'
): Promise<AuthenticatedUser> {
  // JWT トークン抽出
  const token = extractBearerToken(request);
  if (!token) {
    logger.warn('Missing Authorization header');
    throw new EdgeAuthError('Missing Authorization header', 'MISSING_AUTH', 401);
  }

  try {
    // 直接JWT検証 (Q5, Q7対応)
    if (verifyMode === 'direct' || verifyMode === 'both') {
      try {
        const { payload } = await verifyJWT(token);
        logger.info('Direct JWT verification successful', { 
          user_id: payload.sub,
          aud: payload.aud,
          exp: payload.exp 
        });
      } catch (jwtError) {
        logger.warn('Direct JWT verification failed', { error: jwtError.message });
        if (verifyMode === 'direct') {
          throw new EdgeAuthError('Invalid JWT token', 'INVALID_TOKEN', 401);
        }
        // 'both'モードの場合はSupabase検証にフォールバック
      }
    }

    // Supabase auth.getUser() で検証
    if (verifyMode === 'supabase' || verifyMode === 'both') {
      const supabase = createAuthenticatedClient(token);
      
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        logger.warn('Supabase user verification failed', { error: error.message });
        throw new EdgeAuthError('Invalid authentication token', 'INVALID_TOKEN', 401);
      }
      
      if (!user) {
        logger.warn('No user found from token');
        throw new EdgeAuthError('User not found', 'USER_NOT_FOUND', 401);
      }

      logger.info('User authenticated successfully', { 
        user_id: user.id,
        email: user.email,
        verification_mode: verifyMode
      });

      return {
        id: user.id,
        email: user.email || '',
        user,
      };
    }

    // directモードでJWT検証のみの場合
    const { payload } = await verifyJWT(token);
    
    // User オブジェクトは最小限の情報で構築
    const mockUser: User = {
      id: payload.sub,
      email: payload.email || '',
      // 他の必須フィールドはデフォルト値
      app_metadata: {},
      user_metadata: {},
      aud: payload.aud || 'authenticated',
      created_at: '', 
      role: payload.role || '',
      updated_at: ''
    } as User;

    return {
      id: payload.sub,
      email: payload.email || '',
      user: mockUser,
    };

  } catch (error) {
    if (error instanceof EdgeAuthError) {
      throw error;
    }
    
    logger.error('Authentication error', { error: (error as Error).message });
    throw new EdgeAuthError('Authentication failed', 'INVALID_TOKEN', 401);
  }
}

/**
 * 組織メンバーシップと権限チェック
 * P1-3 の has_org_role RPC を使用
 * 
 * @param user - 認証済みユーザー
 * @param organizationId - 組織ID
 * @param requiredRoles - 要求するロール配列
 * @param logger - ロガー
 * @returns 組織権限チェック結果
 * @throws EdgeAuthError - 権限不足時
 */
export async function checkOrgPermission(
  user: AuthenticatedUser,
  organizationId: string,
  requiredRoles: OrgRole[],
  logger: EdgeLogger
): Promise<OrgAuthResult> {
  logger.info('Checking organization permission', {
    user_id: user.id,
    organization_id: organizationId,
    required_roles: requiredRoles,
  });

  // authenticated クライアントで has_org_role RPC 呼び出し
  const supabase = createAuthenticatedClient();
  
  try {
    const { data: hasRole, error } = await supabase.rpc('has_org_role', {
      org_id: organizationId,
      wanted_roles: requiredRoles,
    });

    if (error) {
      logger.error('Organization role check failed', { 
        error: error.message,
        organization_id: organizationId,
      });
      throw new EdgeAuthError('Organization access check failed', 'ORG_ACCESS_DENIED', 403);
    }

    if (!hasRole) {
      logger.warn('Insufficient organization role', {
        user_id: user.id,
        organization_id: organizationId,
        required_roles: requiredRoles,
      });
      throw new EdgeAuthError(
        `Insufficient role. Required: ${requiredRoles.join('|')}`, 
        'INSUFFICIENT_ROLE', 
        403
      );
    }

    // ユーザーの実際のロールも取得
    const { data: memberData, error: memberError } = await supabase.rpc('get_org_member', {
      org_id: organizationId,
    });

    const userRole: OrgRole = memberData?.[0]?.role || 'viewer';

    logger.info('Organization permission granted', {
      user_id: user.id,
      organization_id: organizationId,
      user_role: userRole,
    });

    return {
      user,
      organization_id: organizationId,
      role: userRole,
      hasPermission: true,
    };
  } catch (error) {
    if (error instanceof EdgeAuthError) {
      throw error;
    }
    
    logger.error('Organization permission check error', { 
      error: (error as Error).message,
      organization_id: organizationId,
    });
    throw new EdgeAuthError('Organization access denied', 'ORG_ACCESS_DENIED', 403);
  }
}

/**
 * リクエストから組織ID抽出
 * URL パラメータまたは JSON ボディから取得
 * 
 * @param request - HTTP Request
 * @param url - 解析済みURL
 * @returns 組織ID
 */
export async function extractOrganizationId(
  request: Request,
  url: URL
): Promise<string | null> {
  // URL パラメータから取得 (?orgId=xxx)
  const fromQuery = url.searchParams.get('orgId') || url.searchParams.get('organization_id');
  if (fromQuery) {
    return fromQuery;
  }

  // パスパラメータから取得 (/api/org/{orgId}/...)  
  const pathSegments = url.pathname.split('/');
  const orgIndex = pathSegments.indexOf('org');
  if (orgIndex !== -1 && pathSegments[orgIndex + 1]) {
    return pathSegments[orgIndex + 1];
  }

  // JSON ボディから取得 (POST/PUT)
  if (request.method !== 'GET' && request.headers.get('content-type')?.includes('application/json')) {
    try {
      const body = await request.clone().json();
      return body.organization_id || body.orgId || null;
    } catch {
      // JSON パース失敗は無視
    }
  }

  return null;
}

/**
 * 組織コンテキストでの認証・認可チェック
 * Edge Function で最もよく使用される統合ヘルパー
 * 
 * @param request - HTTP Request
 * @param requiredRoles - 要求するロール配列
 * @param logger - ロガー
 * @returns 認証・認可済み結果
 */
export async function requireOrgAuth(
  request: Request,
  requiredRoles: OrgRole[],
  logger: EdgeLogger
): Promise<OrgAuthResult> {
  const url = new URL(request.url);
  
  // ユーザー認証
  const user = await authenticateUser(request, logger);
  
  // 組織ID抽出
  const organizationId = await extractOrganizationId(request, url);
  if (!organizationId) {
    logger.warn('Missing organization ID in request');
    throw new EdgeAuthError('Organization ID required', 'ORG_ACCESS_DENIED', 400);
  }

  // 組織権限チェック
  return await checkOrgPermission(user, organizationId, requiredRoles, logger);
}

/**
 * 基本認証のみ (組織チェックなし)
 * 
 * @param request - HTTP Request  
 * @param logger - ロガー
 * @returns 認証済みユーザー
 */
export async function requireAuth(
  request: Request,
  logger: EdgeLogger
): Promise<AuthenticatedUser> {
  return await authenticateUser(request, logger);
}