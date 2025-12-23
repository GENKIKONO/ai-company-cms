'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { toast } from 'sonner';
import type { Database } from '@/types/supabase';

type MonthlyReportRow = Database['public']['Tables']['ai_monthly_reports']['Row'];

interface UseMonthlyReportRealtimeOptions {
  organizationId: string | null;
  autoConnect?: boolean;
  showToast?: boolean;
  onReportUpdate?: (report: MonthlyReportRow, eventType: 'INSERT' | 'UPDATE') => void;
  onError?: (error: Error) => void;
}

interface MonthlyReportRealtimeState {
  isConnected: boolean;
  lastEvent: {
    type: 'INSERT' | 'UPDATE' | null;
    reportId: string | null;
    timestamp: string | null;
  };
  error: string | null;
}

/**
 * 月次レポートのRealtime更新を監視するフック
 *
 * トピック: org:{organizationId}:monthly_reports
 * イベント: INSERT / UPDATE on ai_monthly_reports
 */
export function useMonthlyReportRealtime(options: UseMonthlyReportRealtimeOptions) {
  const {
    organizationId,
    autoConnect = true,
    showToast = true,
    onReportUpdate,
    onError
  } = options;

  const [state, setState] = useState<MonthlyReportRealtimeState>({
    isConnected: false,
    lastEvent: { type: null, reportId: null, timestamp: null },
    error: null
  });

  const channelRef = useRef<RealtimeChannel | null>(null);
  const mountedRef = useRef(true);

  // ステータスに応じたトースト表示
  const showStatusToast = useCallback((report: MonthlyReportRow, eventType: 'INSERT' | 'UPDATE') => {
    if (!showToast) return;

    const periodLabel = report.period_start?.slice(0, 7) || '不明';

    switch (report.status) {
      case 'generating':
        toast.info(`${periodLabel} のレポートを生成中...`);
        break;
      case 'completed':
        toast.success(`${periodLabel} のレポートが完成しました`);
        break;
      case 'failed':
        toast.error(`${periodLabel} のレポート生成に失敗しました`);
        break;
      case 'pending':
        if (eventType === 'INSERT') {
          toast.info(`${periodLabel} のレポート生成をキューに追加しました`);
        }
        break;
    }
  }, [showToast]);

  // Realtimeチャンネル接続
  const connect = useCallback(async () => {
    if (!organizationId || channelRef.current) return;

    const supabase = supabaseBrowser;

    try {
      // Realtime認証を設定
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        await supabase.realtime.setAuth(session.access_token);
      }

      // 組織専用チャンネルに接続
      const channelName = `org:${organizationId}:monthly_reports`;
      const newChannel = supabase
        .channel(channelName, { config: { private: true } })
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'ai_monthly_reports',
            filter: `organization_id=eq.${organizationId}`
          },
          (payload: RealtimePostgresChangesPayload<MonthlyReportRow>) => {
            if (!mountedRef.current) return;

            const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
            if (eventType === 'DELETE') return; // DELETEは無視

            const report = payload.new as MonthlyReportRow;

            setState(prev => ({
              ...prev,
              lastEvent: {
                type: eventType,
                reportId: report.id,
                timestamp: new Date().toISOString()
              }
            }));

            showStatusToast(report, eventType);
            onReportUpdate?.(report, eventType);
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
          const error = new Error('Realtimeチャンネルエラー');
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
  }, [organizationId, showStatusToast, onReportUpdate, onError]);

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
    channelName: organizationId ? `org:${organizationId}:monthly_reports` : null
  };
}
