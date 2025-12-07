/**
 * P4-8: Content Refresh管理API
 * GET /api/admin/content-refresh - 履歴取得
 * POST /api/admin/content-refresh - 再実行トリガー
 * 
 * admin-rpc.tsからAPI route経由パターンに移行
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Super Admin権限チェック（既存のmetricsAPIと同パターン）
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { data: user } = await supabase.auth.getUser();
    const userRole = user.user?.user_metadata?.role || 
                     user.user?.app_metadata?.role;
    
    if (userRole !== 'super_admin') {
      return NextResponse.json(
        { error: 'Super admin privileges required' },
        { status: 403 }
      );
    }

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
      console.error('getContentRefreshHistory error:', error);
      return NextResponse.json(
        {
          error: 'Failed to fetch content refresh history',
          details: error.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: data || [],
      error: null
    });

  } catch (error) {
    console.error('Content refresh history API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch content refresh history',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// 再実行トリガー
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Super Admin権限チェック
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { data: user } = await supabase.auth.getUser();
    const userRole = user.user?.user_metadata?.role || 
                     user.user?.app_metadata?.role;
    
    if (userRole !== 'super_admin') {
      return NextResponse.json(
        { error: 'Super admin privileges required' },
        { status: 403 }
      );
    }

    // リクエストボディ解析
    const body = await request.json();
    const { entity_type, entity_id, target_languages, force_refresh, skip_embedding, skip_cache_purge } = body;

    if (!entity_type || !entity_id) {
      return NextResponse.json(
        { error: 'entity_type and entity_id are required' },
        { status: 400 }
      );
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
      return NextResponse.json(
        {
          error: `Content refresh trigger failed: ${response.status} ${errorText}`,
          code: 'TRIGGER_FAILED'
        },
        { status: 500 }
      );
    }

    const result = await response.json();
    return NextResponse.json({ data: result, error: null });

  } catch (error) {
    console.error('Content refresh trigger API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to trigger content refresh',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}