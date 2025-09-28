/**
 * 環境変数の安全読み出しユーティリティ
 * すべての環境変数をトリム・正規化して提供
 */

export const env = {
  APP_URL: (process.env.NEXT_PUBLIC_APP_URL || '').trim(),
  COOKIE_DOMAIN: (process.env.SUPABASE_COOKIE_DOMAIN || process.env.COOKIE_DOMAIN || '').trim(),
  ADMIN_EMAIL: (process.env.ADMIN_EMAIL || '').trim().toLowerCase(),
  ADMIN_OPS_PASSWORD: (process.env.ADMIN_OPS_PASSWORD || '').trim(),
  SHOW_BUILD_BANNER: process.env.SHOW_BUILD_BANNER === 'true',
} as const;

/**
 * eTLD+1ドメイン抽出（フォールバック用）
 */
export function extractDomainFromHost(host: string): string {
  if (host.includes('.')) {
    const parts = host.split('.');
    if (parts.length >= 2) {
      return `.${parts.slice(-2).join('.')}`;
    }
  }
  return host;
}

/**
 * Cookie用ドメイン取得（優先度順）
 */
export function getCookieDomain(request?: { headers: { get(name: string): string | null } }): string {
  if (env.COOKIE_DOMAIN) {
    return env.COOKIE_DOMAIN;
  }
  
  if (request) {
    const host = request.headers.get('host') || '';
    return extractDomainFromHost(host);
  }
  
  return '';
}