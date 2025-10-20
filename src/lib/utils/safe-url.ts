import { NextRequest } from 'next/server';

/**
 * 安全なベースURL取得（フォールバック付き）
 * NEXT_PUBLIC_APP_URL未設定時はリクエストヘッダーから構築
 */
export function getSafeBaseUrl(request?: NextRequest): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  
  if (envUrl) {
    return envUrl;
  }

  // フォールバック: リクエストから組み立て
  if (request) {
    const proto = request.headers.get('x-forwarded-proto') ?? 
                  request.headers.get('x-forwarded-protocol') ??
                  'https';
    const host = request.headers.get('x-forwarded-host') ?? 
                 request.headers.get('host') ?? 
                 'localhost:3000';
    
    const origin = `${proto}://${host}`;
    
    // フォールバック発動の警告ログ（機密情報なし）
    console.warn('[SafeURL] Using request-derived URL fallback');
    
    return origin;
  }

  // 最終フォールバック
  return 'http://localhost:3000';
}

/**
 * 安全なURL構築
 */
export function buildSafeUrl(path: string, request?: NextRequest): string {
  const baseUrl = getSafeBaseUrl(request);
  return new URL(path, baseUrl).toString();
}