/**
 * Analytics Admin API
 * アナリティクスイベント取得・集計
 *
 * GET: イベント一覧/集計取得
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireSiteAdmin, SiteAdminRequiredError } from '@/lib/billing';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    await requireSiteAdmin(supabase);

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const featureId = searchParams.get('feature_id');
    const eventKey = searchParams.get('event_key');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const mode = searchParams.get('mode') || 'list'; // list | summary
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    if (mode === 'summary') {
      // 集計モード
      return await getSummary(supabase, {
        userId,
        featureId,
        eventKey,
        startDate,
        endDate,
      });
    }

    // リストモード
    let query = supabase
      .from('analytics_events')
      .select(
        `
        *,
        feature:features(id, key, name)
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (featureId) {
      query = query.eq('feature_id', featureId);
    }

    if (eventKey) {
      query = query.eq('event_key', eventKey);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('[admin/billing/analytics] GET error:', error);
      return NextResponse.json(
        { error: 'イベント一覧の取得に失敗しました', code: error.code },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data,
      total: count,
      limit,
      offset,
    });
  } catch (err) {
    if (err instanceof SiteAdminRequiredError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.status }
      );
    }
    console.error('[admin/billing/analytics] GET unexpected error:', err);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

async function getSummary(
  supabase: Awaited<ReturnType<typeof createClient>>,
  filters: {
    userId: string | null;
    featureId: string | null;
    eventKey: string | null;
    startDate: string | null;
    endDate: string | null;
  }
) {
  try {
    // 基本的な集計クエリ
    // TODO: 将来的にDB側に集計ビューを作成して最適化
    let query = supabase.from('analytics_events').select('event_key, feature_id, created_at');

    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }

    if (filters.featureId) {
      query = query.eq('feature_id', filters.featureId);
    }

    if (filters.eventKey) {
      query = query.eq('event_key', filters.eventKey);
    }

    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[admin/billing/analytics] getSummary error:', error);
      return NextResponse.json(
        { error: '集計の取得に失敗しました', code: error.code },
        { status: 500 }
      );
    }

    // クライアント側で集計
    const eventCounts: Record<string, number> = {};
    const featureCounts: Record<string, number> = {};
    const dailyCounts: Record<string, number> = {};

    for (const event of data || []) {
      // イベントキー別
      eventCounts[event.event_key] = (eventCounts[event.event_key] || 0) + 1;

      // 機能別
      if (event.feature_id) {
        featureCounts[event.feature_id] = (featureCounts[event.feature_id] || 0) + 1;
      }

      // 日別
      const date = event.created_at.split('T')[0];
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    }

    return NextResponse.json({
      total_events: data?.length || 0,
      by_event_key: Object.entries(eventCounts)
        .map(([key, count]) => ({ event_key: key, count }))
        .sort((a, b) => b.count - a.count),
      by_feature: Object.entries(featureCounts)
        .map(([id, count]) => ({ feature_id: id, count }))
        .sort((a, b) => b.count - a.count),
      by_date: Object.entries(dailyCounts)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    });
  } catch (err) {
    console.error('[admin/billing/analytics] getSummary unexpected error:', err);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
