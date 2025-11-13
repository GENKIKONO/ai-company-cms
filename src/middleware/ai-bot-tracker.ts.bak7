/**
 * AI Bot Tracking Middleware
 * 全APIエンドポイントでAI Botアクセスを自動記録
 */

import { NextRequest, NextResponse } from 'next/server';
import { logAIBotAccess } from '@/lib/utils/ai-bot-logger';
import { extractBotInfoFromHeaders, shouldLogBot } from '@/lib/utils/ai-bot-detector';
import { logger } from '@/lib/utils/logger';

/**
 * AI Bot トラッキング用ミドルウェア関数
 * 既存のmiddleware.tsから呼び出す想定
 */
export async function trackAIBotAccess(
  request: NextRequest,
  response: NextResponse,
  orgId?: string
): Promise<void> {
  // AI Botでない場合は何もしない
  const botInfo = extractBotInfoFromHeaders(request.headers);
  if (!shouldLogBot(botInfo)) {
    return;
  }

  // orgIdが特定できない場合はスキップ
  if (!orgId) {
    logger.debug('Skipping bot log: orgId not available', {
      url: request.url,
      bot: botInfo.botName,
    });
    return;
  }

  // 非同期でログ記録（パフォーマンスに影響しないよう）
  logAIBotAccess(
    request.headers,
    request.url,
    orgId,
    response.status,
    request.method
  ).catch(error => {
    logger.warn('AI Bot logging failed in middleware', {
      error,
      url: request.url,
      orgId,
    });
  });
}

/**
 * URLからorgIdを推定する汎用関数
 * パスパラメータやクエリから組織を特定
 */
export function extractOrgIdFromRequest(request: NextRequest): string | null {
  const { pathname, searchParams } = new URL(request.url);

  // パターン1: /api/public/organizations/[slug] 
  const orgSlugMatch = pathname.match(/\/api\/public\/organizations\/([^\/]+)/);
  if (orgSlugMatch) {
    return orgSlugMatch[1]; // slugを一時的にorgIdとして使用（後でマッピング要）
  }

  // パターン2: クエリパラメータから
  const orgParam = searchParams.get('org_id') || searchParams.get('organization_id');
  if (orgParam) {
    return orgParam;
  }

  // パターン3: その他の形式
  // 必要に応じて拡張

  return null;
}