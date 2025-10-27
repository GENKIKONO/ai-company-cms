// APIレート制限とボット保護システム
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// レート制限設定
interface RateLimitConfig {
  windowMs: number; // 時間窓（ミリ秒）
  maxRequests: number; // 最大リクエスト数
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: NextRequest) => string;
  onLimitReached?: (req: NextRequest) => void;
}

// デフォルト設定
const DEFAULT_CONFIGS: Record<string, RateLimitConfig> = {
  default: {
    windowMs: 15 * 60 * 1000, // 15分
    maxRequests: 100,
  },
  auth: {
    windowMs: 15 * 60 * 1000, // 15分
    maxRequests: 5, // 認証は厳しく制限
  },
  api: {
    windowMs: 60 * 1000, // 1分
    maxRequests: 60,
  },
  search: {
    windowMs: 60 * 1000, // 1分
    maxRequests: 30,
  },
  upload: {
    windowMs: 60 * 1000, // 1分
    maxRequests: 10,
  }
};

// Supabaseクライアント（レート制限データ保存用）
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ボット検出パターン
const BOT_PATTERNS = [
  /bot/i,
  /crawl/i,
  /spider/i,
  /scrape/i,
  /curl/i,
  /wget/i,
  /python/i,
  /requests/i,
  /mechanize/i,
  /phantom/i,
  /headless/i,
];

// 悪意のあるIPパターン
const MALICIOUS_IP_PATTERNS = [
  /^10\./, // プライベートIPからの直接アクセス
  /^192\.168\./, // プライベートIP
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // プライベートIP
];

// IPアドレス取得
function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  const clientIP = req.headers.get('x-client-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  if (clientIP) {
    return clientIP;
  }
  
  return req.ip || 'unknown';
}

// User-Agent解析
function analyzeUserAgent(userAgent: string | null): {
  isBot: boolean;
  isSuspicious: boolean;
  botType?: string;
  risk: 'low' | 'medium' | 'high';
} {
  if (!userAgent) {
    return { isBot: true, isSuspicious: true, risk: 'high' };
  }

  const isBot = BOT_PATTERNS.some(pattern => pattern.test(userAgent));
  
  // 空のUser-Agentや異常に短い/長いものを検出
  const isSuspicious = userAgent.length < 10 || userAgent.length > 500 || 
    userAgent.includes('python') || userAgent.includes('curl');
  
  let botType: string | undefined;
  if (isBot) {
    if (/googlebot/i.test(userAgent)) botType = 'googlebot';
    else if (/bingbot/i.test(userAgent)) botType = 'bingbot';
    else if (/crawler/i.test(userAgent)) botType = 'crawler';
    else botType = 'unknown';
  }

  const risk = isBot && !['googlebot', 'bingbot'].includes(botType || '') ? 'high' : 
               isSuspicious ? 'medium' : 'low';

  return { isBot, isSuspicious, botType, risk };
}

// リクエスト記録と制限チェック
async function checkRateLimit(
  key: string, 
  config: RateLimitConfig,
  req: NextRequest
): Promise<{
  allowed: boolean;
  remaining: number;
  resetTime: number;
  total: number;
}> {
  const now = Date.now();
  const windowStart = now - config.windowMs;

  try {
    // 現在の時間窓内のリクエスト数を取得
    const { data: requests, error } = await supabase
      .from('rate_limit_requests')
      .select('id, created_at')
      .eq('key', key)
      .gte('created_at', new Date(windowStart).toISOString());

    if (error) {
      console.error('Rate limit check error:', error);
      // エラー時はデフォルトで許可（可用性重視）
      return { allowed: true, remaining: config.maxRequests, resetTime: now + config.windowMs, total: 0 };
    }

    const currentRequests = requests?.length || 0;
    const allowed = currentRequests < config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - currentRequests - 1);

    // リクエストを記録（制限内の場合）
    if (allowed) {
      const clientIP = getClientIP(req);
      const userAgent = req.headers.get('user-agent');
      const { isBot, isSuspicious, botType, risk } = analyzeUserAgent(userAgent);

      await supabase
        .from('rate_limit_requests')
        .insert({
          key,
          ip_address: clientIP,
          user_agent: userAgent,
          path: req.nextUrl.pathname,
          method: req.method,
          is_bot: isBot,
          is_suspicious: isSuspicious,
          bot_type: botType,
          risk_level: risk,
          created_at: new Date().toISOString()
        });
    }

    return {
      allowed,
      remaining,
      resetTime: now + config.windowMs,
      total: currentRequests
    };

  } catch (error) {
    console.error('Rate limit error:', error);
    // エラー時はデフォルトで許可
    return { allowed: true, remaining: config.maxRequests, resetTime: now + config.windowMs, total: 0 };
  }
}

// 悪意のあるリクエスト検出
function detectMaliciousRequest(req: NextRequest): {
  isMalicious: boolean;
  reason?: string;
  risk: 'low' | 'medium' | 'high' | 'critical';
} {
  const clientIP = getClientIP(req);
  const userAgent = req.headers.get('user-agent');
  const referer = req.headers.get('referer');
  const path = req.nextUrl.pathname;

  // 悪意のあるIPパターンチェック
  if (MALICIOUS_IP_PATTERNS.some(pattern => pattern.test(clientIP))) {
    return { isMalicious: true, reason: 'malicious_ip_pattern', risk: 'high' };
  }

  // SQLインジェクション試行の検出
  const sqlPatterns = [
    /union\s+select/i,
    /drop\s+table/i,
    /insert\s+into/i,
    /delete\s+from/i,
    /update\s+set/i,
    /\/\*.*\*\//,
    /--/,
    /;/,
  ];

  const url = req.nextUrl.toString();
  if (sqlPatterns.some(pattern => pattern.test(url))) {
    return { isMalicious: true, reason: 'sql_injection_attempt', risk: 'critical' };
  }

  // XSS試行の検出
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /onerror=/i,
    /onload=/i,
    /eval\(/i,
  ];

  if (xssPatterns.some(pattern => pattern.test(url))) {
    return { isMalicious: true, reason: 'xss_attempt', risk: 'critical' };
  }

  // パストラバーサル試行の検出
  if (path.includes('../') || path.includes('..\\') || path.includes('%2e%2e')) {
    return { isMalicious: true, reason: 'path_traversal_attempt', risk: 'high' };
  }

  // 異常に長いパスやクエリ
  if (url.length > 2000) {
    return { isMalicious: true, reason: 'abnormally_long_request', risk: 'medium' };
  }

  // User-Agentベースの検出
  const { risk } = analyzeUserAgent(userAgent);
  if (risk === 'high') {
    return { isMalicious: true, reason: 'suspicious_user_agent', risk: 'medium' };
  }

  return { isMalicious: false, risk: 'low' };
}

// ジオロケーションチェック（簡易版）
function checkGeolocation(req: NextRequest): {
  country?: string;
  isHighRisk: boolean;
} {
  const countryHeader = req.headers.get('cf-ipcountry') || 
                       req.headers.get('x-country-code') ||
                       req.headers.get('x-forwarded-country');

  // 高リスク国のリスト（例）
  const highRiskCountries = ['CN', 'RU', 'KP', 'IR'];
  
  const isHighRisk = countryHeader ? highRiskCountries.includes(countryHeader) : false;

  return {
    country: countryHeader || undefined,
    isHighRisk
  };
}

// メインのレート制限ミドルウェア
export async function rateLimitMiddleware(
  req: NextRequest,
  configName: keyof typeof DEFAULT_CONFIGS = 'default'
): Promise<NextResponse | null> {
  const config = DEFAULT_CONFIGS[configName];
  const clientIP = getClientIP(req);
  const path = req.nextUrl.pathname;
  
  // 悪意のあるリクエストチェック
  const maliciousCheck = detectMaliciousRequest(req);
  if (maliciousCheck.isMalicious) {
    // 悪意のあるリクエストをログ記録
    await supabase
      .from('security_incidents')
      .insert({
        ip_address: clientIP,
        user_agent: req.headers.get('user-agent'),
        path,
        method: req.method,
        incident_type: maliciousCheck.reason,
        risk_level: maliciousCheck.risk,
        blocked: true,
        created_at: new Date().toISOString()
      });

    return new NextResponse('Forbidden', { 
      status: 403,
      headers: {
        'X-RateLimit-Blocked': 'true',
        'X-Block-Reason': maliciousCheck.reason || 'malicious_request'
      }
    });
  }

  // ジオロケーションチェック
  const { country, isHighRisk } = checkGeolocation(req);
  
  // レート制限キー生成（IP + パス）
  const key = config.keyGenerator ? config.keyGenerator(req) : `${clientIP}:${path}`;
  
  // レート制限チェック
  const result = await checkRateLimit(key, config, req);
  
  // 高リスク地域からのアクセスの場合、制限を厳しくする
  if (isHighRisk && result.total > config.maxRequests * 0.5) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: {
        'X-RateLimit-Limit': config.maxRequests.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': result.resetTime.toString(),
        'X-RateLimit-Blocked': 'true',
        'X-Block-Reason': 'geo_risk_exceeded',
        'Retry-After': Math.ceil(config.windowMs / 1000).toString()
      }
    });
  }

  if (!result.allowed) {
    // 制限到達時のコールバック
    if (config.onLimitReached) {
      config.onLimitReached(req);
    }

    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: {
        'X-RateLimit-Limit': config.maxRequests.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': result.resetTime.toString(),
        'Retry-After': Math.ceil(config.windowMs / 1000).toString()
      }
    });
  }

  // レスポンスヘッダーに制限情報を追加
  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', result.resetTime.toString());
  
  if (country) {
    response.headers.set('X-Client-Country', country);
  }

  return null; // 制限なし、次のミドルウェアに進む
}

// レート制限統計取得
export async function getRateLimitStats(timeRange: '1h' | '24h' | '7d' = '24h') {
  const timeMap = {
    '1h': 1,
    '24h': 24,
    '7d': 24 * 7
  };

  const hoursBack = timeMap[timeRange];
  const startTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

  const { data: requests } = await supabase
    .from('rate_limit_requests')
    .select('*')
    .gte('created_at', startTime.toISOString());

  const { data: incidents } = await supabase
    .from('security_incidents')
    .select('*')
    .gte('created_at', startTime.toISOString());

  return {
    totalRequests: requests?.length || 0,
    botRequests: requests?.filter(r => r.is_bot).length || 0,
    suspiciousRequests: requests?.filter(r => r.is_suspicious).length || 0,
    securityIncidents: incidents?.length || 0,
    topIPs: Object.entries(
      requests?.reduce((acc: Record<string, number>, req) => {
        acc[req.ip_address] = (acc[req.ip_address] || 0) + 1;
        return acc;
      }, {}) || {}
    ).sort(([, a], [, b]) => b - a).slice(0, 10),
    riskDistribution: {
      low: requests?.filter(r => r.risk_level === 'low').length || 0,
      medium: requests?.filter(r => r.risk_level === 'medium').length || 0,
      high: requests?.filter(r => r.risk_level === 'high').length || 0,
      critical: requests?.filter(r => r.risk_level === 'critical').length || 0,
    }
  };
}