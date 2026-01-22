/**
 * /api/dashboard/export - 組織のコンテンツ統計エクスポートAPI
 *
 * 【認証方式】
 * - createApiAuthClient を使用（統一認証ヘルパー）
 * - getUser() が唯一の Source of Truth
 * - Cookie 同期は applyCookies で行う
 * - orgId の正当性はサーバー側で必ず検証
 *
 * @see src/lib/supabase/api-auth.ts
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createApiAuthClient, ApiAuthException } from '@/lib/supabase/api-auth';
import { logger } from '@/lib/log';
import type { SupabaseClient } from '@supabase/supabase-js';

interface CountResult {
  count: number;
  latest: string;
}

async function count(
  supabase: SupabaseClient,
  table: string,
  orgId: string,
  where?: Record<string, unknown>
): Promise<CountResult> {
  try {
    let q = supabase
      .from(table)
      .select('updated_at', { count: 'exact' })
      .eq('organization_id', orgId)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (where) {
      Object.entries(where).forEach(([k, v]) => {
        q = q.eq(k, v);
      });
    }

    const { data, count: totalCount, error } = await q;

    if (error) throw error;

    return {
      count: totalCount ?? 0,
      latest: data?.[0]?.updated_at ?? '',
    };
  } catch (error) {
    logger.error(`Error counting ${table}:`, { data: error });
    // テーブルが存在しない場合は0を返す
    return { count: 0, latest: '' };
  }
}

export async function GET(request: NextRequest) {
  try {
    const { supabase, user, applyCookies, requestId } = await createApiAuthClient(request);

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');

    if (!orgId) {
      logger.warn('[export] Missing orgId', { requestId, userId: user.id });
      return applyCookies(new NextResponse('orgId required', { status: 400 }));
    }

    // 【重要】org membership をサーバー側で検証（クエリパラメータを信用しない）
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .eq('organization_id', orgId)
      .maybeSingle();

    if (membershipError) {
      logger.error('[export] Membership check failed', {
        requestId,
        userId: user.id,
        orgId,
        error: membershipError.message,
      });
      return applyCookies(new NextResponse('Failed to verify membership', { status: 500 }));
    }

    if (!membership) {
      logger.warn('[export] User not member of org', { requestId, userId: user.id, orgId });
      return applyCookies(new NextResponse('Not a member of this organization', { status: 403 }));
    }

    // RLSベースで統計を取得（service_role 廃止）
    const tables = ['posts', 'services', 'case_studies', 'faqs', 'contacts'];
    const results: Array<{ type: string; count: number; latest: string }> = [];

    for (const table of tables) {
      try {
        const result = await count(supabase, table, orgId);
        results.push({
          type: table,
          count: result.count,
          latest: result.latest,
        });
      } catch (error) {
        logger.error(`[export] Failed to count ${table}:`, { requestId, data: error });
        results.push({
          type: table,
          count: 0,
          latest: '',
        });
      }
    }

    logger.info('[export] Success', {
      requestId,
      userId: user.id,
      orgId,
      tableCount: results.length,
    });

    // CSVヘッダー
    const header = 'type,total,latest_updated_at';

    // CSVデータ行
    const csvRows = results.map((r) => `${r.type},${r.count},${r.latest}`);

    const csv = [header, ...csvRows].join('\n');

    const response = new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="export_${orgId}_${new Date().toISOString().split('T')[0]}.csv"`,
        'x-request-id': requestId,
      },
    });

    return applyCookies(response);

  } catch (error) {
    if (error instanceof ApiAuthException) {
      return error.toResponse();
    }

    logger.error('[export] Unexpected error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return new NextResponse(`error,${error instanceof Error ? error.message : 'Unknown error'}`, {
      status: 500,
      headers: {
        'Content-Type': 'text/csv',
      },
    });
  }
}