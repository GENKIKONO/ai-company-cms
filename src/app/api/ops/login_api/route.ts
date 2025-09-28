/**
 * 管理者運用ログイン API
 * 
 * 責務:
 * - パスフレーズ検証（タイミング攻撃対策）
 * - Supabase 認証確認
 * - ADMIN_EMAIL 照合
 * - ops_admin クッキー設定
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { timingSafeEqual } from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ドメイン抽出ヘルパー
function extractDomain(request: NextRequest): string {
  const cookieDomain = process.env.COOKIE_DOMAIN || process.env.SUPABASE_COOKIE_DOMAIN;
  if (cookieDomain) return cookieDomain;
  
  const host = request.headers.get('host') || '';
  // aiohub.jp のようなeTLD+1を抽出
  if (host.includes('.')) {
    const parts = host.split('.');
    if (parts.length >= 2) {
      return `.${parts.slice(-2).join('.')}`;
    }
  }
  return host;
}

// 管理者チェック
function isAdmin(userEmail?: string): boolean {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || !userEmail) return false;
  return userEmail.toLowerCase().trim() === adminEmail.toLowerCase().trim();
}

// GETアクセス時は405を返す
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { 
      code: 'METHOD_NOT_ALLOWED', 
      reason: 'Use POST method for ops login' 
    },
    { 
      status: 405,
      headers: {
        'Allow': 'POST, OPTIONS'
      }
    }
  );
}

export async function POST(request: NextRequest) {
  try {
    // リクエストボディ取得
    const body = await request.json();
    const { passphrase } = body;

    // パスフレーズの基本検証
    if (!passphrase || typeof passphrase !== 'string') {
      console.error('[OPS_LOGIN] Missing passphrase');
      return NextResponse.json(
        {
          code: 'VALIDATION_ERROR',
          reason: 'Passphrase is required'
        },
        { status: 400 }
      );
    }

    const trimmedPassphrase = passphrase.trim();
    if (trimmedPassphrase === '') {
      console.error('[OPS_LOGIN] Empty passphrase');
      return NextResponse.json(
        {
          code: 'EMPTY_PASSPHRASE',
          reason: 'Passphrase cannot be empty'
        },
        { status: 400 }
      );
    }

    // 環境変数検証
    const adminOpsPassword = process.env.ADMIN_OPS_PASSWORD;
    if (!adminOpsPassword) {
      console.error('[OPS_LOGIN] ADMIN_OPS_PASSWORD not configured');
      return NextResponse.json(
        {
          code: 'OPS_PASSWORD_NOT_SET',
          reason: 'Server configuration error'
        },
        { status: 500 }
      );
    }

    const trimmedExpected = adminOpsPassword.trim();
    if (trimmedExpected === '') {
      console.error('[OPS_LOGIN] ADMIN_OPS_PASSWORD is empty');
      return NextResponse.json(
        {
          code: 'OPS_PASSWORD_NOT_SET',
          reason: 'Server configuration error'
        },
        { status: 500 }
      );
    }

    // Supabase SSR 認証確認
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[OPS_LOGIN] Missing Supabase session:', authError?.message || 'no user');
      return NextResponse.json(
        {
          code: 'MISSING_SESSION',
          reason: 'Supabase authentication required'
        },
        { status: 403 }
      );
    }

    // ADMIN_EMAIL 照合（小文字・trim）
    if (!isAdmin(user.email)) {
      console.error('[OPS_LOGIN] Not admin user:', user.email);
      return NextResponse.json(
        {
          code: 'NOT_ADMIN',
          reason: 'Admin access required'
        },
        { status: 401 }
      );
    }

    // パスフレーズ検証（タイミング攻撃対策）
    const inputBuffer = Buffer.from(trimmedPassphrase, 'utf8');
    const expectedBuffer = Buffer.from(trimmedExpected, 'utf8');

    // 長さ不一致チェック（timingSafeEqual前の事前判定）
    if (inputBuffer.length !== expectedBuffer.length) {
      console.error('[OPS_LOGIN] Password length mismatch for admin:', user.email);
      return NextResponse.json(
        {
          code: 'INVALID_PASSPHRASE',
          reason: 'Invalid passphrase'
        },
        { status: 401 }
      );
    }

    // タイミングセーフ比較
    if (!timingSafeEqual(inputBuffer, expectedBuffer)) {
      console.error('[OPS_LOGIN] Invalid passphrase for admin:', user.email);
      return NextResponse.json(
        {
          code: 'INVALID_PASSPHRASE',
          reason: 'Invalid passphrase'
        },
        { status: 401 }
      );
    }

    // 認証成功 - JSON レスポンス
    const domain = extractDomain(request);
    
    const response = NextResponse.json(
      {
        ok: true
      },
      { status: 200 }
    );

    // セキュアクッキー設定（2時間有効）
    response.cookies.set('ops_admin', '1', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      domain: domain,
      maxAge: 7200 // 2時間
    });

    return response;

  } catch (error) {
    console.error('[POST /ops/login] Unexpected error:', error);
    return NextResponse.json(
      {
        code: 'INTERNAL_ERROR',
        reason: 'Authentication failed'
      },
      { status: 500 }
    );
  }
}

// OPTIONSメソッド（CORSプリフライト対応）
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}