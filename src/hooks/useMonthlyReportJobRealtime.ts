'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import { getSessionClient } from '@/lib/core/auth-state.client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { toast } from 'sonner';
import type { Database } from '@/types/supabase';

type MonthlyReportJobRow = Database['public']['Tables']['monthly_report_jobs']['Row'];

type JobStatus = 'queued' | 'processing' | 'succeeded' | 'failed';

interface UseMonthlyReportJobRealtimeOptions {
  organizationId: string | null;
  autoConnect?: boolean;
  showToast?: boolean;
  onJobUpdate?: (job: MonthlyReportJobRow, eventType: 'INSERT' | 'UPDATE') => void;
  onError?: (error: Error) => void;
}

interface MonthlyReportJobRealtimeState {
  isConnected: boolean;
  lastEvent: {
    type: 'INSERT' | 'UPDATE' | null;
    jobId: string | null;
    status: JobStatus | null;
    timestamp: string | null;
  };
  error: string | null;
}

/**
 * 月次レポートジョブのRealtime更新を監視するフック
 *
 * トピック: report:{organizationId}:jobs
 * イベント: INSERT / UPDATE on monthly_report_jobs
 */
export function useMonthlyReportJobRealtime(options: UseMonthlyReportJobRealtimeOptions) {
  const {
    organizationId,
    autoConnect = true,
    showToast = true,
    onJobUpdate,
    onError
  } = options;

  const [state, setState] = useState<MonthlyReportJobRealtimeState>({
    isConnected: false,
    lastEvent: { type: null, jobId: null, status: null, timestamp: null },
    error: null
  });

  const channelRef = useRef<RealtimeChannel | null>(null);
  const mountedRef = useRef(true);

  // ステータスに応じたトースト表示
  const showStatusToast = useCallback((job: MonthlyReportJobRow, eventType: 'INSERT' | 'UPDATE') => {
    if (!showToast) return;

    const status = job.status as JobStatus;

    switch (status) {
      case 'queued':
        if (eventType === 'INSERT') {
          toast.info('レポート生成ジョブをキューに追加しました');
        }
        break;
      case 'processing':
        toast.info('レポートを生成中...');
        break;
      case 'succeeded':
        toast.success('レポート生成が完了しました');
        break;
      case 'failed':
        toast.error(`レポート生成に失敗しました: ${job.last_error || '不明なエラー'}`);
        break;
    }
  }, [showToast]);

  // Realtimeチャンネル接続
  const connect = useCallback(async () => {
    if (!organizationId || channelRef.current) return;

    const supabase = supabaseBrowser;

    try {
      // Realtime認証を設定
      const session = await getSessionClient();
      if (session?.access_token) {
        await supabase.realtime.setAuth(session.access_token);
      }

      // ジョブ専用チャンネルに接続
      const channelName = `report:${organizationId}:jobs`;
      const newChannel = supabase
        .channel(channelName, { config: { private: true } })
        .on(
          'broadcast',
          { event: 'INSERT' },
          (payload) => {
            if (!mountedRef.current) return;

            const job = payload.payload?.record as MonthlyReportJobRow;
            if (!job) return;

            setState(prev => ({
              ...prev,
              lastEvent: {
                type: 'INSERT',
                jobId: job.id,
                status: job.status as JobStatus,
                timestamp: new Date().toISOString()
              }
            }));

            showStatusToast(job, 'INSERT');
            onJobUpdate?.(job, 'INSERT');
          }
        )
        .on(
          'broadcast',
          { event: 'UPDATE' },
          (payload) => {
            if (!mountedRef.current) return;

            const job = payload.payload?.record as MonthlyReportJobRow;
            if (!job) return;

            setState(prev => ({
              ...prev,
              lastEvent: {
                type: 'UPDATE',
                jobId: job.id,
                status: job.status as JobStatus,
                timestamp: new Date().toISOString()
              }
            }));

            showStatusToast(job, 'UPDATE');
            onJobUpdate?.(job, 'UPDATE');
          }
        );

      // チャンネル状態監視
      newChannel.subscribe((status) => {
        if (!mountedRef.current) return;

        if (status === 'SUBSCRIBED') {
          setState(prev => ({ ...prev, isConnected: true, error: null }));
        } else if (status === 'CLOSED') {
          setState(prev => ({ ...prev, isConnected: false }));
        } else if (status === 'CHANNEL_ERROR') {
          const error = new Error('ジョブRealtimeチャンネルエラー');
          setState(prev => ({ ...prev, isConnected: false, error: error.message }));
          onError?.(error);
        }
      });

      channelRef.current = newChannel;

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Realtime接続に失敗しました');
      setState(prev => ({ ...prev, error: error.message }));
      onError?.(error);
    }
  }, [organizationId, showStatusToast, onJobUpdate, onError]);

  // チャンネル切断
  const disconnect = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
      setState(prev => ({ ...prev, isConnected: false }));
    }
  }, []);

  // 初期化とクリーンアップ
  useEffect(() => {
    mountedRef.current = true;

    if (organizationId && autoConnect) {
      connect();
    }

    return () => {
      mountedRef.current = false;
      disconnect();
    };
  }, [organizationId, autoConnect, connect, disconnect]);

  return {
    isConnected: state.isConnected,
    lastEvent: state.lastEvent,
    error: state.error,
    connect,
    disconnect,
    channelName: organizationId ? `report:${organizationId}:jobs` : null
  };
}
