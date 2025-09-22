export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET() {
  try {
    const sb = await supabaseServer();
    const { data, error } = await sb.auth.getUser();
    
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 200 });
    }
    
    const user = data?.user ? { id: data.user.id, email: data.user.email } : null;
    return NextResponse.json({ ok: true, provider: 'supabase', user });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'unknown' }, { status: 200 });
  }
}

// その他のHTTPメソッドは許可しない
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}