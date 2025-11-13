/**
 * サーバーサイドで適切なベースURLを解決するユーティリティ
 * Vercel本番環境やローカル開発環境に対応
 */

import { headers } from 'next/headers';
import { logger } from '@/lib/utils/logger';

/**
 * サーバーサイドでのベースURL解決
 * - 本番: x-forwarded-proto と host ヘッダーから構築
 * - ローカル: 相対パスを推奨、絶対URL必要時のみフォールバック
 */
export async function resolveBaseUrl(): Promise<string> {
  try {
    const headersList = await headers();
    const host = headersList.get('host');
    const proto = headersList.get('x-forwarded-proto') || 'https';
    
    if (host) {
      return `${proto}://${host}`;
    }
    
    // フォールバック: 環境変数 (本番ビルド時にも安全なデフォルト値を提供)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    return appUrl;
  } catch (error) {
    logger.error('[resolveBaseUrl] Error', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * 相対パスを絶対URLに変換（必要時のみ使用）
 */
export async function resolveApiUrl(path: string): Promise<string> {
  if (path.startsWith('/')) {
    const baseUrl = await resolveBaseUrl();
    return `${baseUrl}${path}`;
  }
  return path;
}

/**
 * 内部API呼び出し用ヘッダー生成
 */
export async function createInternalHeaders(reqHeaders?: Headers): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  
  if (reqHeaders) {
    const cookie = reqHeaders.get('cookie');
    if (cookie) {
      headers.Cookie = cookie;
    }
  }
  
  return headers;
}