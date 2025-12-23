/**
 * Admin Security Alerts API
 *
 * GET /api/admin/security/alerts - 侵入検知アラート一覧を取得
 *
 * Query params:
 *   - status: open | investigating | resolved
 *   - severity: critical | high | medium | low (alert_level)
 *   - range: 1w | 4w | 12w (デフォルト4w)
 *   - limit: 取得件数 (デフォルト50)
 *   - cursor: ページネーション用カーソル (detected_at)
 *
 * Response規約:
 *   成功: { success: true, data: { items, nextCursor }, meta }
 *   失敗: { success: false, error_code, message }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin, isAuthorized } from '@/lib/auth/require-admin';
import { ok, err, ErrorCodes } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

// 期間を週数からDateに変換
function getDateFromRange(range: string): Date {
  const now = new Date();
  const weeks = parseInt(range.replace('w', ''), 10) || 4;
  return new Date(now.getTime() - weeks * 7 * 24 * 60 * 60 * 1000);
}

export async function GET(request: NextRequest) {
  try {
    // 管理者認証ガード
    const authResult = await requireAdmin();
    if (!isAuthorized(authResult)) {
      return authResult.response;
    }

    const supabase = await createClient();

    // クエリパラメータ取得
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');
    const range = searchParams.get('range') || '4w';
    const cursor = searchParams.get('cursor');
    const limitParam = searchParams.get('limit');

    const limit = Math.min(parseInt(limitParam || '50', 10), 100);
    const rangeStart = getDateFromRange(range);

    // クエリビルド
    let query = supabase
      .from('intrusion_detection_alerts')
      .select('*', { count: 'exact' })
      .gte('detected_at', rangeStart.toISOString())
      .order('detected_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }
    if (severity) {
      query = query.eq('severity', severity);
    }
    if (cursor) {
      query = query.lt('detected_at', cursor);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Alerts query error:', error);
      return NextResponse.json(
        err(ErrorCodes.QUERY_ERROR, error.message),
        { status: 500 }
      );
    }

    // 次のカーソルを計算
    const nextCursor =
      data && data.length === limit ? data[data.length - 1].detected_at : null;

    return NextResponse.json(
      ok(
        { items: data || [], nextCursor },
        { count: count || 0, limit, range }
      )
    );
  } catch (e) {
    console.error('Alerts API error:', e);
    return NextResponse.json(
      err(ErrorCodes.INTERNAL_ERROR, e instanceof Error ? e.message : 'Internal server error'),
      { status: 500 }
    );
  }
}
