/**
 * Edge Functions 用 Supabase クライアント初期化
 * 
 * Supabase Assistant 回答準拠 (Q1, Q3, Q7, Q8, Q20):
 * - supabase-js v2系、バージョン固定 (Q3)
 * - service_role最小限利用、テナント分離必須 (Q20)
 * - HTTP経由のためDB接続プール設定不要 (Q1)
 * - aud検証推奨、point lookup優先 (Q7, Q8)
 * - 環境変数は自動注入
 */

import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2.45.4';

// 環境変数の型定義 (自動注入される変数)
interface EdgeFunctionEnv {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SUPABASE_DB_URL: string;
}

/**
 * 環境変数取得・検証
 */
function getEnv(): EdgeFunctionEnv {
  const env = {
    SUPABASE_URL: Deno.env.get('SUPABASE_URL'),
    SUPABASE_ANON_KEY: Deno.env.get('SUPABASE_ANON_KEY'), 
    SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
    SUPABASE_DB_URL: Deno.env.get('SUPABASE_DB_URL'),
  };

  // 必須環境変数の検証
  const missing = Object.entries(env)
    .filter(([_, value]) => !value)
    .map(([key, _]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return env as EdgeFunctionEnv;
}

// 環境変数キャッシュ (Edge Function起動時に1回だけ取得)
const ENV = getEnv();

/**
 * authenticated ユーザー用 Supabase クライアント
 * RLS有効、通常のアプリケーションロジック用
 * 
 * @param authToken - JWT token from Authorization header
 */
export function createAuthenticatedClient(authToken?: string): SupabaseClient {
  const client = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: authToken ? {
        'Authorization': `Bearer ${authToken}`,
      } : {},
    },
  });

  return client;
}

/**
 * service_role 用 Supabase クライアント  
 * RLSバイパス、最小限利用、必ず監査ログとセットで使用
 * 
 * ⚠️ 使用時の必須要件 (Q20):
 * - service_role_audit テーブルへの監査ログ記録必須
 * - 事前にユーザー認証・認可チェック完了していること
 * - 必要最小限の操作のみに使用
 * - テナント分離（organization_id等での絞り込み）必須
 * - 誤クエリ対策として共通DAOでtenant_idを必須引数化推奨
 */
export function createServiceRoleClient(): SupabaseClient {
  const client = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        'X-Client-Info': 'edge-function/service-role'
      }
    }
  });

  return client;
}

/**
 * 匿名用 Supabase クライアント
 * 認証不要のpublic操作用
 */
export function createAnonymousClient(): SupabaseClient {
  const client = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return client;
}

/**
 * Edge Function 向け標準設定
 */
export const EDGE_FUNCTION_CONFIG = {
  // supabase-js バージョン (統一用)
  SUPABASE_JS_VERSION: '2.45.4',
  
  // タイムアウト設定
  DEFAULT_TIMEOUT_MS: 30000, // 30秒
  
  // リトライ設定
  DEFAULT_RETRY_ATTEMPTS: 3,
  DEFAULT_RETRY_DELAY_MS: 1000,
  
  // ログレベル
  LOG_LEVELS: ['debug', 'info', 'warn', 'error'] as const,
} as const;

export type LogLevel = typeof EDGE_FUNCTION_CONFIG.LOG_LEVELS[number];

// ==================================================
// テナント分離・セキュリティヘルパー (Q20対応)
// ==================================================

/**
 * テナント分離されたクエリビルダー
 * service_role使用時の誤クエリ対策
 */
export function withTenantFilter<T>(
  queryBuilder: any,
  organizationId: string,
  tenantColumn: string = 'organization_id'
): T {
  if (!organizationId) {
    throw new Error('Tenant ID (organization_id) is required for service_role operations');
  }
  
  return queryBuilder.eq(tenantColumn, organizationId);
}

/**
 * auth.users テーブルへの安全なアクセス (Q8対応)
 * Point lookupのみ、必要カラムのみ取得
 */
export async function getUserSafely(
  client: SupabaseClient, 
  userId: string,
  columns: string[] = ['id', 'email', 'email_confirmed_at']
): Promise<{ data: any | null; error: any }> {
  if (!userId) {
    return { data: null, error: new Error('User ID is required') };
  }

  // PK/ユニークキーによるpoint lookup
  const { data, error } = await client
    .from('auth.users') // 注意: auth スキーマは管理者権限が必要
    .select(columns.join(','))
    .eq('id', userId)
    .single();

  return { data, error };
}

// ==================================================
// 同時実行制御 (Q1対応)
// ==================================================

/**
 * 同時実行数制御クラス
 * リクエスト同時実行をアプリ側で制御
 */
export class ConcurrencyLimiter {
  private running = 0;
  private queue: Array<() => void> = [];
  
  constructor(private limit: number = 10) {} // デフォルト10並列
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const runner = async () => {
        this.running++;
        try {
          const result = await operation();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.running--;
          this.processQueue();
        }
      };
      
      if (this.running < this.limit) {
        runner();
      } else {
        this.queue.push(runner);
      }
    });
  }
  
  private processQueue() {
    if (this.queue.length > 0 && this.running < this.limit) {
      const next = this.queue.shift();
      if (next) next();
    }
  }
  
  getStatus() {
    return {
      running: this.running,
      queued: this.queue.length,
      limit: this.limit
    };
  }
}

/**
 * デフォルトの同時実行制御インスタンス
 * 関数間で共有される
 */
export const defaultConcurrencyLimiter = new ConcurrencyLimiter(5); // 保守的な設定

// ==================================================
// 環境変数・設定ヘルパー
// ==================================================

/**
 * 環境変数の安全な取得
 */
export function getEnvVar(name: string, required: boolean = true): string | undefined {
  const value = Deno.env.get(name);
  if (required && !value) {
    throw new Error(`Required environment variable ${name} is missing`);
  }
  return value;
}

/**
 * Edge Function のメタデータ取得
 */
export function getEdgeFunctionMeta(): {
  functionName?: string;
  requestId?: string;
  region?: string;
} {
  return {
    functionName: getEnvVar('SUPABASE_FUNCTION_NAME', false),
    requestId: getEnvVar('REQUEST_ID', false),
    region: getEnvVar('SUPABASE_REGION', false)
  };
}