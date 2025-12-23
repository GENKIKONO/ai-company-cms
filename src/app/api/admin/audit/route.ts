/**
 * Admin Audit Log API
 *
 * GET /api/admin/audit - ops_audit テーブルから監査ログを取得
 * Query params:
 *   - from: ISO日付 (開始日)
 *   - to: ISO日付 (終了日)
 *   - action: アクションタイプでフィルター
 *   - actor: 実行者IDで部分一致フィルター
 *   - target: 対象で部分一致フィルター
 *   - cursor: ページネーション用カーソル (created_at)
 *   - limit: 取得件数 (デフォルト50, 最大100)
 *
 * Response規約:
 *   成功: { success: true, data, meta }
 *   失敗: { success: false, error_code, message }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin, isAuthorized } from '@/lib/auth/require-admin';
import { ok, err, ErrorCodes } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 管理者認証ガード
    const authResult = await requireAdmin();
    if (!isAuthorized(authResult)) {
      return authResult.response;
    }

    const supabase = await createClient();

    // クエリパラメータ取得
    const searchParams = request.nextUrl.searchParams;
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const action = searchParams.get('action');
    const actor = searchParams.get('actor');
    const target = searchParams.get('target');
    const cursor = searchParams.get('cursor');
    const limitParam = searchParams.get('limit');

    const limit = Math.min(parseInt(limitParam || '50', 10), 100);

    // クエリビルド（インデックス最適化: action + created_at DESC）
    let query = supabase
      .from('ops_audit')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(limit);

    // フィルター適用
    if (from) {
      query = query.gte('created_at', from);
    }
    if (to) {
      query = query.lte('created_at', to);
    }
    if (action) {
      query = query.eq('action', action);
    }
    if (actor) {
      query = query.ilike('actor_id', `%${actor}%`);
    }
    if (target) {
      // target_type または target_id で部分一致
      query = query.or(`target_type.ilike.%${target}%,target_id.ilike.%${target}%`);
    }
    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Audit query error:', error);
      return NextResponse.json(
        err(ErrorCodes.QUERY_ERROR, error.message),
        { status: 500 }
      );
    }

    // 次のカーソルを計算
    const nextCursor = data && data.length === limit
      ? data[data.length - 1].created_at
      : null;

    const duration = Date.now() - startTime;

    return NextResponse.json(
      ok(
        { items: data || [], count: count || 0, nextCursor },
        { limit, duration_ms: duration }
      )
    );
  } catch (e) {
    console.error('Audit API error:', e);
    return NextResponse.json(
      err(ErrorCodes.INTERNAL_ERROR, e instanceof Error ? e.message : 'Internal server error'),
      { status: 500 }
    );
  }
}
