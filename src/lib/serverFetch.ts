/**
 * serverFetch - 内部API呼び出し用ヘルパー
 *
 * 【重要】このヘルパーは常に「現在のオリジン」に対してAPIを呼び出す
 * - クライアントサイド: window.location.origin を使用
 * - サーバーサイド: headers() から host を取得
 * - これにより、Vercel preview / 本番 / ローカル全てで正しく動作する
 *
 * 禁止: NEXT_PUBLIC_SITE_URL や絶対URLでAPIを叩くこと（CSP違反・Cookie不一致の原因）
 */

const FALLBACK_BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001';

/**
 * 現在のオリジンを取得する
 * - クライアント: window.location.origin
 * - サーバー: headers() から host + x-forwarded-proto を組み立て
 */
async function getBaseUrl(): Promise<string> {
  // クライアントサイド: 現在のオリジンを使用
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  // サーバーサイド: headers からホストを取得
  try {
    const { headers } = await import('next/headers');
    const reqHeaders = await headers();
    const host = reqHeaders.get('host');
    const proto = reqHeaders.get('x-forwarded-proto') || 'https';
    if (host) {
      return `${proto}://${host}`;
    }
  } catch {
    // headers が取得できない場合（ビルド時など）
  }

  // 最終フォールバック（ローカル開発用）
  return FALLBACK_BASE;
}

export async function serverFetch(path: string, init: RequestInit = {}, cookieString?: string) {
  const baseUrl = await getBaseUrl();
  const url = new URL(path, baseUrl).toString();

  // サーバー側の場合、Cookieを動的に取得
  let cookie = cookieString || '';
  if (typeof window === 'undefined' && !cookieString) {
    try {
      const { headers } = await import('next/headers');
      const reqHeaders = await headers();
      cookie = reqHeaders.get('cookie') ?? '';
    } catch {
      // Client側またはheadersが取得できない場合は空文字
      cookie = '';
    }
  }

  return fetch(url, {
    ...init,
    headers: {
      ...(init.headers || {}),
      ...(cookie ? { cookie } : {}),
    },
    cache: 'no-store'
  });
}
