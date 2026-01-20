import { NextRequest, NextResponse } from 'next/server';
import { diagGuard, diagErrorResponse, getSafeEnvironmentInfo } from '@/lib/api/diag-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // diagGuard による認証チェック
  const guardResult = await diagGuard(request);
  if (!guardResult.authorized) {
    return guardResult.response!;
  }

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
      },
      environment: getSafeEnvironmentInfo(guardResult.isProduction)
    };

    return NextResponse.json(envStatus);
  } catch (error) {
    return diagErrorResponse(error, '/api/diag/env');
  }
}