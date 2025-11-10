// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
// import { rateLimitMiddleware } from './src/middleware/rateLimit';

// 公開ルート（常に素通し）
const PUBLIC_PATHS = new Set([
  '/', '/help', '/contact', '/terms', '/privacy',
  '/auth/login', '/login',
  '/auth/signin',
  '/auth/signup', '/signup',
  '/auth/confirm',
  '/auth/forgot-password',
  '/auth/reset-password-confirm',
  '/search',
]);

// 要ログインのプレフィックス  
const PROTECTED_PREFIXES = ['/dashboard', '/settings', '/profile'];

// 管理者専用パス（admin判定が必要）
const ADMIN_PATHS = ['/management-console'];

// 🔒 Phase 4.5 - HTTP Basic認証の保護対象パス定義
// 
// ✅ 絶対に守らない・誰でも見れていいパス（Basic認証除外）
const PUBLIC_PATHS_BASIC_AUTH = [
  '/',
  '/pricing', 
  '/hearing-service'
];

const PUBLIC_PATH_PREFIXES_BASIC_AUTH = [
  '/api/public/'
];

// 🔒 Basic認証で守るパス（本番環境でアクセス制御）
const BASIC_AUTH_PROTECTED_PATHS = [
  /^\/dashboard/,    // 管理ダッシュボード
  /^\/admin/,        // 管理者機能
  /^\/api\/admin/    // 管理者API
  // 将来の拡張用（現在無効）:
  // /^\/internal/   // 内部システム用ページ
];

// 🎛️ Basic認証制御：3段階チェック
// 1. DISABLE_APP_BASIC_AUTH='true' → 完全無効化
// 2. DASHBOARD_BASIC_USER & DASHBOARD_BASIC_PASS 両方存在 → Basic認証有効
// 3. どちらかが未設定 → Basic認証スキップ（事故防止）

// 半公開ルート（ディレクトリ表示は公開、編集は要ログイン）
const SEMI_PUBLIC_PREFIXES = ['/organizations'];

// 認証系ページ（ログイン済ならリダイレクト）
const AUTH_PAGES = new Set([
  '/auth/login', '/login',
  '/auth/signin',
  '/auth/signup', '/signup',
  '/auth/forgot-password',
  '/auth/reset-password-confirm',
]);

export async function middleware(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { pathname } = req.nextUrl;

    // Next内部・API・静的リソースは対象外
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api') ||
      pathname === '/favicon.ico' ||
      pathname === '/robots.txt' ||
      pathname === '/sitemap.xml' ||
      pathname.startsWith('/og-image') ||
      pathname.match(/\.(ico|png|jpg|jpeg|gif|svg|css|js|woff|woff2|ttf|eot|webp)$/)
    ) {
      return NextResponse.next();
    }

    console.log(`[Middleware] Processing: ${pathname}`);

    // 🔒 HTTP Basic Authentication for admin paths (Phase 4.5 - Production Guard)
    const basicAuthResult = await checkBasicAuthentication(req, pathname);
    if (basicAuthResult.blocked) {
      return basicAuthResult.response;
    }

    // 🛡️ Enhanced Rate Limiting and Security - Use integrated system
    const guardResult = await enhancedSecurityGuard(req, pathname, startTime);
    if (guardResult.blocked) {
      return guardResult.response;
    }

  // 公開パスは認証チェック不要
  if (PUBLIC_PATHS.has(pathname)) {
    console.log(`[Middleware] Public path, skipping auth: ${pathname}`);
    return NextResponse.next();
  }

  // Supabase SSR クライアント（セキュアCookie設定付き）
  const res = NextResponse.next();
  const isProduction = process.env.NODE_ENV === 'production';
  const domain = isProduction && process.env.NEXT_PUBLIC_APP_URL?.includes('aiohub.jp') 
    ? '.aiohub.jp' 
    : undefined;
    
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => req.cookies.get(name)?.value,
        set: (name: string, value: string, options: any) => {
          const secureOptions = {
            ...options,
            sameSite: 'lax' as const,
            secure: isProduction,
            domain,
            path: '/',
            httpOnly: false, // Supabase needs client access to auth tokens
          };
          res.cookies.set(name, value, secureOptions);
        },
        remove: (name: string, options: any) => {
          const secureOptions = {
            ...options,
            sameSite: 'lax' as const,
            secure: isProduction,
            domain,
            path: '/',
            maxAge: 0,
          };
          res.cookies.set(name, '', secureOptions);
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const isAuthed = !!user;
  const isProtected = PROTECTED_PREFIXES.some(p => pathname.startsWith(p));
  const isSemiPublic = SEMI_PUBLIC_PREFIXES.some(p => pathname.startsWith(p));
  const isAuthPage = AUTH_PAGES.has(pathname);
  const isAdminPath = ADMIN_PATHS.some(p => pathname.startsWith(p));

  console.log(`[Middleware] Auth check: ${pathname}, isAuthed: ${isAuthed}, isProtected: ${isProtected}, isAuthPage: ${isAuthPage}`);

  // 半公開ルートの処理（/organizations/new や /organizations/[id]/edit は要ログイン）
  const requiresAuthInSemiPublic = isSemiPublic && (
    pathname.includes('/new') || 
    pathname.includes('/edit') ||
    pathname.match(/\/organizations\/[^\/]+\/(edit|settings)$/)
  );

  // 未ログインで保護ページ、または半公開の編集ページ、または管理者ページに来たら /auth/login に intended redirect 付きで送る
  if (!isAuthed && (isProtected || requiresAuthInSemiPublic || isAdminPath)) {
    const loginUrl = new URL('/auth/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 管理者ページの場合は追加チェック（ログイン済みでも非管理者は /dashboard へ）
  if (isAdminPath && isAuthed) {
    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(email => email.trim()) || [];
    const isAdmin = user?.app_metadata?.role === 'admin' || adminEmails.includes(user?.email || '');
    
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  // ログイン済みで認証系ページに来たら /dashboard へ
  if (isAuthed && isAuthPage) {
    const redirectParam = req.nextUrl.searchParams.get('redirect');
    const target =
      redirectParam && PROTECTED_PREFIXES.some(p => redirectParam.startsWith(p))
        ? redirectParam
        : '/dashboard';
    return NextResponse.redirect(new URL(target, req.url));
  }

    // Add comprehensive security headers to response
    addSecurityHeaders(res, isProduction);
    res.headers.set('X-Response-Time', `${Date.now() - startTime}ms`);
    
    // それ以外はそのまま通過
    return res;
  } catch (error) {
    console.error('[Middleware] Exception caught:', error);
    // 例外時は素通り（フォールバック）
    return NextResponse.next();
  }
}

// 🛡️ Enhanced Security Guard with comprehensive protection
async function enhancedSecurityGuard(
  req: NextRequest, 
  pathname: string, 
  startTime: number
): Promise<{ blocked: boolean; response?: NextResponse }> {
  try {
    const ip = getClientIP(req);
    const userAgent = req.headers.get('user-agent') || '';
    const method = req.method;
    
    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // 1. WAF-like protection - detect malicious patterns
    const wafResult = await webApplicationFirewall(req, pathname);
    if (wafResult.blocked) {
      await logSecurityIncident(supabase, ip, userAgent, pathname, method, 'WAF_BLOCK', wafResult.reason || 'malicious_pattern');
      return {
        blocked: true,
        response: new NextResponse('Forbidden', { status: 403 })
      };
    }
    
    // 2. Enhanced rate limiting with database integration
    const rateLimitResult = await checkEnhancedRateLimit(supabase, ip, userAgent, pathname, method);
    if (rateLimitResult.exceeded) {
      await logSecurityIncident(supabase, ip, userAgent, pathname, method, 'RATE_LIMIT', 'rate_limit_exceeded');
      return {
        blocked: true,
        response: new NextResponse('Too Many Requests', { 
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': (Date.now() + 60000).toString()
          }
        })
      };
    }
    
    // 3. CSRF protection for state-changing operations
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      const csrfResult = await validateCSRF(req);
      if (!csrfResult.valid) {
        await logSecurityIncident(supabase, ip, userAgent, pathname, method, 'CSRF_VIOLATION', 'invalid_csrf_token');
        return {
          blocked: true,
          response: new NextResponse('CSRF token invalid', { status: 403 })
        };
      }
    }
    
    // 4. Log successful request
    await logRateLimitRequest(supabase, ip, userAgent, pathname, method, false);
    
    return { blocked: false };
    
  } catch (error) {
    console.error('Enhanced security guard error:', error);
    return { blocked: false };
  }
}

// WAF (Web Application Firewall) implementation
async function webApplicationFirewall(req: NextRequest, pathname: string): Promise<{
  blocked: boolean;
  reason?: string;
}> {
  const url = req.nextUrl.toString();
  const userAgent = req.headers.get('user-agent') || '';
  
  // SQL Injection patterns
  const sqlPatterns = [
    /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
    /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
    /union[^a-z]*select/i,
    /drop[^a-z]*table/i,
    /insert[^a-z]*into/i,
    /delete[^a-z]*from/i,
    /update[^a-z]*set/i,
  ];
  
  // XSS patterns
  const xssPatterns = [
    /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
    /<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi,
    /javascript:/i,
    /on\w+\s*=/i,
    /eval\s*\(/i,
    /expression\s*\(/i,
  ];
  
  // Path traversal patterns
  const pathTraversalPatterns = [
    /\.\.\/|\.\.\\|\.\.[\/\\]/i,
    /%2e%2e%2f|%2e%2e%5c/i,
    /etc\/passwd|boot\.ini|win\.ini/i,
  ];
  
  // Check all patterns
  const allPatterns = [...sqlPatterns, ...xssPatterns, ...pathTraversalPatterns];
  
  for (const pattern of allPatterns) {
    if (pattern.test(url) || pattern.test(userAgent)) {
      if (sqlPatterns.includes(pattern)) return { blocked: true, reason: 'sql_injection_attempt' };
      if (xssPatterns.includes(pattern)) return { blocked: true, reason: 'xss_attempt' };
      if (pathTraversalPatterns.includes(pattern)) return { blocked: true, reason: 'path_traversal_attempt' };
    }
  }
  
  // Check for suspicious user agents
  const suspiciousAgents = [
    /sqlmap/i,
    /nikto/i,
    /nessus/i,
    /burp/i,
    /w3af/i,
    /dirbuster/i,
  ];
  
  for (const agent of suspiciousAgents) {
    if (agent.test(userAgent)) {
      return { blocked: true, reason: 'malicious_user_agent' };
    }
  }
  
  return { blocked: false };
}

// Enhanced rate limiting with database integration
async function checkEnhancedRateLimit(
  supabase: any, 
  ip: string, 
  userAgent: string, 
  pathname: string,
  method: string
): Promise<{
  exceeded: boolean;
  limit: number;
  current: number;
}> {
  try {
    // Get rate limit configuration from database
    const { data: config } = await supabase
      .from('rate_limit_configs')
      .select('*')
      .eq('is_active', true)
      .or(`path_pattern.is.null,path_pattern.like.${pathname}%`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    const windowMs = config?.window_ms || 900000; // 15 minutes default
    const maxRequests = config?.max_requests || 100;
    
    const now = new Date();
    const windowStart = new Date(now.getTime() - windowMs);
    
    // Count recent requests
    const { data: recentRequests } = await supabase
      .from('rate_limit_requests')
      .select('id')
      .eq('ip_address', ip)
      .gte('created_at', windowStart.toISOString());
    
    const currentCount = recentRequests?.length || 0;
    
    return {
      exceeded: currentCount >= maxRequests,
      limit: maxRequests,
      current: currentCount
    };
    
  } catch (error) {
    console.error('Enhanced rate limit check error:', error);
    return { exceeded: false, limit: 100, current: 0 };
  }
}

// CSRF protection
async function validateCSRF(req: NextRequest): Promise<{ valid: boolean; reason?: string }> {
  // Skip CSRF for API routes (they should use API keys/tokens)
  if (req.nextUrl.pathname.startsWith('/api/')) {
    return { valid: true };
  }
  
  // Check for CSRF token in headers
  const csrfToken = req.headers.get('x-csrf-token') || req.headers.get('x-requested-with');
  const referer = req.headers.get('referer');
  const origin = req.headers.get('origin');
  
  // Simple origin validation
  if (origin) {
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_APP_URL,
      'http://localhost:3000',
      'https://localhost:3000'
    ].filter(Boolean);
    
    if (!allowedOrigins.some(allowed => origin.startsWith(allowed!))) {
      return { valid: false, reason: 'invalid_origin' };
    }
  }
  
  // Check X-Requested-With header (AJAX requests)
  if (csrfToken === 'XMLHttpRequest') {
    return { valid: true };
  }
  
  // For now, we'll be lenient but this should be strengthened
  return { valid: true };
}

// Log security incidents
async function logSecurityIncident(
  supabase: any,
  ip: string,
  userAgent: string,
  path: string,
  method: string,
  incidentType: string,
  reason: string
): Promise<void> {
  try {
    await supabase
      .from('security_incidents')
      .insert({
        ip_address: ip,
        user_agent: userAgent,
        path,
        method,
        incident_type: incidentType,
        risk_level: getRiskLevel(incidentType),
        blocked: true,
        details: { reason, timestamp: new Date().toISOString() }
      });
  } catch (error) {
    console.error('Error logging security incident:', error);
  }
}

// Log rate limit requests
async function logRateLimitRequest(
  supabase: any,
  ip: string,
  userAgent: string,
  path: string,
  method: string,
  isBot: boolean
): Promise<void> {
  try {
    await supabase
      .from('rate_limit_requests')
      .insert({
        key: `${ip}:${path}`,
        ip_address: ip,
        user_agent: userAgent,
        path,
        method,
        is_bot: isBot,
        is_suspicious: detectSuspiciousActivity(userAgent, path),
        risk_level: getRiskLevel(isBot ? 'bot_request' : 'normal_request')
      });
  } catch (error) {
    console.error('Error logging rate limit request:', error);
  }
}

// Helper functions
function getRiskLevel(incidentType: string): string {
  const riskMap: Record<string, string> = {
    'sql_injection_attempt': 'critical',
    'xss_attempt': 'critical',
    'path_traversal_attempt': 'high',
    'malicious_user_agent': 'high',
    'CSRF_VIOLATION': 'medium',
    'RATE_LIMIT': 'medium',
    'bot_request': 'low',
    'normal_request': 'low'
  };
  return riskMap[incidentType] || 'medium';
}

function detectSuspiciousActivity(userAgent: string, path: string): boolean {
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(userAgent)) ||
         path.includes('admin') ||
         path.includes('wp-admin') ||
         path.includes('.env');
}

// 🛡️ AI Visibility Guard Functions (Legacy - keeping for compatibility)
async function aiVisibilityGuard(
  req: NextRequest, 
  pathname: string, 
  startTime: number
): Promise<{ blocked: boolean; response?: NextResponse }> {
  try {
    const ip = getClientIP(req);
    const userAgent = req.headers.get('user-agent') || '';
    const method = req.method;
    const referer = req.headers.get('referer') || '';
    
    // Initialize Supabase client for logging (service role for write access)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // 1. Check if IP is blocked
    if (await isIPBlocked(supabase, ip)) {
      await logAccess(supabase, ip, userAgent, pathname, method, 403, startTime, 'IP_BLOCKED');
      return {
        blocked: true,
        response: new NextResponse('Access Denied', { status: 403 })
      };
    }
    
    // 2. Check rate limits
    const rateLimitResult = await checkRateLimit(supabase, ip, userAgent, pathname);
    if (rateLimitResult.exceeded) {
      if (rateLimitResult.shouldBlock) {
        await autoBlockIP(supabase, ip, 'Rate limit exceeded multiple times');
      }
      
      await logAccess(supabase, ip, userAgent, pathname, method, 429, startTime, 'RATE_LIMITED');
      return {
        blocked: true,
        response: new NextResponse('Too Many Requests', { 
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': (Date.now() + 60000).toString()
          }
        })
      };
    }
    
    // 3. Check bot access permissions
    const botCheck = analyzeBotAccess(userAgent, pathname);
    if (!botCheck.allowed) {
      await logAccess(supabase, ip, userAgent, pathname, method, 403, startTime, 'BOT_BLOCKED');
      return {
        blocked: true,
        response: new NextResponse('Bot Access Denied', { 
          status: 403,
          headers: {
            'X-Robots-Tag': 'noindex, nofollow'
          }
        })
      };
    }
    
    // 4. Block access to protected paths for bots
    if (isProtectedPath(pathname) && detectBotType(userAgent) !== 'browser') {
      await logAccess(supabase, ip, userAgent, pathname, method, 403, startTime, 'PROTECTED_PATH');
      return {
        blocked: true,
        response: new NextResponse('Forbidden', { status: 403 })
      };
    }
    
    // 5. Log successful access
    await logAccess(supabase, ip, userAgent, pathname, method, 200, startTime, 'ALLOWED');
    
    return { blocked: false };
    
  } catch (error) {
    console.error('AI Visibility Guard error:', error);
    // Don't block on error, just log
    return { blocked: false };
  }
}

function getClientIP(req: NextRequest): string {
  // Try various headers for IP detection (Vercel/Cloudflare compatible)
  const xForwardedFor = req.headers.get('x-forwarded-for');
  const xRealIP = req.headers.get('x-real-ip');
  const cfConnectingIP = req.headers.get('cf-connecting-ip');
  const vercelForwardedFor = req.headers.get('x-vercel-forwarded-for');
  
  if (cfConnectingIP) return cfConnectingIP;
  if (vercelForwardedFor) return vercelForwardedFor;
  if (xRealIP) return xRealIP;
  if (xForwardedFor) return xForwardedFor.split(',')[0].trim();
  
  return '127.0.0.1'; // fallback
}

async function isIPBlocked(supabase: any, ip: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('blocked_ips')
      .select('*')
      .eq('ip_address', ip)
      .eq('is_active', true)
      .or('blocked_until.is.null,blocked_until.gt.now()')
      .maybeSingle();
    
    if (error) {
      console.error('Error checking blocked IP:', error);
      return false;
    }
    return !!data;
  } catch (error) {
    console.error('Error checking blocked IP:', error);
    return false;
  }
}

async function checkRateLimit(
  supabase: any, 
  ip: string, 
  userAgent: string, 
  pathname: string
): Promise<{
  exceeded: boolean;
  shouldBlock: boolean;
  limit: number;
  current: number;
}> {
  try {
    const now = new Date();
    const windowStart = new Date(now.getTime() - 10000); // 10 seconds window
    
    // Count recent requests from this IP
    const { data: recentRequests, error } = await supabase
      .from('rate_limit_logs')
      .select('*')
      .eq('ip_address', ip)
      .gte('timestamp', windowStart.toISOString())
      .order('timestamp', { ascending: false });
    
    if (error) {
      console.error('Error checking rate limit:', error);
      return { exceeded: false, shouldBlock: false, limit: 10, current: 0 };
    }
    
    const requestCount = recentRequests?.length || 0;
    const botType = detectBotType(userAgent);
    const limit = getBotRateLimit(botType, pathname);
    
    // Check if should auto-block (multiple violations in last minute)
    const recentViolations = recentRequests?.filter(req => 
      req.limit_exceeded && 
      new Date(req.timestamp).getTime() > now.getTime() - 60000
    ) || [];
    const shouldBlock = recentViolations.length >= 3;
    
    return {
      exceeded: requestCount >= limit,
      shouldBlock,
      limit,
      current: requestCount
    };
  } catch (error) {
    console.error('Error checking rate limit:', error);
    return { exceeded: false, shouldBlock: false, limit: 10, current: 0 };
  }
}

function detectBotType(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  
  if (ua.includes('googlebot') || ua.includes('bingbot')) {
    return 'search_engine';
  }
  if (ua.includes('gptbot') || ua.includes('ccbot') || ua.includes('perplexitybot')) {
    return 'ai_crawler';
  }
  if (ua.includes('bot') || ua.includes('crawler') || ua.includes('spider')) {
    return 'scraper';
  }
  if (!ua || ua.length < 10) {
    return 'suspicious';
  }
  
  return 'browser';
}

function getBotRateLimit(botType: string, pathname: string): number {
  const limits = {
    search_engine: 10,
    ai_crawler: 5,
    scraper: 1,
    suspicious: 1,
    browser: 3
  };
  
  return limits[botType as keyof typeof limits] || 3;
}

function analyzeBotAccess(userAgent: string, pathname: string): {
  allowed: boolean;
  robotsTag?: string;
} {
  const ua = userAgent.toLowerCase();
  
  // Allow all access to search engines
  if (ua.includes('googlebot') || ua.includes('bingbot')) {
    return { allowed: true, robotsTag: 'index, follow' };
  }
  
  // AI crawlers only allowed in /o/ path or essential files
  if (ua.includes('gptbot') || ua.includes('ccbot') || ua.includes('perplexitybot')) {
    const allowed = pathname.startsWith('/o/') || 
                   pathname === '/robots.txt' || 
                   pathname === '/sitemap.xml' ||
                   pathname === '/';
    return { 
      allowed, 
      robotsTag: allowed ? 'index, follow' : 'noindex, nofollow' 
    };
  }
  
  // Block empty or suspicious user agents on sensitive paths
  if ((!ua || ua.length < 10 || ua === 'unknown') && isProtectedPath(pathname)) {
    return { allowed: false, robotsTag: 'noindex, nofollow' };
  }
  
  // Allow normal browsers and unknown bots on public content
  return { allowed: true };
}

function isProtectedPath(pathname: string): boolean {
  const protectedPaths = [
    '/dashboard',
    '/api/auth',
    '/billing',
    '/checkout',
    '/preview',
    '/webhooks',
    '/admin',
    '/management-console',
    '/settings'
  ];
  
  return protectedPaths.some(protectedPath => pathname.startsWith(protectedPath));
}

async function autoBlockIP(supabase: any, ip: string, reason: string): Promise<void> {
  try {
    await supabase.rpc('auto_block_ip', {
      target_ip: ip,
      block_reason: reason,
      block_duration_minutes: 60 // 1 hour temporary block
    });
  } catch (error) {
    console.error('Error auto-blocking IP:', error);
  }
}

async function logAccess(
  supabase: any,
  ip: string,
  userAgent: string,
  pathname: string,
  method: string,
  statusCode: number,
  startTime: number,
  action: string
): Promise<void> {
  try {
    const now = new Date();
    const windowStart = new Date(now.getTime() - 10000);
    const windowEnd = new Date(now.getTime() + 10000);
    
    await supabase
      .from('rate_limit_logs')
      .insert({
        ip_address: ip,
        user_agent: userAgent,
        path: pathname,
        method: method,
        status_code: statusCode,
        timestamp: now.toISOString(),
        window_start: windowStart.toISOString(),
        window_end: windowEnd.toISOString(),
        limit_exceeded: statusCode === 429,
        is_bot: detectBotType(userAgent) !== 'browser',
        bot_type: detectBotType(userAgent)
      });
  } catch (error) {
    // Don't throw errors for logging failures
    console.error('Error logging access:', error);
  }
}

/**
 * Add comprehensive security headers
 */
function addSecurityHeaders(response: NextResponse, isProduction: boolean) {
  // Basic security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // HSTS (HTTP Strict Transport Security) - production only
  if (isProduction) {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  // Cross-Origin policies
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  
  // Content Security Policy
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://checkout.stripe.com https://vercel.live",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://*.supabase.co https://*.aiohub.jp https://vercel.com",
    "connect-src 'self' https://*.supabase.co https://api.stripe.com https://checkout.stripe.com wss://*.supabase.co https://vercel.live",
    "frame-src 'self' https://js.stripe.com https://checkout.stripe.com https://vercel.live",
    "media-src 'self' https://*.supabase.co",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://checkout.stripe.com",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ];
  
  if (!isProduction) {
    // Development adjustments
    cspDirectives[1] = "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://checkout.stripe.com https://vercel.live http://localhost:*";
    cspDirectives[5] = "connect-src 'self' https://*.supabase.co https://api.stripe.com https://checkout.stripe.com wss://*.supabase.co https://vercel.live http://localhost:* ws://localhost:*";
  }
  
  response.headers.set('Content-Security-Policy', cspDirectives.join('; '));
  
  // Permissions Policy (formerly Feature Policy)
  const permissionsPolicy = [
    'accelerometer=()',
    'ambient-light-sensor=()',
    'autoplay=(self)',
    'battery=()',
    'camera=()',
    'display-capture=()',
    'document-domain=()',
    'encrypted-media=()',
    'execution-while-not-rendered=()',
    'execution-while-out-of-viewport=()',
    'fullscreen=(self)',
    'geolocation=()',
    'gyroscope=()',
    'magnetometer=()',
    'microphone=()',
    'midi=()',
    'navigation-override=()',
    'payment=(self)',
    'picture-in-picture=()',
    'publickey-credentials-get=(self)',
    'screen-wake-lock=()',
    'sync-xhr=()',
    'usb=()',
    'web-share=(self)',
    'xr-spatial-tracking=()'
  ];
  
  response.headers.set('Permissions-Policy', permissionsPolicy.join(', '));
}

// 🔒 HTTP Basic Authentication Guard (Phase 4.5 - Production Security)
// 
// 認証アプローチ説明：
// 
// A案（現在採用）: アプリ側Basic認証
//   - middleware.tsで認証チェック
//   - DASHBOARD_BASIC_USER/DASHBOARD_BASIC_PASS で制御
//   - 開発環境では環境変数なしで認証スキップ
// 
// B案（インフラ側認証）: Vercel/Cloudflare/Nginxでの認証
//   - インフラ側でBasic認証設定時はDISABLE_APP_BASIC_AUTH=true
//   - アプリ側認証を無効化して二重認証を回避
//   - 例：Vercel Basic Auth, Cloudflare Access, Nginx auth_basic
// 
// C案（将来移行用）: NextAuth/Supabase Authベースの認証
//   - 本関数をNextAuth/Supabase認証チェックに置き換え
//   - 保護対象パスリスト（BASIC_AUTH_PROTECTED_PATHS）は再利用可能
//   - 公開パスリスト（PUBLIC_PATHS_BASIC_AUTH）も移行時活用
//   - 認証ロジックのみ入れ替えで移行可能な設計

async function checkBasicAuthentication(
  req: NextRequest, 
  pathname: string
): Promise<{ blocked: boolean; response?: NextResponse }> {
  try {
    // 🎛️ ステップ1: 明示的無効化チェック（最優先）
    if (process.env.DISABLE_APP_BASIC_AUTH === 'true') {
      console.log(`[BasicAuth] App-side Basic Auth explicitly disabled by DISABLE_APP_BASIC_AUTH=true`);
      return { blocked: false };
    }

    // 📋 ステップ2: 公開パスチェック - Basic認証除外対象
    if (PUBLIC_PATHS_BASIC_AUTH.includes(pathname)) {
      return { blocked: false };
    }

    // 📋 ステップ3: 公開プレフィックスチェック - /api/public/* など
    if (PUBLIC_PATH_PREFIXES_BASIC_AUTH.some(prefix => pathname.startsWith(prefix))) {
      return { blocked: false };
    }

    // 🔒 ステップ4: 保護対象パスチェック
    const requiresBasicAuth = BASIC_AUTH_PROTECTED_PATHS.some((pattern) => pattern.test(pathname));
    if (!requiresBasicAuth) {
      return { blocked: false };
    }

    // 🔑 ステップ5: Basic認証資格情報チェック
    const basicUser = process.env.DASHBOARD_BASIC_USER;
    const basicPass = process.env.DASHBOARD_BASIC_PASS;

    // 📝 事故防止: 両方の環境変数が設定されている場合のみ認証実行
    if (!basicUser || !basicPass) {
      console.log(`[BasicAuth] Credentials not fully configured (user: ${!!basicUser}, pass: ${!!basicPass}), allowing access to: ${pathname}`);
      return { blocked: false };
    }

    // C案: トークンベース認証 - 将来の拡張用（コメントで実装例を残す）
    /*
    // Alternative: Token-based authentication
    const adminToken = req.headers.get('x-admin-token') || req.nextUrl.searchParams.get('token');
    const validToken = process.env.NEXT_PUBLIC_ADMIN_PREVIEW_TOKEN;
    if (validToken && adminToken === validToken) {
      console.log(`[BasicAuth] Valid preview token provided for: ${pathname}`);
      return { blocked: false };
    }
    */

    // Check Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Basic ')) {
      console.log(`[BasicAuth] Missing or invalid auth header for: ${pathname}`);
      return {
        blocked: true,
        response: NextResponse.json(
          { error: 'Authentication Required' }, 
          { 
            status: 401,
            headers: { 'WWW-Authenticate': 'Basic realm="AIOHub Admin Dashboard"' },
          }
        )
      };
    }

    // Decode and validate credentials
    try {
      const base64Credentials = authHeader.split(' ')[1] ?? '';
      const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
      const [username, password] = credentials.split(':', 2);

      if (username === basicUser && password === basicPass) {
        console.log(`[BasicAuth] Valid credentials provided for: ${pathname}`);
        return { blocked: false };
      } else {
        console.log(`[BasicAuth] Invalid credentials provided for: ${pathname}`);
        return {
          blocked: true,
          response: NextResponse.json(
            { error: 'Invalid Credentials' }, 
            { 
              status: 401,
              headers: { 'WWW-Authenticate': 'Basic realm="AIOHub Admin Dashboard"' },
            }
          )
        };
      }
    } catch (decodeError) {
      console.error(`[BasicAuth] Error decoding credentials:`, decodeError);
      return {
        blocked: true,
        response: NextResponse.json(
          { error: 'Invalid Authorization Header' }, 
          { 
            status: 401,
            headers: { 'WWW-Authenticate': 'Basic realm="AIOHub Admin Dashboard"' },
          }
        )
      };
    }

  } catch (error) {
    console.error('[BasicAuth] Unexpected error:', error);
    // On error, allow access to prevent service disruption
    return { blocked: false };
  }
}

// API と静的は除外（包括的マッチャー）
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
};