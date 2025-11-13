import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  const requestId = crypto.randomUUID();

  if (!email) {
    return NextResponse.json(
      { success: false, code: 'bad_request', error: 'Email is required', requestId },
      { status: 400 },
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, { auth: { persistSession: false } });
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${APP_URL}/auth/reset-password-confirm`,
  });

  if (error) {
    return NextResponse.json(
      { success: false, code: 'reset_send_failed', error: error.message, requestId },
      { status: 424 },
    );
  }

  return NextResponse.json({ success: true, code: 'reset_sent', requestId }, { status: 200 });
}

// 任意：GET等は405
export async function GET() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
}