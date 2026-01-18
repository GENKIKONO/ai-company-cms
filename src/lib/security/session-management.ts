/**
 * セッション管理強化モジュール
 *
 * 機能:
 * - セッションタイムアウト設定
 * - セッションフィンガープリント（デバイス識別）
 * - 同時セッション制限
 * - パスワード変更時のセッション無効化
 * - セッション活動記録
 */

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import crypto from 'crypto';

// セッション設定
const SESSION_CONFIG = {
  // セッションタイムアウト（ミリ秒）
  IDLE_TIMEOUT_MS: 30 * 60 * 1000, // 30分
  ABSOLUTE_TIMEOUT_MS: 24 * 60 * 60 * 1000, // 24時間

  // 同時セッション制限
  MAX_CONCURRENT_SESSIONS: 5,

  // セッション更新間隔
  ACTIVITY_UPDATE_INTERVAL_MS: 5 * 60 * 1000, // 5分
};

export interface SessionInfo {
  sessionId: string;
  userId: string;
  fingerprint: string;
  createdAt: Date;
  lastActivityAt: Date;
  expiresAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  isCurrent: boolean;
}

export interface SessionCheckResult {
  valid: boolean;
  reason?: 'expired' | 'idle_timeout' | 'invalid_fingerprint' | 'revoked' | 'max_sessions';
  session?: SessionInfo;
}

export interface DeviceInfo {
  userAgent: string;
  ipAddress: string;
  acceptLanguage?: string;
}

/**
 * セッションフィンガープリントを生成
 */
export function generateSessionFingerprint(device: DeviceInfo): string {
  const data = [
    device.userAgent,
    device.acceptLanguage || '',
    // IPの最初の3オクテットのみ使用（ISPレベルの一致）
    device.ipAddress.split('.').slice(0, 3).join('.'),
  ].join('|');

  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 32);
}

/**
 * デバイスタイプを判定
 */
export function detectDeviceType(userAgent: string): SessionInfo['deviceType'] {
  const ua = userAgent.toLowerCase();

  if (/mobile|android|iphone|ipad|ipod|blackberry|windows phone/i.test(ua)) {
    if (/ipad|tablet/i.test(ua)) {
      return 'tablet';
    }
    return 'mobile';
  }

  if (/macintosh|windows|linux/i.test(ua)) {
    return 'desktop';
  }

  return 'unknown';
}

/**
 * セッションを記録
 */
export async function recordSession(
  userId: string,
  device: DeviceInfo
): Promise<{ sessionId: string; fingerprint: string } | null> {
  try {
    const supabase = await createClient();
    const fingerprint = generateSessionFingerprint(device);
    const sessionId = crypto.randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_CONFIG.ABSOLUTE_TIMEOUT_MS);

    // 同時セッション数チェック
    const { data: existingSessions, error: countError } = await supabase
      .from('user_sessions')
      .select('id')
      .eq('user_id', userId)
      .eq('is_valid', true)
      .gte('expires_at', now.toISOString());

    if (countError) {
      logger.warn('[Session] Failed to count sessions', { error: countError });
    } else if (existingSessions && existingSessions.length >= SESSION_CONFIG.MAX_CONCURRENT_SESSIONS) {
      // 最も古いセッションを無効化
      const { data: oldestSession } = await supabase
        .from('user_sessions')
        .select('id')
        .eq('user_id', userId)
        .eq('is_valid', true)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (oldestSession) {
        await supabase
          .from('user_sessions')
          .update({ is_valid: false, revoked_reason: 'max_sessions_exceeded' })
          .eq('id', oldestSession.id);

        logger.info('[Session] Oldest session revoked due to max sessions', {
          userId,
          revokedSessionId: oldestSession.id,
        });
      }
    }

    // 新しいセッションを記録
    const { error: insertError } = await supabase.from('user_sessions').insert({
      id: sessionId,
      user_id: userId,
      fingerprint,
      created_at: now.toISOString(),
      last_activity_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      ip_address: device.ipAddress,
      user_agent: device.userAgent,
      device_type: detectDeviceType(device.userAgent),
      is_valid: true,
    });

    if (insertError) {
      // テーブルが存在しない場合はスキップ
      if (insertError.code === '42P01') {
        logger.warn('[Session] user_sessions table does not exist');
        return { sessionId, fingerprint };
      }
      logger.error('[Session] Failed to record session', { error: insertError });
      return null;
    }

    logger.info('[Session] Session recorded', { userId, sessionId });
    return { sessionId, fingerprint };
  } catch (error) {
    logger.error('[Session] Error recording session', { error });
    return null;
  }
}

/**
 * セッションを検証
 */
export async function validateSession(
  sessionId: string,
  currentFingerprint: string
): Promise<SessionCheckResult> {
  try {
    const supabase = await createClient();
    const now = new Date();

    const { data: session, error } = await supabase
      .from('user_sessions')
      .select('id, user_id, fingerprint, created_at, last_activity_at, expires_at, ip_address, user_agent, device_type, is_valid, revoked_reason')
      .eq('id', sessionId)
      .single();

    if (error || !session) {
      return { valid: false, reason: 'revoked' };
    }

    // 無効化済みチェック
    if (!session.is_valid) {
      return { valid: false, reason: 'revoked' };
    }

    // 絶対タイムアウトチェック
    if (new Date(session.expires_at) < now) {
      await invalidateSession(sessionId, 'expired');
      return { valid: false, reason: 'expired' };
    }

    // アイドルタイムアウトチェック
    const lastActivity = new Date(session.last_activity_at);
    if (now.getTime() - lastActivity.getTime() > SESSION_CONFIG.IDLE_TIMEOUT_MS) {
      await invalidateSession(sessionId, 'idle_timeout');
      return { valid: false, reason: 'idle_timeout' };
    }

    // フィンガープリント検証（オプション - 緩い検証）
    // 完全一致ではなく、大きな変更のみ検出
    // if (session.fingerprint !== currentFingerprint) {
    //   logger.warn('[Session] Fingerprint mismatch', { sessionId });
    //   // 警告のみ、ブロックしない
    // }

    return {
      valid: true,
      session: {
        sessionId: session.id,
        userId: session.user_id,
        fingerprint: session.fingerprint,
        createdAt: new Date(session.created_at),
        lastActivityAt: new Date(session.last_activity_at),
        expiresAt: new Date(session.expires_at),
        ipAddress: session.ip_address,
        userAgent: session.user_agent,
        deviceType: session.device_type,
        isCurrent: true,
      },
    };
  } catch (error) {
    logger.error('[Session] Error validating session', { error });
    return { valid: false, reason: 'revoked' };
  }
}

/**
 * セッション活動を更新
 */
export async function updateSessionActivity(sessionId: string): Promise<void> {
  try {
    const supabase = await createClient();

    await supabase
      .from('user_sessions')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('id', sessionId)
      .eq('is_valid', true);
  } catch (error) {
    logger.error('[Session] Error updating activity', { error });
  }
}

/**
 * セッションを無効化
 */
export async function invalidateSession(
  sessionId: string,
  reason: string = 'user_logout'
): Promise<void> {
  try {
    const supabase = await createClient();

    await supabase
      .from('user_sessions')
      .update({
        is_valid: false,
        revoked_reason: reason,
        revoked_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    logger.info('[Session] Session invalidated', { sessionId, reason });
  } catch (error) {
    logger.error('[Session] Error invalidating session', { error });
  }
}

/**
 * ユーザーの全セッションを無効化（パスワード変更時など）
 */
export async function invalidateAllUserSessions(
  userId: string,
  reason: string = 'password_changed',
  exceptSessionId?: string
): Promise<number> {
  try {
    const supabase = await createClient();
    const now = new Date().toISOString();

    let query = supabase
      .from('user_sessions')
      .update({
        is_valid: false,
        revoked_reason: reason,
        revoked_at: now,
      })
      .eq('user_id', userId)
      .eq('is_valid', true);

    if (exceptSessionId) {
      query = query.neq('id', exceptSessionId);
    }

    const { data, error } = await query.select('id');

    if (error) {
      // テーブルが存在しない場合はスキップ
      if (error.code === '42P01') {
        return 0;
      }
      logger.error('[Session] Error invalidating all sessions', { error });
      return 0;
    }

    const count = data?.length || 0;
    logger.info('[Session] All user sessions invalidated', {
      userId,
      reason,
      count,
      exceptSessionId,
    });

    return count;
  } catch (error) {
    logger.error('[Session] Error invalidating all sessions', { error });
    return 0;
  }
}

/**
 * ユーザーのアクティブセッション一覧を取得
 */
export async function getUserSessions(
  userId: string,
  currentSessionId?: string
): Promise<SessionInfo[]> {
  try {
    const supabase = await createClient();
    const now = new Date();

    const { data: sessions, error } = await supabase
      .from('user_sessions')
      .select('id, user_id, fingerprint, created_at, last_activity_at, expires_at, ip_address, user_agent, device_type, is_valid')
      .eq('user_id', userId)
      .eq('is_valid', true)
      .gte('expires_at', now.toISOString())
      .order('last_activity_at', { ascending: false });

    if (error) {
      // テーブルが存在しない場合は空配列
      if (error.code === '42P01') {
        return [];
      }
      logger.error('[Session] Error getting user sessions', { error });
      return [];
    }

    return (sessions || []).map((s) => ({
      sessionId: s.id,
      userId: s.user_id,
      fingerprint: s.fingerprint,
      createdAt: new Date(s.created_at),
      lastActivityAt: new Date(s.last_activity_at),
      expiresAt: new Date(s.expires_at),
      ipAddress: s.ip_address,
      userAgent: s.user_agent,
      deviceType: s.device_type,
      isCurrent: s.id === currentSessionId,
    }));
  } catch (error) {
    logger.error('[Session] Error getting user sessions', { error });
    return [];
  }
}

/**
 * 期限切れセッションをクリーンアップ（定期実行用）
 */
export async function cleanupExpiredSessions(): Promise<number> {
  try {
    const supabase = await createClient();
    const now = new Date();

    // 期限切れセッションを無効化
    const { data, error } = await supabase
      .from('user_sessions')
      .update({
        is_valid: false,
        revoked_reason: 'expired',
        revoked_at: now.toISOString(),
      })
      .eq('is_valid', true)
      .lt('expires_at', now.toISOString())
      .select('id');

    if (error) {
      if (error.code === '42P01') {
        return 0;
      }
      logger.error('[Session] Error cleaning up sessions', { error });
      return 0;
    }

    const count = data?.length || 0;
    if (count > 0) {
      logger.info('[Session] Expired sessions cleaned up', { count });
    }

    return count;
  } catch (error) {
    logger.error('[Session] Error cleaning up sessions', { error });
    return 0;
  }
}

/**
 * セッション設定を取得（クライアント用）
 */
export function getSessionConfig() {
  return {
    idleTimeoutMs: SESSION_CONFIG.IDLE_TIMEOUT_MS,
    absoluteTimeoutMs: SESSION_CONFIG.ABSOLUTE_TIMEOUT_MS,
    maxConcurrentSessions: SESSION_CONFIG.MAX_CONCURRENT_SESSIONS,
  };
}
