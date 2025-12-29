/**
 * Admin Audit Log API
 *
 * GET /api/admin/audit - ops_audit テーブルから監査ログを取得
 * POST /api/admin/audit - admin_audit_logs テーブルに監査ログを記録
 *
 * Query params (GET):
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
import { getUserWithClient } from '@/lib/core/auth-state';
import { ok, err, ErrorCodes } from '@/lib/api/response';
import { writeAdminAuditLog, AuditLogEntry } from '@/lib/admin/audit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// POST用バリデーション
const auditLogSchema = z.object({
  actor_user_id: z.string().uuid(),
  action: z.string().min(1).max(100),
  entity_type: z.string().min(1).max(50),
  entity_id: z.string().min(1).max(100),
  before: z.record(z.unknown()).nullable().optional(),
  after: z.record(z.unknown()).nullable().optional(),
  org_id: z.string().uuid().nullable().optional(),
});

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

/**
 * POST: 監査ログを記録（admin_audit_logs テーブル）
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 認証確認（Core経由）
    const user = await getUserWithClient(supabase);
    if (!user) {
      return NextResponse.json(
        err(ErrorCodes.UNAUTHORIZED, '認証が必要です'),
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = auditLogSchema.parse(body);

    // actor_user_idが現在のユーザーと一致するか、管理者であることを確認
    if (validated.actor_user_id !== user.id) {
      const authResult = await requireAdmin();
      if (!isAuthorized(authResult)) {
        return authResult.response;
      }
    }

    const entry: AuditLogEntry = {
      actor_user_id: validated.actor_user_id,
      action: validated.action,
      entity_type: validated.entity_type,
      entity_id: validated.entity_id,
      before: validated.before || null,
      after: validated.after || null,
      org_id: validated.org_id || null,
    };

    const success = await writeAdminAuditLog(supabase, entry);

    if (!success) {
      // テーブルがない場合でも成功として扱う（警告はログに出力済み）
      return NextResponse.json(
        ok({ logged: false, message: 'Audit log table may not exist yet' })
      );
    }

    return NextResponse.json(ok({ logged: true }));
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        err(ErrorCodes.VALIDATION_ERROR, '入力データが無効です'),
        { status: 400 }
      );
    }
    console.error('Audit POST error:', e);
    return NextResponse.json(
      err(ErrorCodes.INTERNAL_ERROR, e instanceof Error ? e.message : 'Internal server error'),
      { status: 500 }
    );
  }
}
