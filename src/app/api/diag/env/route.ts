import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 存在フラグのみ返却（値は絶対に出さない）
    const envStatus = {
      ok: true,
      vars: {
        NEXT_PUBLIC_APP_URL: !!process.env.NEXT_PUBLIC_APP_URL,
        NEXT_PUBLIC_SITE_URL: !!process.env.NEXT_PUBLIC_SITE_URL,
        REVALIDATE_TOKEN: !!process.env.REVALIDATE_TOKEN,
        NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      }
    };

    return NextResponse.json(envStatus);
  } catch (error) {
    return NextResponse.json(
      { 
        ok: false, 
        error: 'Environment check failed' 
      },
      { status: 500 }
    );
  }
}