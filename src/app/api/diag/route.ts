import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(req: Request) {
  const url = new URL(req.url);
  const cookieHeader = req.headers.get('cookie') || '';
  const cookiesOnRequest = cookieHeader ? cookieHeader.split(';').length : 0;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  return NextResponse.json({
    env: {
      nodeEnv: process.env.NODE_ENV,
      appUrl: process.env.NEXT_PUBLIC_APP_URL || '',
      supabaseUrl,
      anonKeyPresent: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      commit: process.env.VERCEL_GIT_COMMIT_SHA || 'local',
      deployId: process.env.VERCEL_DEPLOYMENT_ID || 'unknown',
    },
    request: {
      url: url.toString(),
      host: req.headers.get('host'),
      xForwardedHost: req.headers.get('x-forwarded-host'),
    },
    supabaseHost: (() => { try { return new URL(supabaseUrl).host; } catch { return supabaseUrl; } })(),
    cookiesOnRequest,
  });
}