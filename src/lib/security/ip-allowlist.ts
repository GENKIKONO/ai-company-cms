/**
 * IPアローリスト
 * Admin APIへのアクセスを特定IPアドレス/CIDRに制限
 *
 * 環境変数:
 *   ADMIN_ALLOWED_IPS: カンマ区切りのIPアドレス/CIDR（例: "192.168.1.0/24,10.0.0.0/8"）
 *   ADMIN_IP_ALLOWLIST_ENABLED: "true" で有効化（デフォルト: 無効）
 *
 * 使用例:
 *   const result = checkIPAllowlist(request);
 *   if (!result.allowed) {
 *     return forbiddenError('IP not allowed');
 *   }
 */

import { logger } from '@/lib/utils/logger';

interface IPCheckResult {
  allowed: boolean;
  clientIP: string;
  reason: string;
}

/**
 * クライアントIPアドレスを取得
 */
export function getClientIP(request: Request): string {
  // Vercel/Cloudflare等のプロキシ対応（優先順位順）
  const headers = request.headers;

  // Vercel
  const xForwardedFor = headers.get('x-forwarded-for');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }

  // Cloudflare
  const cfConnectingIP = headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // 一般的なプロキシ
  const xRealIP = headers.get('x-real-ip');
  if (xRealIP) {
    return xRealIP;
  }

  return 'unknown';
}

/**
 * IPアドレスがCIDRに含まれるか確認
 */
function isIPInCIDR(ip: string, cidr: string): boolean {
  // IPv4のみ対応
  const [range, bits] = cidr.split('/');
  const mask = bits ? parseInt(bits, 10) : 32;

  const ipNum = ipToNumber(ip);
  const rangeNum = ipToNumber(range);

  if (ipNum === null || rangeNum === null) {
    return false;
  }

  const maskNum = mask === 0 ? 0 : (~0 << (32 - mask)) >>> 0;

  return (ipNum & maskNum) === (rangeNum & maskNum);
}

/**
 * IPv4アドレスを数値に変換
 */
function ipToNumber(ip: string): number | null {
  const parts = ip.split('.');
  if (parts.length !== 4) {
    return null;
  }

  let num = 0;
  for (const part of parts) {
    const n = parseInt(part, 10);
    if (isNaN(n) || n < 0 || n > 255) {
      return null;
    }
    num = (num << 8) + n;
  }

  return num >>> 0; // 符号なし32ビット整数に変換
}

/**
 * IPアドレスがアローリストに含まれるか確認
 */
function isIPAllowed(clientIP: string, allowedList: string[]): boolean {
  if (allowedList.length === 0) {
    return true; // リストが空の場合は全て許可
  }

  for (const entry of allowedList) {
    const trimmed = entry.trim();
    if (!trimmed) continue;

    // CIDR記法の場合
    if (trimmed.includes('/')) {
      if (isIPInCIDR(clientIP, trimmed)) {
        return true;
      }
    } else {
      // 単一IPアドレスの場合
      if (clientIP === trimmed) {
        return true;
      }
    }
  }

  return false;
}

/**
 * IPアローリストチェック
 *
 * @param request - HTTPリクエスト
 * @returns チェック結果
 */
export function checkIPAllowlist(request: Request): IPCheckResult {
  const isEnabled = process.env.ADMIN_IP_ALLOWLIST_ENABLED === 'true';
  const clientIP = getClientIP(request);

  // 無効の場合は全て許可
  if (!isEnabled) {
    return {
      allowed: true,
      clientIP,
      reason: 'IP allowlist not enabled'
    };
  }

  // アローリスト取得
  const allowedIPs = process.env.ADMIN_ALLOWED_IPS?.split(',') || [];

  // リストが空の場合は警告を出して許可
  if (allowedIPs.length === 0 || (allowedIPs.length === 1 && !allowedIPs[0].trim())) {
    logger.warn('[IPAllowlist] ADMIN_IP_ALLOWLIST_ENABLED=true but ADMIN_ALLOWED_IPS is empty');
    return {
      allowed: true,
      clientIP,
      reason: 'Allowlist empty, allowing all'
    };
  }

  // IPチェック
  const allowed = isIPAllowed(clientIP, allowedIPs);

  if (!allowed) {
    logger.warn('[IPAllowlist] Access denied', {
      clientIP,
      allowedList: allowedIPs.join(', ')
    });
  }

  return {
    allowed,
    clientIP,
    reason: allowed ? 'IP in allowlist' : 'IP not in allowlist'
  };
}

/**
 * IPアローリスト設定情報を取得（診断用）
 */
export function getIPAllowlistConfig(): {
  enabled: boolean;
  allowedCount: number;
  configuredRanges: string[];
} {
  const isEnabled = process.env.ADMIN_IP_ALLOWLIST_ENABLED === 'true';
  const allowedIPs = process.env.ADMIN_ALLOWED_IPS?.split(',').filter(ip => ip.trim()) || [];

  return {
    enabled: isEnabled,
    allowedCount: allowedIPs.length,
    configuredRanges: isEnabled ? allowedIPs : []
  };
}
