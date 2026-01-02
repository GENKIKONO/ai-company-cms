/**
 * Admin Security Scan History API
 *
 * GET /api/admin/security/history - スキャン履歴を取得
 *
 * Response規約:
 *   成功: { success: true, data }
 *   失敗: { success: false, error_code, message }
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin, isAuthorized } from '@/lib/auth/require-admin';
import { ok, err, ErrorCodes } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 管理者認証ガード
    const authResult = await requireAdmin();
    if (!isAuthorized(authResult)) {
      return authResult.response;
    }

    const supabase = await createClient();

    // ops_audit から security_scan のログを取得
    const { data: scans, error: scansError } = await supabase
      .from('ops_audit')
      .select('id, action, target_type, target_id, user_id, metadata, created_at')
      .or('action.eq.security_scan,action.eq.security_scan_manual')
      .order('created_at', { ascending: false })
      .limit(50);

    if (scansError) {
      console.error('Scan history query error:', scansError);
      return NextResponse.json(
        err(ErrorCodes.QUERY_ERROR, scansError.message),
        { status: 500 }
      );
    }

    // 最新のアラートカウントを取得
    const { count: openAlertsCount } = await supabase
      .from('intrusion_detection_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open');

    const { count: totalAlertsCount } = await supabase
      .from('intrusion_detection_alerts')
      .select('*', { count: 'exact', head: true });

    // 最後のスキャン結果
    const lastScan = scans && scans.length > 0 ? scans[0] : null;

    return NextResponse.json(
      ok({
        history: scans || [],
        summary: {
          lastScanAt: lastScan?.created_at || null,
          openAlerts: openAlertsCount || 0,
          totalAlerts: totalAlertsCount || 0,
        },
      })
    );
  } catch (e) {
    console.error('Security history API error:', e);
    return NextResponse.json(
      err(ErrorCodes.INTERNAL_ERROR, e instanceof Error ? e.message : 'Internal server error'),
      { status: 500 }
    );
  }
}
