import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from './lib/security/rate-limit';
import { generateNonce } from './lib/security/nonce';

interface SecurityHeaders {
  [key: string]: string;
}

// レート制限設定
const RATE_LIMITS = {
  '/api/admin': { requests: 10, window: 60000 }, // 10req/min
  '/api': { requests: 100, window: 60000 },      // 100req/min
  default: { requests: 200, window: 60000 }      // 200req/min
};

// IP制限（管理API用）
const ADMIN_ALLOWED_IPS = process.env.ADMIN_ALLOWED_IPS?.split(',') || [];
const ADMIN_API_PREFIX = '/api/admin';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const clientIP = getClientIP(request);
  const method = request.method;
  
  // 1. 管理API IP制限
  if (pathname.startsWith(ADMIN_API_PREFIX)) {
    if (ADMIN_ALLOWED_IPS.length > 0 && !ADMIN_ALLOWED_IPS.includes(clientIP)) {
      return new NextResponse('Forbidden', { status: 403 });
    }
    
    // 管理APIはGET以外禁止（RPC呼び出しのみ）
    if (method !== 'GET' && !pathname.includes('/webhooks/')) {
      return new NextResponse('Method Not Allowed', { status: 405 });
    }
  }

  // 2. レート制限チェック
  const rateLimitKey = pathname.startsWith('/api/admin') ? '/api/admin' :
                      pathname.startsWith('/api') ? '/api' : 'default';
  const limit = RATE_LIMITS[rateLimitKey] || RATE_LIMITS.default;
  
  const rateLimitResult = await rateLimit(
    `${clientIP}:${rateLimitKey}`,
    limit.requests,
    limit.window
  );
  
  if (!rateLimitResult.success) {
    return new NextResponse('Too Many Requests', { 
      status: 429,
      headers: {
        'Retry-After': Math.ceil(rateLimitResult.retryAfter / 1000).toString(),
        'X-RateLimit-Limit': limit.requests.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(Date.now() + rateLimitResult.retryAfter).toISOString()
      }
    });
  }

  // 3. リクエストサイズ制限
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) { // 10MB
    return new NextResponse('Payload Too Large', { status: 413 });
  }

  // 4. セキュリティヘッダ設定
  const response = NextResponse.next();
  const nonce = generateNonce();
  
  const securityHeaders: SecurityHeaders = {
    // XSS Protection
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    
    // HTTPS/Transport Security
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Content Security Policy
    'Content-Security-Policy': [
      `default-src 'self'`,
      `script-src 'self' 'nonce-${nonce}' https://js.stripe.com`,
      `style-src 'self' 'nonce-${nonce}'`,
      `img-src 'self' data: https:`,
      `connect-src 'self' https://*.supabase.co https://api.stripe.com`,
      `font-src 'self'`,
      `object-src 'none'`,
      `base-uri 'self'`,
      `form-action 'self'`,
      `frame-ancestors 'none'`,
      `block-all-mixed-content`,
      `upgrade-insecure-requests`,
      `report-uri /api/csp-report`,
      `report-to csp-reports`
    ].join('; '),
    
    // CSP Report Configuration
    'Report-To': JSON.stringify({
      group: 'csp-reports',
      max_age: 86400,
      endpoints: [{ url: '/api/csp-report' }]
    }),
    
    // Permissions Policy
    'Permissions-Policy': [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=(self)',
      'usb=()',
      'interest-cohort=()'
    ].join(', '),
    
    // Custom Security Headers
    'X-Nonce': nonce,
    'X-Rate-Limit-Limit': limit.requests.toString(),
    'X-Rate-Limit-Remaining': rateLimitResult.remaining.toString(),
  };

  // 5. Cookie セキュリティ設定
  if (pathname.startsWith('/auth') || pathname.startsWith('/api/auth')) {
    securityHeaders['Set-Cookie'] = [
      'SameSite=Strict',
      'Secure',
      'HttpOnly',
      'Path=/',
      `Max-Age=${7 * 24 * 60 * 60}` // 7 days
    ].join('; ');
  }

  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // 6. CSRF対策（非GET、webhookと認証済みダッシュボードAPIは除外）
  const isExemptFromCSRF = pathname.includes('/webhooks/') || 
                          pathname.startsWith('/api/my/') || 
                          pathname.startsWith('/api/dashboard/');
  
  if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS' && !isExemptFromCSRF) {
    const csrfToken = request.headers.get('x-csrf-token');
    const sessionToken = request.cookies.get('session')?.value;
    
    if (!validateCSRFToken(csrfToken, sessionToken)) {
      return new NextResponse('CSRF token invalid', { status: 403 });
    }
  }

  return response;
}

function getClientIP(request: NextRequest): string {
  // Vercel/Edge function IP取得
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

function validateCSRFToken(token: string | null, session: string | null): boolean {
  if (!token || !session) return false;
  
  try {
    const crypto = require('crypto');
    const expected = crypto
      .createHmac('sha256', process.env.CSRF_SECRET || 'default-secret')
      .update(session)
      .digest('hex');
    
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}

export const config = {
  matcher: [
    '/api/:path*',
    '/dashboard/:path*',
    '/auth/:path*'
  ]
};