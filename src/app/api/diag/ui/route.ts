import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// メモリ内エラーログストア（本番では外部ストレージ推奨）
const errorLogs: any[] = [];
const MAX_LOGS = 50; // 最大50件保持

export async function GET() {
  try {
    const diagnosis = {
      commit: process.env.VERCEL_GIT_COMMIT_SHA || null,
      deployId: process.env.VERCEL_DEPLOYMENT_ID || null,
      timestamp: new Date().toISOString(),
      flags: {
        layoutHasSafeHeader: true
      },
      recentErrors: errorLogs.slice(-10) // 直近10件のエラーを返す
    };

    return NextResponse.json(diagnosis, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

  } catch (error: any) {
    return NextResponse.json({
      error: error?.message || 'Unknown error',
      commit: process.env.VERCEL_GIT_COMMIT_SHA || null,
      deployId: process.env.VERCEL_DEPLOYMENT_ID || null,
      timestamp: new Date().toISOString(),
      flags: {
        layoutHasSafeHeader: true
      },
      recentErrors: []
    }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // エラーログを収集
    const logEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      type: body.type || 'unknown',
      ...body
    };

    // ログを先頭に追加（最新が先頭）
    errorLogs.unshift(logEntry);

    // 最大件数を超えた場合は古いログを削除
    if (errorLogs.length > MAX_LOGS) {
      errorLogs.splice(MAX_LOGS);
    }

    // コンソールにも出力
    console.log('[DIAG] Error logged:', {
      id: logEntry.id,
      type: logEntry.type,
      errorId: logEntry.errorId,
      endpoint: logEntry.endpoint
    });

    return NextResponse.json({
      success: true,
      logId: logEntry.id,
      totalLogs: errorLogs.length
    }, { status: 201 });

  } catch (error: any) {
    console.error('[DIAG] Failed to log error:', error);
    
    return NextResponse.json({
      success: false,
      error: error?.message || 'Failed to log error'
    }, { status: 500 });
  }
}