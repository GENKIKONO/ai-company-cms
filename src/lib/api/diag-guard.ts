/**
 * 診断エンドポイント用認証ガード
 *
 * セキュリティ:
 * - 本番環境ではサイト管理者のみアクセス可能
 * - 開発環境では認証なしでアクセス可能（開発効率のため）
 * - スタックトレースやエラー詳細をクライアントに返却しない
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isAuthorized } from '@/lib/auth/require-admin';
import { logger } from '@/lib/log';

export interface DiagGuardResult {
  authorized: boolean;
  response?: NextResponse;
  isProduction: boolean;
}

/**
 * 診断エンドポイントの認証チェック
 *
 * - 本番環境: requireAdmin() で管理者認証必須
 * - 開発環境: 認証スキップ（開発効率優先）
 */
export async function diagGuard(request: NextRequest): Promise<DiagGuardResult> {
  const isProduction = process.env.NODE_ENV === 'production';

  // 開発環境では認証スキップ
  if (!isProduction) {
    return { authorized: true, isProduction };
  }

  // 本番環境では管理者認証必須
  const authResult = await requireAdmin();
  if (!isAuthorized(authResult)) {
    logger.warn('[DiagGuard] Unauthorized access attempt to diagnostic endpoint', {
      data: {
        url: request.url,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      }
    });
    return {
      authorized: false,
      response: authResult.response,
      isProduction
    };
  }

  return { authorized: true, isProduction };
}

/**
 * 診断エンドポイント用の安全なエラーレスポンス
 *
 * スタックトレースやエラー詳細をログに記録し、
 * クライアントには汎用メッセージのみ返却
 */
export function diagErrorResponse(
  error: unknown,
  context: string
): NextResponse {
  // ログには詳細を記録
  logger.error(`[Diag] ${context} error`, {
    data: error instanceof Error ? error : new Error(String(error)),
    stack: error instanceof Error ? error.stack : undefined
  });

  // クライアントには汎用メッセージのみ
  return NextResponse.json(
    {
      error: 'Diagnostic operation failed',
      timestamp: new Date().toISOString()
    },
    { status: 500 }
  );
}

/**
 * 環境情報を安全に返却するヘルパー
 *
 * 本番環境では環境情報を含めない
 */
export function getSafeEnvironmentInfo(isProduction: boolean): Record<string, unknown> {
  if (isProduction) {
    return { mode: 'production' };
  }

  return {
    mode: 'development',
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
  };
}
