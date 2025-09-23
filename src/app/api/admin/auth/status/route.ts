import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin-client';
import { verifyJWT } from '@/lib/jwt-admin';

interface AuthStatusResponse {
  success: boolean;
  data?: {
    exists: boolean;
    email_confirmed_at: string | null;
    is_confirmed: boolean;
    is_banned: boolean;
    last_sign_in_at: string | null;
    identities: any[];
    user_metadata: any;
    app_metadata: any;
    created_at: string;
    banned_until?: string | null;
  };
  error?: string;
  requestId: string;
}

function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  const maskedLocal = local.length > 2 
    ? `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}`
    : local;
  return `${maskedLocal}@${domain}`;
}

export async function POST(request: NextRequest): Promise<NextResponse<AuthStatusResponse>> {
  const requestId = crypto.randomUUID();
  
  try {
    // JWT認証チェック
    const authHeader = request.headers.get('x-admin-token');
    if (!authHeader) {
      console.warn('Admin auth status request without token', { requestId });
      return NextResponse.json({
        success: false,
        error: 'Admin token required',
        requestId
      }, { status: 401 });
    }

    try {
      await verifyJWT(authHeader);
    } catch (jwtError) {
      console.warn('Invalid admin token', { 
        requestId, 
        error: jwtError instanceof Error ? jwtError.message : 'Unknown JWT error' 
      });
      return NextResponse.json({
        success: false,
        error: 'Invalid admin token',
        requestId
      }, { status: 401 });
    }

    // リクエスト解析
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({
        success: false,
        error: 'Valid email address required',
        requestId
      }, { status: 400 });
    }

    // Supabase Admin APIでユーザー検索
    const admin = supabaseAdmin;
    const { data: users, error: searchError } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000 // 実際のアプリでは適切にページングを実装
    });

    if (searchError) {
      console.error('Failed to search users', {
        requestId,
        email: maskEmail(email),
        error: searchError.message
      });
      return NextResponse.json({
        success: false,
        error: 'Failed to search users',
        requestId
      }, { status: 500 });
    }

    // メールアドレスでユーザーを検索
    const user = users.users.find(u => u.email === email);
    
    console.info('Admin auth status check', {
      requestId,
      email: maskEmail(email),
      userFound: !!user,
      confirmed: user?.email_confirmed_at ? true : false
    });

    if (!user) {
      return NextResponse.json({
        success: true,
        data: {
          exists: false,
          email_confirmed_at: null,
          is_confirmed: false,
          is_banned: false,
          last_sign_in_at: null,
          identities: [],
          user_metadata: {},
          app_metadata: {},
          created_at: '',
        },
        requestId
      });
    }

    // ユーザー情報を整理
    const authStatus = {
      exists: true,
      email_confirmed_at: user.email_confirmed_at,
      is_confirmed: !!user.email_confirmed_at,
      is_banned: !!user.banned_until,
      last_sign_in_at: user.last_sign_in_at,
      identities: user.identities || [],
      user_metadata: user.user_metadata || {},
      app_metadata: user.app_metadata || {},
      created_at: user.created_at,
      banned_until: user.banned_until
    };

    return NextResponse.json({
      success: true,
      data: authStatus,
      requestId
    });

  } catch (error) {
    console.error('Admin auth status error', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      requestId
    }, { status: 500 });
  }
}