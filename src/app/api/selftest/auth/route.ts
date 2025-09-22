import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * セルフテスト認証状態確認API
 * 
 * 目的: UAT実行時の認証テスト完了証跡を残すための軽量API
 * 
 * 重要な制約:
 * - 認証必須（未認証は401）
 * - 機微情報は返さない（ID, email等は伏せる）
 * - 副作用なし（データ変更・ログ記録なし）
 * - 本番環境で安全に実行可能
 */

export async function GET(request: NextRequest) {
  try {
    // 認証確認
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { 
          ok: false, 
          error: 'Authentication required',
          message: 'ログインが必要です'
        },
        { status: 401 }
      );
    }

    // 安全なレスポンス（機微情報を含まない）
    const safeResponse = {
      ok: true,
      user: {
        id: 'redacted',              // IDは伏せる
        authenticated: true,
        role: session.user.role || 'unknown',
        hasEmail: !!session.user.email,
        hasName: !!session.user.name
      },
      session: {
        hasValidSession: true,
        // expires等の詳細は含めない
      },
      timestamp: new Date().toISOString(),
      test: {
        purpose: 'UAT authentication verification',
        environment: process.env.NODE_ENV,
        safe: true  // このAPIが安全であることを示す
      }
    };

    // レスポンスヘッダーでセキュリティを強化
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('X-Frame-Options', 'DENY');
    
    return NextResponse.json(safeResponse, { 
      status: 200,
      headers 
    });

  } catch (error) {
    // エラーログも機微情報を含まない
    console.error('Selftest auth API error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      // スタックトレースやその他の詳細は記録しない
    });

    return NextResponse.json(
      {
        ok: false,
        error: 'Internal server error',
        message: 'システムエラーが発生しました',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
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