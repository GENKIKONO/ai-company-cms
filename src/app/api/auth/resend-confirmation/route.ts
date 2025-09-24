import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

type Body = { email: string; type?: 'signup' | 'magiclink' };

const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: NextRequest) {
  const { email, type = 'signup' } = (await req.json()) as Body;
  const requestId = crypto.randomUUID();

  if (!email) {
    return NextResponse.json(
      { success: false, code: 'bad_request', error: 'Email is required', requestId },
      { status: 400 },
    );
  }

  const redirectTo = `${APP_URL}/auth/confirm`;

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE, { auth: { persistSession: false } });
  const anon = createClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: { persistSession: false },
    global: { headers: { cookie: cookies().toString() } },
  });

  try {
    // 確認メール再送信には anon.resend を使用
    const resend = await anon.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: redirectTo },
    });
    
    if (resend.error) {
      return NextResponse.json(
        { success: false, code: 'resend_failed', error: resend.error.message, requestId },
        { status: 424 },
      );
    }
    
    return NextResponse.json({ success: true, code: 'resent', requestId }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, code: 'unexpected', error: e?.message ?? 'unknown', requestId },
      { status: 500 },
    );
  }
}