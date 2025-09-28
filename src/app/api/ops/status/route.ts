/**
 * 管理者運用状態診断 API
 * 
 * 責務:
 * - Supabase セッション状態確認
 * - 管理者メール照合状態確認  
 * - ops_admin クッキー状態確認
 * - 環境変数設定状態確認（値は漏らさない）
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 管理者チェック
function isAdmin(userEmail?: string): boolean {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || !userEmail) return false;
  return userEmail.toLowerCase().trim() === adminEmail.toLowerCase().trim();
}

// メールマスク化
function maskEmail(email?: string): string {
  if (!email) return '';
  if (email.length <= 1) return '*';
  return email.charAt(0) + '*'.repeat(email.length - 1);
}

// ドメイン抽出
function extractDomain(request: NextRequest): string {
  const cookieDomain = process.env.COOKIE_DOMAIN || process.env.SUPABASE_COOKIE_DOMAIN;
  if (cookieDomain) return cookieDomain;
  
  const host = request.headers.get('host') || '';
  if (host.includes('.')) {
    const parts = host.split('.');
    if (parts.length >= 2) {
      return `.${parts.slice(-2).join('.')}`;
    }
  }
  return host;
}

export async function GET(request: NextRequest) {
  try {
    // Supabase SSR 認証確認
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    const hasSession = !authError && !!user;
    const userEmail = user?.email || null;
    const isAdminEmail = hasSession && isAdmin(userEmail || undefined);

    // 管理者以外は 403
    if (!isAdminEmail) {
      return NextResponse.json(
        {
          code: 'FORBIDDEN',
          reason: 'Admin access required for diagnostic'
        },
        { status: 403 }
      );
    }

    // ops_admin クッキー確認
    const cookieStore = await cookies();
    const opsAdminCookie = cookieStore.get('ops_admin');
    const hasOpsCookie = opsAdminCookie?.value === '1';

    // 環境変数確認（値は返さない、長さのみ）
    const adminEmailEnv = process.env.ADMIN_EMAIL;
    const opsPasswordEnv = process.env.ADMIN_OPS_PASSWORD;
    const appUrlEnv = process.env.NEXT_PUBLIC_APP_URL;

    const hasAdminEmailEnv = !!adminEmailEnv && adminEmailEnv.trim() !== '';
    const hasOpsPasswordEnv = !!opsPasswordEnv && opsPasswordEnv.trim() !== '';
    const opsPasswordLength = opsPasswordEnv ? opsPasswordEnv.trim().length : 0;
    const opsPasswordLengthValid = opsPasswordLength >= 20;
    const hasValidAppUrl = appUrlEnv === 'https://aiohub.jp';

    // ドメイン情報
    const domainUsed = extractDomain(request);
    const rawHost = request.headers.get('host') || '';

    // 診断結果を返す（値は漏らさない）
    return NextResponse.json({
      hasSession,
      userEmail: maskEmail(userEmail || undefined),
      isAdminEmail,
      hasOpsCookie,
      env: {
        hasAdminEmailEnv,
        hasOpsPasswordEnv,
        opsPasswordLength,
        opsPasswordLengthValid,
        hasValidAppUrl,
        appUrl: appUrlEnv
      },
      cookie: {
        domainUsed,
        rawHost
      },
      ts: new Date().toISOString()
    });

  } catch (error) {
    console.error('[GET /api/ops/status] Unexpected error:', error);
    return NextResponse.json(
      {
        code: 'INTERNAL_ERROR',
        reason: 'Diagnostic failed'
      },
      { status: 500 }
    );
  }
}

// POST/PUT/DELETE は405を返す
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { 
      code: 'METHOD_NOT_ALLOWED', 
      reason: 'Use GET method for status check' 
    },
    { 
      status: 405,
      headers: {
        'Allow': 'GET, OPTIONS'
      }
    }
  );
}

export async function PUT(request: NextRequest) {
  return NextResponse.json(
    { 
      code: 'METHOD_NOT_ALLOWED', 
      reason: 'Use GET method for status check' 
    },
    { 
      status: 405,
      headers: {
        'Allow': 'GET, OPTIONS'
      }
    }
  );
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json(
    { 
      code: 'METHOD_NOT_ALLOWED', 
      reason: 'Use GET method for status check' 
    },
    { 
      status: 405,
      headers: {
        'Allow': 'GET, OPTIONS'
      }
    }
  );
}

// OPTIONSメソッド（CORSプリフライト対応）
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}