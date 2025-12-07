/**
 * CORS設定ユーティリティ
 * Q9, Q10の回答に基づく実装
 * - 動的Origin許可（allowlist方式）
 * - Preflight(OPTIONS)即時応答
 * - 標準ヘッダー + Vary: Origin
 */

// 許可するOriginのallowlist
const ALLOWED_ORIGINS = [
  'http://localhost:3000', // 開発環境
  'https://localhost:3000',
  'https://aiohub.jp',  // 本番環境（実際のドメインに変更）
  'https://www.aiohub.jp',
  // 環境変数から追加のOriginを許可
  ...(Deno.env.get('ALLOWED_ORIGINS')?.split(',') || [])
].filter(Boolean);

// 基本CORSヘッダー
const BASE_CORS_HEADERS = {
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'authorization,content-type,x-request-id,idempotency-key,x-client-info,apikey',
  'Access-Control-Allow-Credentials': 'false', // cookieを使わない前提
  'Access-Control-Max-Age': '86400', // 24時間
  'Vary': 'Origin'
} as const;

/**
 * リクエストOriginが許可されているかチェック
 */
function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  
  // 開発環境では*を許可
  if (Deno.env.get('ENVIRONMENT') === 'development') {
    return true;
  }
  
  return ALLOWED_ORIGINS.includes(origin);
}

/**
 * 動的OriginベースのCORSヘッダー生成
 */
export function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin');
  
  const headers = { ...BASE_CORS_HEADERS };
  
  if (origin && isAllowedOrigin(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  } else if (Deno.env.get('ENVIRONMENT') === 'development') {
    // 開発環境では*を設定
    headers['Access-Control-Allow-Origin'] = '*';
  }
  // 本番環境で不正なOriginの場合、Access-Control-Allow-Originは設定しない
  
  return headers;
}

/**
 * プリフライトリクエスト（OPTIONS）への標準応答
 */
export function handlePreflight(request: Request): Response {
  const corsHeaders = getCorsHeaders(request);
  
  return new Response(null, {
    status: 204, // No Content
    headers: corsHeaders
  });
}

/**
 * 通常のレスポンスにCORSヘッダーを追加
 */
export function addCorsHeaders(
  response: Response, 
  request: Request
): Response {
  const corsHeaders = getCorsHeaders(request);
  
  // 既存のheadersにCORSヘッダーを追加
  const newHeaders = new Headers(response.headers);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    newHeaders.set(key, value);
  });
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}

/**
 * エラーレスポンス用のCORSヘッダー付きResponse作成
 */
export function createCorsErrorResponse(
  error: { message: string; code?: string }, 
  status: number, 
  request: Request
): Response {
  const corsHeaders = getCorsHeaders(request);
  
  return new Response(
    JSON.stringify({ 
      error: error.message,
      code: error.code 
    }),
    {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    }
  );
}

/**
 * 成功レスポンス用のCORSヘッダー付きResponse作成
 */
export function createCorsResponse<T>(
  data: T,
  request: Request,
  status: number = 200
): Response {
  const corsHeaders = getCorsHeaders(request);
  
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    }
  );
}

// 後方互換のための既存のexport
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};