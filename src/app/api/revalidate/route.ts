/**
 * On-demand ISR Revalidation API
 * Usage: POST /api/revalidate?path=/hearing-service
 * Header: x-revalidate-token: <REVALIDATE_TOKEN>
 */

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
  try {
    // セキュリティ: REVALIDATE_TOKEN をヘッダーで確認
    const token = request.headers.get('x-revalidate-token');
    const expectedToken = process.env.REVALIDATE_TOKEN;
    
    if (!expectedToken) {
      logger.warn('[Revalidate API] REVALIDATE_TOKEN is not set; returning 503 for safety.');
      return NextResponse.json(
        { 
          ok: false,
          message: 'revalidate disabled' 
        },
        { status: 503 }
      );
    }
    
    if (!token || token !== expectedToken) {
      logger.error('[Revalidate API] Invalid or missing token');
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          message: 'Invalid revalidation token' 
        },
        { status: 401 }
      );
    }

    // パス指定の取得（クエリパラメータまたはJSONボディ）
    const { searchParams } = new URL(request.url);
    let pathToRevalidate = searchParams.get('path');
    
    // JSON ボディからパスを取得する場合
    if (!pathToRevalidate) {
      try {
        const body = await request.json();
        pathToRevalidate = body.path;
      } catch (error) {
        // JSON パースエラーは無視してクエリパラメータのみ使用
      }
    }
    
    if (!pathToRevalidate) {
      return NextResponse.json(
        { 
          error: 'Bad Request',
          message: 'Path parameter is required (query ?path= or JSON body.path)' 
        },
        { status: 400 }
      );
    }

    // パスのバリデーション（セキュリティ）
    if (!pathToRevalidate.startsWith('/')) {
      pathToRevalidate = '/' + pathToRevalidate;
    }
    
    // 許可されたパスの制限（オプション）
    const allowedPaths = [
      '/hearing-service',
      '/pricing-demo',
      '/',
      '/aio',
      '/organizations',
      '/posts',
      '/services'
    ];
    
    if (!allowedPaths.some(allowed => pathToRevalidate!.startsWith(allowed))) {
      console.warn(`[Revalidate API] Attempted to revalidate unauthorized path: ${pathToRevalidate}`);
      return NextResponse.json(
        { 
          error: 'Forbidden',
          message: `Path ${pathToRevalidate} is not allowed for revalidation`,
          allowedPaths 
        },
        { status: 403 }
      );
    }

    // ISR キャッシュの再検証実行
    logger.debug('Debug', `[Revalidate API] Revalidating path: ${pathToRevalidate}`);
    
    try {
      revalidatePath(pathToRevalidate);
      
      return NextResponse.json(
        { 
          success: true,
          message: `Successfully revalidated path: ${pathToRevalidate}`,
          timestamp: new Date().toISOString(),
          path: pathToRevalidate
        },
        { status: 200 }
      );
      
    } catch (revalidateError) {
      logger.error('[Revalidate API] Revalidation failed:', revalidateError);
      return NextResponse.json(
        { 
          error: 'Revalidation Failed',
          message: `Failed to revalidate path: ${pathToRevalidate}`,
          details: revalidateError instanceof Error ? revalidateError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    logger.error('[Revalidate API] Unexpected error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'An unexpected error occurred during revalidation'
      },
      { status: 500 }
    );
  }
}

// GET メソッドは情報提供のみ
export async function GET() {
  return NextResponse.json(
    {
      info: 'On-demand ISR Revalidation API',
      usage: 'POST /api/revalidate?path=/your-path',
      headers: 'x-revalidate-token: <token>',
      methods: ['POST'],
      allowedPaths: [
        '/hearing-service',
        '/pricing-demo', 
        '/',
        '/aio',
        '/organizations',
        '/posts',
        '/services'
      ]
    },
    { status: 200 }
  );
}