/**
 * Admin Security Scan API
 *
 * POST /api/admin/security/scan - 手動でセキュリティスキャンを実行
 *
 * Response規約:
 *   成功: { success: true, data }
 *   失敗: { success: false, error_code, message }
 */

import { NextResponse } from 'next/server';
import { requireAdmin, isAuthorized } from '@/lib/auth/require-admin';
import { runManualSecurityScan } from '@/lib/jobs/security-scan-job';
import { createClient } from '@/lib/supabase/server';
import { ok, err, ErrorCodes } from '@/lib/api/response';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

export async function POST() {
  const startTime = Date.now();

  try {
    // 管理者認証ガード
    const authResult = await requireAdmin();
    if (!isAuthorized(authResult)) {
      return authResult.response;
    }

    // セキュリティスキャン実行
    const result = await runManualSecurityScan(authResult.userId);
    const duration = Date.now() - startTime;

    // ops_audit に監査記録
    const supabase = await createClient();
    await supabase.from('ops_audit').insert({
      action: 'security_scan_manual',
      actor_id: authResult.userId,
      target_type: 'api',
      target_id: '/api/admin/security/scan',
      details: {
        success: result.success,
        alertsDetected: result.alertsDetected ?? 0,
        duration,
        error: result.error || null,
      },
    });

    if (!result.success) {
      return NextResponse.json(
        err(ErrorCodes.SCAN_FAILED, result.error || 'Scan failed', result),
        { status: 500 }
      );
    }

    return NextResponse.json(
      ok({
        success: true,
        message: 'Security scan completed',
        result: {
          alertsDetected: result.alertsDetected ?? 0,
          newAlerts: result.newAlerts ?? 0,
          duration_ms: duration,
          timestamp: result.timestamp,
        },
      })
    );
  } catch (e) {
    logger.error('Security scan API error:', { data: e });
    return NextResponse.json(
      err(ErrorCodes.INTERNAL_ERROR, e instanceof Error ? e.message : 'Internal server error'),
      { status: 500 }
    );
  }
}
