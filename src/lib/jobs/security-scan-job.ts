/**
 * Security Scan Job
 *
 * Daily cron job that executes intrusion detection via Supabase RPC
 * and logs the results to ops_audit
 */

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/log';

export interface SecurityScanResult {
  success: boolean;
  alertsDetected?: number;
  newAlerts?: number;
  error?: string;
  timestamp: string;
  duration?: number;
}

export async function runSecurityScan(): Promise<SecurityScanResult> {
  const startTime = Date.now();

  try {
    logger.debug('[Security Scan] Starting intrusion detection scan...');

    const supabase = await createClient();

    // Execute the intrusion detection RPC
    const { data, error } = await supabase.rpc('execute_intrusion_detection');

    if (error) {
      logger.error('[Security Scan] RPC failed:', { data: error });
      throw new Error(`Intrusion detection RPC failed: ${error.message}`);
    }

    const duration = Date.now() - startTime;
    logger.debug('[Security Scan] Scan completed', { data: { duration, result: data } });

    // Log to admin-audit-log Edge Function
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (supabaseUrl) {
        await fetch(`${supabaseUrl}/functions/v1/admin-audit-log`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({
            action: 'security_scan',
            target: '/api/cron/daily',
            details: {
              source: 'daily-cron',
              duration,
              result: data,
              timestamp: new Date().toISOString(),
            },
          }),
        });
      }
    } catch (auditError) {
      // Log error but don't fail the job
      logger.warn('[Security Scan] Failed to record audit log', {
        data: { error: auditError instanceof Error ? auditError.message : String(auditError) },
      });
    }

    // Parse result - structure depends on RPC implementation
    const alertsDetected = data?.alerts_count ?? data?.total ?? 0;
    const newAlerts = data?.new_alerts ?? 0;

    return {
      success: true,
      alertsDetected,
      newAlerts,
      duration,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Security Scan] Scan failed:', { data: { error: errorMsg, duration } });

    return {
      success: false,
      error: errorMsg,
      duration,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Run security scan manually (for admin UI)
 */
export async function runManualSecurityScan(actorId?: string): Promise<SecurityScanResult> {
  const result = await runSecurityScan();

  // Additional audit logging for manual scans
  if (actorId) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (supabaseUrl) {
        await fetch(`${supabaseUrl}/functions/v1/admin-audit-log`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({
            action: 'security_scan_manual',
            actor: actorId,
            target: '/dashboard/admin/security',
            details: {
              source: 'manual',
              result,
              timestamp: new Date().toISOString(),
            },
          }),
        });
      }
    } catch {
      // Ignore audit log errors
    }
  }

  return result;
}
