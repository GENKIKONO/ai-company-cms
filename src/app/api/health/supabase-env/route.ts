/**
 * Supabase Environment Diagnostic Endpoint
 *
 * 本番がどのSupabaseプロジェクトを向いているかを即座に判定するための診断エンドポイント。
 * 機密情報は最小限（anonKeyは先頭12文字のみ）。
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const sha = process.env.VERCEL_GIT_COMMIT_SHA ||
              process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
              'unknown';

  // リクエスト診断
  const host = request.headers.get('host') || 'unknown';
  const proto = request.headers.get('x-forwarded-proto') || 'unknown';

  // 環境変数から Supabase 設定を取得
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  // URL から hostname と projectRef を抽出
  let hostname = 'unknown';
  let projectRef = 'unknown';
  try {
    if (supabaseUrl) {
      const url = new URL(supabaseUrl);
      hostname = url.hostname;
      // 例: https://chyicolujwhkycpkxbej.supabase.co → chyicolujwhkycpkxbej
      const match = hostname.match(/^([^.]+)\.supabase\.co$/);
      if (match) {
        projectRef = match[1];
      }
    }
  } catch {
    // URL パースエラーは無視
  }

  // anonKey の先頭12文字のみ（漏洩防止）
  const anonKeyPrefix = supabaseAnonKey ? supabaseAnonKey.slice(0, 12) : 'not_set';

  return NextResponse.json({
    // Supabase 設定
    supabaseUrlHostname: hostname,
    projectRef,
    anonKeyPrefix,
    // サーバー診断
    host,
    proto,
    // メタ
    sha,
    requestId,
    timestamp: new Date().toISOString(),
  }, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, must-revalidate',
      'Content-Type': 'application/json',
      'x-request-id': requestId,
    },
  });
}
