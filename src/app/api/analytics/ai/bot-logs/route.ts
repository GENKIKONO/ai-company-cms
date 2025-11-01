/**
 * AI Bot Logs Analytics API
 * AI Botアクセスログの取得と分析
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { createAuthError, createInternalError, generateErrorId } from '@/lib/utils/data-normalization';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

// Type definitions
interface BotLogsQuery {
  org_id?: string;
  start_date?: string; // ISO format
  end_date?: string;
  bot_name?: string;
  limit?: number;
  offset?: number;
}

interface BotLogResponse {
  id: string;
  url: string;
  bot_name: string;
  accessed_at: string;
  user_agent?: string;
  ip_address?: string;
  response_status?: number;
  content_unit?: {
    title: string | null;
    content_type: string;
  } | null;
}

interface BotLogsResponse {
  logs: BotLogResponse[];
  total_count: number;
  pagination: {
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

// GET - AI Bot ログ一覧取得
export async function GET(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    
    // 管理者認証チェック（テスト用に一時無効化）
    // TODO: 本格運用時は有効化
    // const { data: authData, error: authError } = await supabase.auth.getUser();
    // if (authError || !authData.user) {
    //   return createAuthError();
    // }

    // クエリパラメータ解析
    const { searchParams } = new URL(request.url);
    const query: BotLogsQuery = {
      org_id: searchParams.get('org_id') || undefined,
      start_date: searchParams.get('start_date') || undefined,
      end_date: searchParams.get('end_date') || undefined,
      bot_name: searchParams.get('bot_name') || undefined,
      limit: Math.min(parseInt(searchParams.get('limit') || '50'), 1000), // 最大1000件
      offset: parseInt(searchParams.get('offset') || '0'),
    };

    // ベースクエリ構築
    let baseQuery = supabase
      .from('ai_bot_logs')
      .select(`
        id,
        url,
        bot_name,
        accessed_at,
        user_agent,
        ip_address,
        response_status,
        ai_content_units (
          title,
          content_type
        )
      `, { count: 'exact' });

    // フィルター適用
    if (query.org_id) {
      baseQuery = baseQuery.eq('org_id', query.org_id);
    }

    if (query.start_date) {
      baseQuery = baseQuery.gte('accessed_at', query.start_date);
    }

    if (query.end_date) {
      baseQuery = baseQuery.lte('accessed_at', query.end_date);
    }

    if (query.bot_name) {
      baseQuery = baseQuery.eq('bot_name', query.bot_name);
    }

    // ソート・ページネーション
    const { data: logs, error: logsError, count } = await baseQuery
      .order('accessed_at', { ascending: false })
      .range(query.offset, query.offset + query.limit - 1);

    if (logsError) {
      logger.error('Error fetching bot logs:', logsError);
      return NextResponse.json(
        { error: 'Database error', message: logsError.message },
        { status: 500 }
      );
    }

    // レスポンス整形
    const formattedLogs: BotLogResponse[] = (logs || []).map(log => ({
      id: log.id,
      url: log.url,
      bot_name: log.bot_name,
      accessed_at: log.accessed_at,
      user_agent: log.user_agent,
      ip_address: log.ip_address,
      response_status: log.response_status,
      content_unit: log.ai_content_units && Array.isArray(log.ai_content_units) && log.ai_content_units.length > 0 ? {
        title: log.ai_content_units[0].title,
        content_type: log.ai_content_units[0].content_type,
      } : null,
    }));

    const totalCount = count || 0;
    const hasMore = query.offset + query.limit < totalCount;

    const response: BotLogsResponse = {
      logs: formattedLogs,
      total_count: totalCount,
      pagination: {
        limit: query.limit,
        offset: query.offset,
        has_more: hasMore,
      },
    };

    return NextResponse.json(response);

  } catch (error) {
    const errorId = generateErrorId('get-ai-bot-logs');
    logger.error('[GET /api/analytics/ai/bot-logs] Unexpected error:', { errorId, error });
    return createInternalError(errorId);
  }
}