/**
 * Admin Audit Log Library
 * 管理操作の監査ログ記録
 *
 * 最小スキーマ:
 * - who: actor_user_id
 * - what: action（例：admin.plan.update）
 * - target: entity_type / entity_id
 * - when: occurred_at
 * - context: ip_hash / user_agent
 * - diff: before / after
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';
import crypto from 'crypto';

export interface AuditLogEntry {
  /** 操作を行ったユーザーID */
  actor_user_id: string;
  /** アクション名（例：admin.plan.create, admin.feature.update） */
  action: string;
  /** 対象エンティティの種類 */
  entity_type: 'plans' | 'features' | 'plan_features' | 'feature_limits' | 'user_subscriptions' | 'analytics_events' | string;
  /** 対象エンティティのID */
  entity_id: string;
  /** 変更前の状態（JSON） */
  before?: Record<string, unknown> | null;
  /** 変更後の状態（JSON） */
  after?: Record<string, unknown> | null;
  /** 組織ID（マルチテナンシ準備） */
  org_id?: string | null;
}

interface AuditLogContext {
  ip_hash?: string;
  user_agent?: string;
}

/**
 * IPアドレスをハッシュ化
 */
function hashIP(ip: string): string {
  return crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16);
}

/**
 * リクエストコンテキストを取得
 */
async function getRequestContext(): Promise<AuditLogContext> {
  try {
    const headersList = await headers();
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIP = headersList.get('x-real-ip');
    const userAgent = headersList.get('user-agent');

    const ip = forwardedFor?.split(',')[0]?.trim() || realIP || 'unknown';

    return {
      ip_hash: ip !== 'unknown' ? hashIP(ip) : undefined,
      user_agent: userAgent?.slice(0, 500) || undefined,
    };
  } catch {
    return {};
  }
}

/**
 * 監査ログを記録
 *
 * @param supabase - Supabaseクライアント
 * @param entry - ログエントリ
 * @returns 成功したかどうか
 */
export async function writeAdminAuditLog(
  supabase: SupabaseClient,
  entry: AuditLogEntry
): Promise<boolean> {
  try {
    const context = await getRequestContext();

    const { error } = await supabase.from('admin_audit_logs').insert({
      actor_user_id: entry.actor_user_id,
      action: entry.action,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id,
      before: entry.before || null,
      after: entry.after || null,
      org_id: entry.org_id || null,
      ip_hash: context.ip_hash || null,
      user_agent: context.user_agent || null,
      occurred_at: new Date().toISOString(),
    });

    if (error) {
      // テーブルが存在しない場合は警告のみ
      if (error.code === '42P01') {
        // eslint-disable-next-line no-console
        console.warn('[AuditLog] Table admin_audit_logs does not exist yet');
        return false;
      }
      // eslint-disable-next-line no-console
      console.error('[AuditLog] Failed to write audit log:', error);
      return false;
    }

    return true;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[AuditLog] Unexpected error:', err);
    return false;
  }
}

/**
 * アクション名を生成するヘルパー
 *
 * @example
 * buildActionName('plan', 'create') // => 'admin.plan.create'
 * buildActionName('feature', 'update') // => 'admin.feature.update'
 */
export function buildActionName(
  entity: string,
  operation: 'create' | 'update' | 'delete' | 'enable' | 'disable' | 'export' | string
): string {
  return `admin.${entity}.${operation}`;
}

/**
 * 変更差分を計算するヘルパー
 */
export function computeDiff<T extends Record<string, unknown>>(
  before: T | null | undefined,
  after: T | null | undefined
): { before: Partial<T> | null; after: Partial<T> | null } {
  if (!before && !after) {
    return { before: null, after: null };
  }

  if (!before) {
    return { before: null, after: after as Partial<T> };
  }

  if (!after) {
    return { before: before as Partial<T>, after: null };
  }

  // 変更があったフィールドのみを抽出
  const changedBefore: Partial<T> = {};
  const changedAfter: Partial<T> = {};

  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

  for (const key of allKeys) {
    const beforeVal = before[key];
    const afterVal = after[key];

    if (JSON.stringify(beforeVal) !== JSON.stringify(afterVal)) {
      changedBefore[key as keyof T] = beforeVal as T[keyof T];
      changedAfter[key as keyof T] = afterVal as T[keyof T];
    }
  }

  return {
    before: Object.keys(changedBefore).length > 0 ? changedBefore : null,
    after: Object.keys(changedAfter).length > 0 ? changedAfter : null,
  };
}
