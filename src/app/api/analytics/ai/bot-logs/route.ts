/**
 * AI Bot Logs Analytics API
 * AI Botアクセスログの取得と分析
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAuthError, createInternalError, generateErrorId } from '@/lib/utils/data-normalization';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

// Type definitions
interface BotLogsQuery {
  organization_id?: string;
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
  is_fallback?: boolean;
  fallback_reason?: string;
}

// GET - AI Bot ログ一覧取得
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 管理者認証チェック（テスト用に一時無効化）
    // TODO: 本格運用時は requireUserWithClient 経由の認証チェックを有効化

    // クエリパラメータ解析
    const { searchParams } = new URL(request.url);
    const query: BotLogsQuery = {
      organization_id: searchParams.get('organization_id') || searchParams.get('org_id') || undefined,
      start_date: searchParams.get('start_date') || undefined,
      end_date: searchParams.get('end_date') || undefined,
      bot_name: searchParams.get('bot_name') || undefined,
      limit: Math.min(parseInt(searchParams.get('limit') || '50'), 1000), // 最大1000件
      offset: parseInt(searchParams.get('offset') || '0'),
    };

    // FK制約ベースの単純なJOINクエリ
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
    if (query.organization_id) {
      baseQuery = baseQuery.eq('organization_id', query.organization_id);
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
    const { data: logs, count, error: logsError } = await baseQuery
      .order('accessed_at', { ascending: false })
      .range(query.offset, query.offset + query.limit - 1);

    if (logsError) {
      // Check for missing table (fail-open)
      if (logsError.code === '42P01' || logsError.message?.includes('does not exist')) {
        logger.debug('ai_bot_logs table missing, returning empty data', { query });
        const fallbackResponse: BotLogsResponse = {
          logs: [],
          total_count: 0,
          pagination: {
            limit: query.limit,
            offset: query.offset,
            has_more: false,
          },
          is_fallback: true,
          fallback_reason: 'MISSING_TABLE'
        };
        return NextResponse.json(fallbackResponse);
      }
      
      logger.error('Error fetching bot logs:', { data: logsError });
      return NextResponse.json(
        { error: 'Database error', message: logsError.message },
        { status: 500 }
      );
    }

    // レスポンス整形（型安全な形でJOIN結果を処理）
    const formattedLogs: BotLogResponse[] = (logs || []).map(log => {
      // PostgREST JOINの結果をobject/arrayに関係なく処理
      const nested = (log as any).ai_content_units;
      const contentUnit = Array.isArray(nested) ? (nested[0] ?? null) : (nested ?? null);
      
      return {
        id: log.id,
        url: log.url,
        bot_name: log.bot_name,
        accessed_at: log.accessed_at,
        user_agent: log.user_agent,
        ip_address: log.ip_address,
        response_status: log.response_status,
        content_unit: contentUnit ? {
          title: contentUnit.title,
          content_type: contentUnit.content_type,
        } : null,
      };
    });

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
    logger.error('[GET /api/analytics/ai/bot-logs] Unexpected error:', { data: { errorId, error } });
    return createInternalError(errorId);
  }
}