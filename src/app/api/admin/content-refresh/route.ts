/**
 * P4-8: Content Refresh管理API
 * GET /api/admin/content-refresh - 履歴取得
 * POST /api/admin/content-refresh - 再実行トリガー
 *
 * admin-rpc.tsからAPI route経由パターンに移行
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin, isAuthorized } from '@/lib/auth/require-admin';
import { logger } from '@/lib/utils/logger';
import {
  handleApiError,
  handleDatabaseError,
  validationError,
} from '@/lib/api/error-responses';

// admin-rpc.tsから移行した型定義
interface ContentRefreshHistoryItem {
  job_id: string;
  entity_type: string;
  entity_id: string;
  content_version: number;
  trigger_source: string;
  status: 'running' | 'succeeded' | 'failed' | 'partial_error';
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
  steps: Array<{
    step: string;
    status: string;
    started_at: string;
    finished_at: string;
    duration_ms: number;
    items_processed?: number;
    error_message?: string;
  }>;
  error_message?: string;
}

interface ContentRefreshHistoryParams {
  limit?: number;
  offset?: number;
}

// 履歴取得
export async function GET(request: NextRequest) {
  // 管理者認証チェック
  const authResult = await requireAdmin();
  if (!isAuthorized(authResult)) {
    return authResult.response;
  }

  try {
    const supabase = await createClient();

    // クエリパラメータ解析
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // admin-rpc.tsと同じRPC呼び出し
    const { data, error } = await supabase.rpc('admin_get_content_refresh_history_guarded', {
      p_limit: limit,
      p_offset: offset
    });

    if (error) {
      logger.error('getContentRefreshHistory error:', { data: error });
      return handleDatabaseError(error);
    }

    return NextResponse.json({
      data: data || [],
      error: null
    });

  } catch (error) {
    logger.error('Content refresh history API error:', { data: error });
    return handleApiError(error);
  }
}

// 再実行トリガー
export async function POST(request: NextRequest) {
  // 管理者認証チェック
  const authResult = await requireAdmin();
  if (!isAuthorized(authResult)) {
    return authResult.response;
  }

  try {
    // リクエストボディ解析
    const body = await request.json();
    const { entity_type, entity_id, target_languages, force_refresh, skip_embedding, skip_cache_purge } = body;

    if (!entity_type || !entity_id) {
      return validationError([
        { field: 'entity_type', message: 'entity_type is required' },
        { field: 'entity_id', message: 'entity_id is required' }
      ]);
    }

    // admin-rpc.tsと同じEdge Function呼び出し
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/content-refresh-orchestrator`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        entity_type,
        entity_id,
        trigger_source: 'admin_ui',
        options: {
          target_langs: target_languages,
          force_refresh,
          skip_embedding,
          skip_cache_purge
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return handleApiError(new Error(`Content refresh trigger failed: ${response.status} ${errorText}`));
    }

    const result = await response.json();
    return NextResponse.json({ data: result, error: null });

  } catch (error) {
    logger.error('Content refresh trigger API error:', { data: error });
    return handleApiError(error);
  }
}