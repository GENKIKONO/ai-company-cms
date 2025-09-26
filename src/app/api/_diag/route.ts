// src/app/api/_diag/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';

  // 可能ならホスト名を抜き出す（失敗時は原文返し）
  const supabaseHost = (() => {
    try { return new URL(supabaseUrl).host; } catch { return supabaseUrl; }
  })();

  return NextResponse.json({
    // Vercelが自動で注入する環境変数（ローカルでは undefined になることあり）
    commit: process.env.VERCEL_GIT_COMMIT_SHA || 'local',
    buildAt: process.env.VERCEL_DEPLOYMENT_ID || 'unknown',
    nodeEnv: process.env.NODE_ENV,

    // 接続先の確認
    supabaseUrl,
    supabaseHost,
    appUrl,
  });
}