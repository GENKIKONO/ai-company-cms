/**
 * E2E Test Login API Endpoint
 *
 * E2E テスト専用のログインAPI。HttpOnly Cookie を設定し、
 * SSR でも認証が通るようにする。
 *
 * 安全性:
 * - NODE_ENV=development または E2E_MODE=true 時のみ有効
 * - 1日TTL
 * - XSRF軽減（SameSite=Lax）
 *
 * 使用方法:
 * POST /api/test/login
 * Body: { "email": "...", "password": "..." }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const COOKIE_OPTIONS = {
  httpOnly: false, // Supabase client needs to read the token
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 86400, // 1 day in seconds
  path: '/',
};

interface LoginRequest {
  email: string;
  password: string;
}

export async function POST(request: NextRequest) {
  // Safety guard - only allow in development or when E2E_MODE is set
  const isAllowed =
    process.env.NODE_ENV === 'development' ||
    process.env.E2E_MODE === 'true';

  if (!isAllowed) {
    return NextResponse.json(
      { error: 'E2E login endpoint disabled' },
      { status: 403 }
    );
  }

  try {
    // Parse request body
    let body: LoginRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'email and password are required' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Authenticate
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.session) {
      return NextResponse.json(
        { error: authError?.message || 'Authentication failed' },
        { status: 401 }
      );
    }

    // Extract project ref from URL for cookie naming
    const projectRef = supabaseUrl.split('//')[1]?.split('.')[0] ?? 'unknown';

    // Build session data for localStorage (for client-side Supabase)
    const sessionData = {
      access_token: authData.session.access_token,
      refresh_token: authData.session.refresh_token,
      token_type: 'bearer',
      expires_in: authData.session.expires_in,
      expires_at: authData.session.expires_at,
      user: authData.user,
    };

    // Create response
    const response = NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
      },
      session: sessionData,
      storageKey: `sb-${projectRef}-auth-token`,
    });

    // Set cookies for SSR authentication
    // Supabase SSR expects cookies in specific format
    // Format: sb-<project-ref>-auth-token
    const cookieName = `sb-${projectRef}-auth-token`;

    // The @supabase/ssr package stores the full session as JSON
    response.cookies.set(cookieName, JSON.stringify(sessionData), COOKIE_OPTIONS);

    // Also set individual token cookies for compatibility
    response.cookies.set(`sb-${projectRef}-auth-token.0`, JSON.stringify(sessionData), COOKIE_OPTIONS);

    // Cache prevention headers
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    console.log('[E2E Login] Success:', { userId: authData.user.id, email: authData.user.email });

    return response;

  } catch (error) {
    console.error('[E2E Login] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
