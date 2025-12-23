'use client';

/**
 * Monthly Reports - Realtime Hooks (Final Version)
 *
 * 機能:
 * - 1ページ1チャンネル原則
 * - subscribe 前の setAuth（private チャンネル対応）
 * - 明示的 cleanup（unmount 時）
 * - 重複購読防止（subscription ID 管理）
 * - 順序/重複マージ（updated_at ベース）
 * - 接続エラー時のリトライ（指数バックオフ: 500ms * 1.8^n, max 3回）
 * - postgres_changes と broadcast の両方をサポート（移行期間用）
 *
 * Realtime移行方針:
 * - 現在: postgres_changes ベース（RLS で認可）
 * - 将来: broadcast ベース（realtime.broadcast_changes + RLS on realtime.messages）
 * - NEXT_PUBLIC_REALTIME_BROADCAST_MODE=true で broadcast 有効化
 *
 * 環境変数:
 * - NEXT_PUBLIC_REALTIME_BROADCAST_MODE: 'true' で broadcast モード有効（デフォルト: false）
 * - NEXT_PUBLIC_REALTIME_DEBUG: 'true' でデバッグログ有効
 * - NEXT_PUBLIC_REALTIME_DISABLE_RECONNECT: 'true' で再接続無効（テスト用）
 *
 * 将来の reports スキーマ移行時:
 * - トピック名は変更不要（Realtime は別レイヤー）
 * - 必要に応じて realtime スキーマに分離
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { getReportTopic, getJobTopic, type MonthlyReportRow, type MonthlyReportJobRow } from './client';
import {
  BROADCAST_EVENTS,
  CHANNEL_CONFIG,
  RECONNECT_CONFIG,
  REALTIME_TABLES,
  REALTIME_FLAGS,
  calculateBackoffDelay,
} from '@/lib/realtime/constants';

// =====================================================
// Constants (using centralized config)
// =====================================================

const MAX_RETRY_ATTEMPTS = RECONNECT_CONFIG.maxAttempts;
const RETRY_DELAY_MS = RECONNECT_CONFIG.baseDelayMs;

// Feature flag for broadcast mode (from centralized config)
const USE_BROADCAST_MODE = REALTIME_FLAGS.isBroadcastModeEnabled();

// Re-export for backward compatibility
export { BROADCAST_EVENTS };

// =====================================================
// Types
// =====================================================

export interface RealtimeState {
  isConnected: boolean;
  error: string | null;
  retryCount: number;
}

export interface UseReportRealtimeOptions {
  organizationId: string | null;
  enabled?: boolean;
  onReportChange?: (report: MonthlyReportRow, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void;
  onError?: (error: Error) => void;
  onConnectionChange?: (connected: boolean) => void;
}

export interface UseJobRealtimeOptions {
  organizationId: string | null;
  enabled?: boolean;
  onJobChange?: (job: MonthlyReportJobRow, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void;
  onError?: (error: Error) => void;
  onConnectionChange?: (connected: boolean) => void;
}

// =====================================================
// Utility: Duplicate/Sequence Merge
// =====================================================

interface EventRecord {
  id: string;
  updated_at: string;
  processed_at: number;
}

/**
 * イベントの重複/順序を管理するクラス
 * - 同一IDの古いイベントを無視
 * - 短時間内の重複イベントを無視
 */
class EventDeduplicator {
  private records: Map<string, EventRecord> = new Map();
  private readonly maxAge = 60000; // 60秒

  /**
   * イベントを処理すべきか判定
   * @returns true: 処理すべき, false: スキップ
   */
  shouldProcess(id: string, updatedAt: string): boolean {
    const now = Date.now();
    this.cleanup(now);

    const existing = this.records.get(id);

    if (existing) {
      // 既存レコードより古い場合はスキップ
      if (updatedAt <= existing.updated_at) {
        return false;
      }
      // 50ms以内の重複はスキップ（Realtime の重複配信対策）
      if (now - existing.processed_at < 50) {
        return false;
      }
    }

    // 新しいレコードとして記録
    this.records.set(id, {
      id,
      updated_at: updatedAt,
      processed_at: now
    });

    return true;
  }

  private cleanup(now: number): void {
    for (const [id, record] of this.records) {
      if (now - record.processed_at > this.maxAge) {
        this.records.delete(id);
      }
    }
  }

  clear(): void {
    this.records.clear();
  }
}

// =====================================================
// Report Realtime Hook
// =====================================================

/**
 * レポート更新のリアルタイム購読
 * トピック: org:{orgId}:monthly_reports
 *
 * 機能:
 * - private チャンネル対応（setAuth）
 * - 重複/順序マージ
 * - 自動リトライ
 */
export function useReportRealtime(options: UseReportRealtimeOptions): RealtimeState {
  const { organizationId, enabled = true, onReportChange, onError, onConnectionChange } = options;

  const [state, setState] = useState<RealtimeState>({
    isConnected: false,
    error: null,
    retryCount: 0
  });

  // Refs
  const channelRef = useRef<RealtimeChannel | null>(null);
  const subscriptionIdRef = useRef<string | null>(null);
  const deduplicatorRef = useRef(new EventDeduplicator());
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Callback refs
  const onReportChangeRef = useRef(onReportChange);
  const onErrorRef = useRef(onError);
  const onConnectionChangeRef = useRef(onConnectionChange);

  useEffect(() => {
    onReportChangeRef.current = onReportChange;
    onErrorRef.current = onError;
    onConnectionChangeRef.current = onConnectionChange;
  }, [onReportChange, onError, onConnectionChange]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    if (channelRef.current) {
      const supabase = createClient();
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    subscriptionIdRef.current = null;
    deduplicatorRef.current.clear();
  }, []);

  // Subscribe function with retry
  const subscribe = useCallback(async (retryCount: number = 0) => {
    if (!organizationId || !mountedRef.current) return;

    const supabase = createClient();
    const topic = getReportTopic(organizationId);

    // Cleanup existing
    cleanup();

    try {
      // setAuth for private channel (required before subscribe)
      const { data: { session } } = await supabase.auth.getSession();
      if (!session && mountedRef.current) {
        throw new Error('Authentication required for private channel');
      }

      if (!mountedRef.current) return;

      // Explicitly set auth token for realtime connection
      // This ensures proper authorization for private channels
      await supabase.realtime.setAuth(session.access_token);

      // Create channel with private config
      const channel = supabase
        .channel(topic, {
          config: {
            private: true,
            broadcast: { ack: true } // Enable acknowledgment
          }
        });

      // Handler for processing report changes
      const handleReportChange = (
        report: MonthlyReportRow,
        eventType: 'INSERT' | 'UPDATE' | 'DELETE'
      ) => {
        if (!mountedRef.current) return;
        if (!report) return;

        // Deduplicate based on id and updated_at
        if (!deduplicatorRef.current.shouldProcess(report.id, report.updated_at)) {
          return;
        }

        onReportChangeRef.current?.(report, eventType);
      };

      // Listen on broadcast events (future: DB triggers via realtime.broadcast_changes)
      if (USE_BROADCAST_MODE) {
        channel.on(
          'broadcast',
          { event: BROADCAST_EVENTS.REPORT_CHANGE },
          (payload: { payload: { new?: MonthlyReportRow; old?: MonthlyReportRow; eventType: string } }) => {
            const eventType = payload.payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
            const report = (eventType === 'DELETE' ? payload.payload.old : payload.payload.new) as MonthlyReportRow;
            handleReportChange(report, eventType);
          }
        );
      }

      // Listen on postgres_changes (current: RLS-based)
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: REALTIME_TABLES.AI_MONTHLY_REPORTS,
          filter: `organization_id=eq.${organizationId}`
        },
        (payload: RealtimePostgresChangesPayload<MonthlyReportRow>) => {
          const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
          const report = (eventType === 'DELETE' ? payload.old : payload.new) as MonthlyReportRow;
          handleReportChange(report, eventType);
        }
      );

      channel.subscribe((status) => {
          if (!mountedRef.current) return;

          if (status === 'SUBSCRIBED') {
            setState({ isConnected: true, error: null, retryCount: 0 });
            subscriptionIdRef.current = `report-${organizationId}`;
            onConnectionChangeRef.current?.(true);
          } else if (status === 'CHANNEL_ERROR') {
            const error = new Error(`Realtime subscription failed for ${topic}`);
            setState(prev => ({ ...prev, isConnected: false, error: error.message }));
            onConnectionChangeRef.current?.(false);
            onErrorRef.current?.(error);

            // Retry logic
            if (retryCount < MAX_RETRY_ATTEMPTS && mountedRef.current) {
              setState(prev => ({ ...prev, retryCount: retryCount + 1 }));
              retryTimeoutRef.current = setTimeout(() => {
                subscribe(retryCount + 1);
              }, RETRY_DELAY_MS * (retryCount + 1));
            }
          } else if (status === 'CLOSED') {
            setState(prev => ({ ...prev, isConnected: false }));
            subscriptionIdRef.current = null;
            onConnectionChangeRef.current?.(false);
          }
        });

      channelRef.current = channel;

    } catch (error) {
      if (!mountedRef.current) return;

      const message = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({ ...prev, isConnected: false, error: message }));
      onErrorRef.current?.(error instanceof Error ? error : new Error(message));
    }
  }, [organizationId, cleanup]);

  useEffect(() => {
    mountedRef.current = true;

    if (!enabled || !organizationId) {
      setState({ isConnected: false, error: null, retryCount: 0 });
      cleanup();
      return;
    }

    // Prevent duplicate subscription
    if (subscriptionIdRef.current === `report-${organizationId}`) {
      return;
    }

    subscribe();

    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [organizationId, enabled, subscribe, cleanup]);

  return state;
}

// =====================================================
// Job Realtime Hook
// =====================================================

/**
 * ジョブ状態のリアルタイム購読
 * トピック: report:{orgId}:jobs
 */
export function useJobRealtime(options: UseJobRealtimeOptions): RealtimeState {
  const { organizationId, enabled = true, onJobChange, onError, onConnectionChange } = options;

  const [state, setState] = useState<RealtimeState>({
    isConnected: false,
    error: null,
    retryCount: 0
  });

  // Refs
  const channelRef = useRef<RealtimeChannel | null>(null);
  const subscriptionIdRef = useRef<string | null>(null);
  const deduplicatorRef = useRef(new EventDeduplicator());
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Callback refs
  const onJobChangeRef = useRef(onJobChange);
  const onErrorRef = useRef(onError);
  const onConnectionChangeRef = useRef(onConnectionChange);

  useEffect(() => {
    onJobChangeRef.current = onJobChange;
    onErrorRef.current = onError;
    onConnectionChangeRef.current = onConnectionChange;
  }, [onJobChange, onError, onConnectionChange]);

  const cleanup = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    if (channelRef.current) {
      const supabase = createClient();
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    subscriptionIdRef.current = null;
    deduplicatorRef.current.clear();
  }, []);

  const subscribe = useCallback(async (retryCount: number = 0) => {
    if (!organizationId || !mountedRef.current) return;

    const supabase = createClient();
    const topic = getJobTopic(organizationId);

    cleanup();

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session && mountedRef.current) {
        throw new Error('Authentication required for private channel');
      }

      if (!mountedRef.current) return;

      // Explicitly set auth token for realtime connection
      await supabase.realtime.setAuth(session.access_token);

      const channel = supabase
        .channel(topic, {
          config: {
            private: true,
            broadcast: { ack: true }
          }
        });

      // Handler for processing job changes
      const handleJobChange = (
        job: MonthlyReportJobRow,
        eventType: 'INSERT' | 'UPDATE' | 'DELETE'
      ) => {
        if (!mountedRef.current) return;
        if (!job) return;

        if (!deduplicatorRef.current.shouldProcess(job.id, job.updated_at)) {
          return;
        }

        onJobChangeRef.current?.(job, eventType);
      };

      // Listen on broadcast events (future: DB triggers via realtime.broadcast_changes)
      if (USE_BROADCAST_MODE) {
        channel.on(
          'broadcast',
          { event: BROADCAST_EVENTS.JOB_CHANGE },
          (payload: { payload: { new?: MonthlyReportJobRow; old?: MonthlyReportJobRow; eventType: string } }) => {
            const eventType = payload.payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
            const job = (eventType === 'DELETE' ? payload.payload.old : payload.payload.new) as MonthlyReportJobRow;
            handleJobChange(job, eventType);
          }
        );
      }

      // Listen on postgres_changes (current: RLS-based)
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: REALTIME_TABLES.MONTHLY_REPORT_JOBS,
          filter: `organization_id=eq.${organizationId}`
        },
        (payload: RealtimePostgresChangesPayload<MonthlyReportJobRow>) => {
          const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
          const job = (eventType === 'DELETE' ? payload.old : payload.new) as MonthlyReportJobRow;
          handleJobChange(job, eventType);
        }
      );

      channel.subscribe((status) => {
          if (!mountedRef.current) return;

          if (status === 'SUBSCRIBED') {
            setState({ isConnected: true, error: null, retryCount: 0 });
            subscriptionIdRef.current = `job-${organizationId}`;
            onConnectionChangeRef.current?.(true);
          } else if (status === 'CHANNEL_ERROR') {
            const error = new Error(`Realtime subscription failed for ${topic}`);
            setState(prev => ({ ...prev, isConnected: false, error: error.message }));
            onConnectionChangeRef.current?.(false);
            onErrorRef.current?.(error);

            if (retryCount < MAX_RETRY_ATTEMPTS && mountedRef.current) {
              setState(prev => ({ ...prev, retryCount: retryCount + 1 }));
              retryTimeoutRef.current = setTimeout(() => {
                subscribe(retryCount + 1);
              }, RETRY_DELAY_MS * (retryCount + 1));
            }
          } else if (status === 'CLOSED') {
            setState(prev => ({ ...prev, isConnected: false }));
            subscriptionIdRef.current = null;
            onConnectionChangeRef.current?.(false);
          }
        });

      channelRef.current = channel;

    } catch (error) {
      if (!mountedRef.current) return;

      const message = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({ ...prev, isConnected: false, error: message }));
      onErrorRef.current?.(error instanceof Error ? error : new Error(message));
    }
  }, [organizationId, cleanup]);

  useEffect(() => {
    mountedRef.current = true;

    if (!enabled || !organizationId) {
      setState({ isConnected: false, error: null, retryCount: 0 });
      cleanup();
      return;
    }

    if (subscriptionIdRef.current === `job-${organizationId}`) {
      return;
    }

    subscribe();

    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [organizationId, enabled, subscribe, cleanup]);

  return state;
}

// =====================================================
// Combined Realtime Hook (Reports + Jobs)
// =====================================================

export interface UseCombinedRealtimeOptions {
  organizationId: string | null;
  enabled?: boolean;
  onReportChange?: (report: MonthlyReportRow, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void;
  onJobChange?: (job: MonthlyReportJobRow, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void;
  onError?: (error: Error) => void;
  onConnectionChange?: (connected: boolean) => void;
}

export interface CombinedRealtimeState {
  reportConnected: boolean;
  jobConnected: boolean;
  isConnected: boolean;
  error: string | null;
  retryCount: number;
}

/**
 * レポートとジョブの両方を購読する統合フック
 * 1ページで両方必要な場合に使用
 */
export function useCombinedRealtime(options: UseCombinedRealtimeOptions): CombinedRealtimeState {
  const {
    organizationId,
    enabled = true,
    onReportChange,
    onJobChange,
    onError,
    onConnectionChange
  } = options;

  const reportState = useReportRealtime({
    organizationId,
    enabled,
    onReportChange,
    onError,
    onConnectionChange
  });

  const jobState = useJobRealtime({
    organizationId,
    enabled,
    onJobChange,
    onError,
    onConnectionChange
  });

  const isConnected = reportState.isConnected || jobState.isConnected;

  return {
    reportConnected: reportState.isConnected,
    jobConnected: jobState.isConnected,
    isConnected,
    error: reportState.error || jobState.error,
    retryCount: Math.max(reportState.retryCount, jobState.retryCount)
  };
}
