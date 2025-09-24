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

  // Admin（Service Role）とAnonの両方を用意
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE, { auth: { persistSession: false } });
  const anon = createClient(SUPABASE_URL, SUPABASE_ANON, { auth: { persistSession: false }, global: { headers: { cookie: cookies().toString() } } });

  try {
    // 1) まず Admin generateLink を試す（新規 or 未確認ユーザー想定）
    let linkResult;
    if (type === 'signup') {
      linkResult = await admin.auth.admin.generateLink({
        type: 'signup',
        email,
        password: Math.random().toString(36), // ランダムパスワード（メール確認後にユーザーが設定）
        options: { redirectTo: redirectTo },
      });
    } else {
      linkResult = await admin.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: { redirectTo: redirectTo },
      });
    }
    const { data, error } = linkResult;

    if (error) {
      // 「既に登録済み」エラーは signUp では正常系。resend にフォールバックする
      const msg = (error.message || '').toLowerCase();
      const isAlready = msg.includes('already been registered') || msg.includes('user already registered') || error.status === 422;

      if (!isAlready) {
        return NextResponse.json(
          { success: false, code: 'generate_link_failed', error: error.message, requestId },
          { status: 424 },
        );
      }

      // 2) 既存ユーザー向け：確認メールの再送（anon側の resend API）
      const resend = await anon.auth.resend({ type: 'signup', email, options: { emailRedirectTo: redirectTo } });
      if (resend.error) {
        return NextResponse.json(
          { success: false, code: 'resend_failed', error: resend.error.message, requestId },
          { status: 424 },
        );
      }

      return NextResponse.json({ success: true, code: 'resent', requestId }, { status: 200 });
    }

    // generateLink 成功（URL を直接返す必要がなければ 200 OK）
    return NextResponse.json({ success: true, code: 'link_generated', requestId }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, code: 'unexpected', error: e?.message ?? 'unknown', requestId },
      { status: 500 },
    );
  }
}