/**
 * Security Audit Logger
 * セキュリティ関連イベントの包括的な監査ログシステム
 *
 * 対象:
 * - 認証イベント（ログイン/ログアウト/失敗）
 * - 権限変更（ロール付与/剥奪）
 * - データアクセス（機密情報閲覧）
 * - 設定変更（セキュリティ設定）
 * - 管理操作（ユーザー管理）
 */

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

// 監査イベントタイプ
export type AuditEventType =
  // 認証
  | 'auth.login.success'
  | 'auth.login.failure'
  | 'auth.logout'
  | 'auth.password_change'
  | 'auth.password_reset_request'
  | 'auth.mfa_enabled'
  | 'auth.mfa_disabled'
  | 'auth.session_revoked'
  // 権限
  | 'authz.role_granted'
  | 'authz.role_revoked'
  | 'authz.permission_denied'
  | 'authz.admin_access'
  // データ
  | 'data.export'
  | 'data.delete'
  | 'data.sensitive_access'
  | 'data.bulk_operation'
  // 設定
  | 'config.security_setting_changed'
  | 'config.api_key_created'
  | 'config.api_key_revoked'
  | 'config.webhook_modified'
  // ユーザー管理
  | 'user.created'
  | 'user.deleted'
  | 'user.suspended'
  | 'user.reactivated'
  | 'user.invited'
  // 組織
  | 'org.created'
  | 'org.deleted'
  | 'org.member_added'
  | 'org.member_removed'
  | 'org.settings_changed'
  // セキュリティ
  | 'security.rate_limit_exceeded'
  | 'security.ip_blocked'
  | 'security.suspicious_activity'
  | 'security.anomaly_detected'
  | 'security.csrf_violation'
  // システム
  | 'system.admin_action'
  | 'system.migration_run'
  | 'system.maintenance';

// 重要度レベル
export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical';

// 監査ログエントリ
export interface AuditLogEntry {
  eventType: AuditEventType;
  severity: AuditSeverity;
  actorUserId?: string;
  actorEmail?: string;
  targetUserId?: string;
  targetEntityType?: string;
  targetEntityId?: string;
  organizationId?: string;
  ipAddress?: string;
  userAgent?: string;
  requestPath?: string;
  requestMethod?: string;
  details?: Record<string, unknown>;
  outcome: 'success' | 'failure' | 'blocked';
  errorMessage?: string;
}

// 監査ログクライアント設定
interface AuditLoggerConfig {
  enabled: boolean;
  logToConsole: boolean;
  logToDatabase: boolean;
  logToExternalService: boolean;
  minimumSeverity: AuditSeverity;
}

const config: AuditLoggerConfig = {
  enabled: process.env.AUDIT_LOGGING_ENABLED !== 'false',
  logToConsole: process.env.NODE_ENV !== 'production' || process.env.AUDIT_LOG_CONSOLE === 'true',
  logToDatabase: process.env.AUDIT_LOG_DATABASE !== 'false',
  logToExternalService: !!process.env.AUDIT_LOG_WEBHOOK_URL,
  minimumSeverity: (process.env.AUDIT_MINIMUM_SEVERITY as AuditSeverity) || 'info',
};

const severityOrder: Record<AuditSeverity, number> = {
  info: 0,
  warning: 1,
  error: 2,
  critical: 3,
};

/**
 * 監査ログを記録
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  if (!config.enabled) return;

  // 最小重要度チェック
  if (severityOrder[entry.severity] < severityOrder[config.minimumSeverity]) {
    return;
  }

  const timestamp = new Date().toISOString();
  const logId = generateLogId();

  const fullEntry = {
    id: logId,
    timestamp,
    ...entry,
  };

  // 並行して各出力先に送信
  const promises: Promise<void>[] = [];

  if (config.logToConsole) {
    promises.push(logToConsole(fullEntry));
  }

  if (config.logToDatabase) {
    promises.push(logToDatabase(fullEntry));
  }

  if (config.logToExternalService) {
    promises.push(logToExternalService(fullEntry));
  }

  // エラーは個別に処理、全体を失敗させない
  await Promise.allSettled(promises);
}

/**
 * コンソールにログ出力
 */
async function logToConsole(entry: Record<string, unknown>): Promise<void> {
  const severityColors: Record<AuditSeverity, string> = {
    info: '\x1b[36m',    // Cyan
    warning: '\x1b[33m', // Yellow
    error: '\x1b[31m',   // Red
    critical: '\x1b[35m', // Magenta
  };
  const reset = '\x1b[0m';

  const color = severityColors[(entry.severity as AuditSeverity) || 'info'];

  logger.info(
    `${color}[AUDIT]${reset} ${entry.eventType} | ${entry.outcome} | actor:${entry.actorEmail || entry.actorUserId || 'system'}`,
    { auditEntry: entry }
  );
}

/**
 * データベースにログ保存
 */
async function logToDatabase(entry: Record<string, unknown>): Promise<void> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.from('security_audit_logs').insert({
      id: entry.id,
      event_type: entry.eventType,
      severity: entry.severity,
      actor_user_id: entry.actorUserId,
      actor_email: entry.actorEmail,
      target_user_id: entry.targetUserId,
      target_entity_type: entry.targetEntityType,
      target_entity_id: entry.targetEntityId,
      organization_id: entry.organizationId,
      ip_address: entry.ipAddress,
      user_agent: entry.userAgent,
      request_path: entry.requestPath,
      request_method: entry.requestMethod,
      details: entry.details,
      outcome: entry.outcome,
      error_message: entry.errorMessage,
      created_at: entry.timestamp,
    });

    if (error) {
      // テーブルが存在しない場合はスキップ
      if (error.code === '42P01') {
        logger.warn('[AuditLogger] security_audit_logs table does not exist');
        return;
      }
      logger.error('[AuditLogger] Failed to save to database', { error });
    }
  } catch (error) {
    logger.error('[AuditLogger] Database error', { error });
  }
}

/**
 * 外部サービスにログ送信（SIEM統合用）
 */
async function logToExternalService(entry: Record<string, unknown>): Promise<void> {
  const webhookUrl = process.env.AUDIT_LOG_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Audit-Source': 'aiohub',
        ...(process.env.AUDIT_LOG_WEBHOOK_TOKEN && {
          Authorization: `Bearer ${process.env.AUDIT_LOG_WEBHOOK_TOKEN}`,
        }),
      },
      body: JSON.stringify({
        source: 'aiohub',
        ...entry,
      }),
    });

    if (!response.ok) {
      logger.error('[AuditLogger] External service returned error', {
        status: response.status,
      });
    }
  } catch (error) {
    logger.error('[AuditLogger] Failed to send to external service', { error });
  }
}

/**
 * ログIDを生成
 */
function generateLogId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `aud_${timestamp}_${random}`;
}

// ────────────────────────────────────────────────────────────────
// 便利なヘルパー関数
// ────────────────────────────────────────────────────────────────

/**
 * 認証成功ログ
 */
export async function logAuthSuccess(
  userId: string,
  email: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logAuditEvent({
    eventType: 'auth.login.success',
    severity: 'info',
    actorUserId: userId,
    actorEmail: email,
    ipAddress,
    userAgent,
    outcome: 'success',
  });
}

/**
 * 認証失敗ログ
 */
export async function logAuthFailure(
  email: string,
  reason: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logAuditEvent({
    eventType: 'auth.login.failure',
    severity: 'warning',
    actorEmail: email,
    ipAddress,
    userAgent,
    details: { reason },
    outcome: 'failure',
    errorMessage: reason,
  });
}

/**
 * 権限拒否ログ
 */
export async function logPermissionDenied(
  userId: string,
  resource: string,
  action: string,
  ipAddress?: string,
  requestPath?: string
): Promise<void> {
  await logAuditEvent({
    eventType: 'authz.permission_denied',
    severity: 'warning',
    actorUserId: userId,
    targetEntityType: resource,
    ipAddress,
    requestPath,
    details: { action, resource },
    outcome: 'blocked',
  });
}

/**
 * 管理者アクセスログ
 */
export async function logAdminAccess(
  userId: string,
  email: string,
  action: string,
  targetEntity?: { type: string; id: string },
  ipAddress?: string,
  requestPath?: string
): Promise<void> {
  await logAuditEvent({
    eventType: 'authz.admin_access',
    severity: 'info',
    actorUserId: userId,
    actorEmail: email,
    targetEntityType: targetEntity?.type,
    targetEntityId: targetEntity?.id,
    ipAddress,
    requestPath,
    details: { action },
    outcome: 'success',
  });
}

/**
 * セキュリティアラートログ
 */
export async function logSecurityAlert(
  alertType: 'rate_limit_exceeded' | 'ip_blocked' | 'suspicious_activity' | 'anomaly_detected' | 'csrf_violation',
  details: Record<string, unknown>,
  ipAddress?: string,
  userId?: string
): Promise<void> {
  const eventTypeMap: Record<string, AuditEventType> = {
    rate_limit_exceeded: 'security.rate_limit_exceeded',
    ip_blocked: 'security.ip_blocked',
    suspicious_activity: 'security.suspicious_activity',
    anomaly_detected: 'security.anomaly_detected',
    csrf_violation: 'security.csrf_violation',
  };

  await logAuditEvent({
    eventType: eventTypeMap[alertType],
    severity: alertType === 'csrf_violation' ? 'error' : 'warning',
    actorUserId: userId,
    ipAddress,
    details,
    outcome: 'blocked',
  });
}

/**
 * データエクスポートログ（GDPR用）
 */
export async function logDataExport(
  userId: string,
  email: string,
  dataCategories: string[],
  ipAddress?: string
): Promise<void> {
  await logAuditEvent({
    eventType: 'data.export',
    severity: 'info',
    actorUserId: userId,
    actorEmail: email,
    targetUserId: userId,
    ipAddress,
    details: { dataCategories },
    outcome: 'success',
  });
}

/**
 * データ削除ログ（GDPR用）
 */
export async function logDataDeletion(
  userId: string,
  email: string,
  reason?: string,
  ipAddress?: string
): Promise<void> {
  await logAuditEvent({
    eventType: 'data.delete',
    severity: 'warning',
    actorUserId: userId,
    actorEmail: email,
    targetUserId: userId,
    ipAddress,
    details: { reason: reason || 'User requested deletion (GDPR Art. 17)' },
    outcome: 'success',
  });
}

/**
 * MFA有効化ログ
 */
export async function logMFAEnabled(
  userId: string,
  email: string,
  ipAddress?: string
): Promise<void> {
  await logAuditEvent({
    eventType: 'auth.mfa_enabled',
    severity: 'info',
    actorUserId: userId,
    actorEmail: email,
    ipAddress,
    outcome: 'success',
  });
}

/**
 * MFA無効化ログ
 */
export async function logMFADisabled(
  userId: string,
  email: string,
  ipAddress?: string
): Promise<void> {
  await logAuditEvent({
    eventType: 'auth.mfa_disabled',
    severity: 'warning',
    actorUserId: userId,
    actorEmail: email,
    ipAddress,
    outcome: 'success',
  });
}

/**
 * パスワード変更ログ
 */
export async function logPasswordChange(
  userId: string,
  email: string,
  ipAddress?: string
): Promise<void> {
  await logAuditEvent({
    eventType: 'auth.password_change',
    severity: 'info',
    actorUserId: userId,
    actorEmail: email,
    ipAddress,
    outcome: 'success',
  });
}

/**
 * 組織メンバー追加ログ
 */
export async function logOrgMemberAdded(
  actorUserId: string,
  organizationId: string,
  targetUserId: string,
  role: string,
  ipAddress?: string
): Promise<void> {
  await logAuditEvent({
    eventType: 'org.member_added',
    severity: 'info',
    actorUserId,
    targetUserId,
    organizationId,
    ipAddress,
    details: { role },
    outcome: 'success',
  });
}

/**
 * 組織メンバー削除ログ
 */
export async function logOrgMemberRemoved(
  actorUserId: string,
  organizationId: string,
  targetUserId: string,
  ipAddress?: string
): Promise<void> {
  await logAuditEvent({
    eventType: 'org.member_removed',
    severity: 'warning',
    actorUserId,
    targetUserId,
    organizationId,
    ipAddress,
    outcome: 'success',
  });
}

export default {
  logAuditEvent,
  logAuthSuccess,
  logAuthFailure,
  logPermissionDenied,
  logAdminAccess,
  logSecurityAlert,
  logDataExport,
  logDataDeletion,
  logMFAEnabled,
  logMFADisabled,
  logPasswordChange,
  logOrgMemberAdded,
  logOrgMemberRemoved,
};
