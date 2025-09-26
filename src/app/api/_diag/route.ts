// Diagnostic endpoint (no caching, always dynamic)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const reqHeaders = Object.fromEntries(
    Array.from(new Headers(request.headers).entries())
      .filter(([k]) => ['host','x-forwarded-host','x-vercel-id','x-vercel-deployment-url','cookie'].includes(k))
  );
  const env = {
    nodeEnv: process.env.NODE_ENV || null,
    commit: process.env.VERCEL_GIT_COMMIT_SHA || null,
    deployId: process.env.VERCEL_DEPLOYMENT_ID || null,
    appUrl: process.env.NEXT_PUBLIC_APP_URL || null,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || null,
    anonKeyPresent: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
  let supabaseHost: string | null = null;
  try {
    supabaseHost = env.supabaseUrl ? new URL(env.supabaseUrl).host : null;
  } catch {}

  return NextResponse.json({
    ok: true,
    when: new Date().toISOString(),
    path: url.pathname,
    host: reqHeaders.host || null,
    xForwardedHost: reqHeaders['x-forwarded-host'] || null,
    vercelId: reqHeaders['x-vercel-id'] || null,
    vercelDeployUrl: reqHeaders['x-vercel-deployment-url'] || null,
    cookiesOnRequest: (reqHeaders.cookie ?? '').split('; ').filter(Boolean).length,
    env,
    supabaseHost,
  }, { status: 200 });
}