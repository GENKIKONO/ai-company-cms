import { useEffect, useRef, useState, useCallback } from 'react';

import { subscribeToOrgChannel, type OrgRealtimeMessage } from '@/lib/realtime/client';
import { logger } from '@/lib/log';

/**
 * AI Interview Session データ型定義
 * Supabase ai_interview_sessions テーブル前提
 */
export interface AIInterviewSession {
  id: string;
  organization_id: string;
  user_id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  answers?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * Hook の設定オプション
 */
export interface UseOrgInterviewRealtimeOptions {
  /** 特定セッションIDのみ監視（指定しない場合は組織全体） */
  sessionId?: string;
  /** エラー発生時のコールバック */
  onError?: (error: Error) => void;
  /** 購読開始時のコールバック */
  onSubscribed?: () => void;
  /** 自動購読を無効化（手動制御したい場合） */
  disabled?: boolean;
}

/**
 * リアルタイム更新の状態
 */
export interface RealtimeState {
  /** 購読中かどうか */
  isSubscribed: boolean;
  /** 最後に受信した更新のタイムスタンプ */
  lastUpdate: Date | null;
  /** 接続エラー */
  error: Error | null;
}

/**
 * AI Interview Sessions のリアルタイム監視 Hook
 * 
 * 前提:
 * - P1-3 で実装した認証システムで組織メンバーシップ確認済み
 * - Supabase RLS で realtime.messages への access control 実装済み
 * - org:{orgId}:ai_interview_sessions トピックで broadcast_changes 配信済み
 * 
 * @param orgId 監視対象の組織ID
 * @param options Hook設定オプション
 * @returns リアルタイム状態とイベントハンドラー
 */
export function useOrgInterviewRealtime(
  orgId: string | null,
  options: UseOrgInterviewRealtimeOptions = {}
) {
  const { sessionId, onError, onSubscribed, disabled = false } = options;
  
  // リアルタイム状態管理
  const [realtimeState, setRealtimeState] = useState<RealtimeState>({
    isSubscribed: false,
    lastUpdate: null,
    error: null,
  });

  // unsubscribe 関数の参照保持（cleanup用）
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // 受信したイベントの統計（デバッグ用）
  const [eventStats, setEventStats] = useState({
    insertCount: 0,
    updateCount: 0,
    deleteCount: 0,
  });

  /**
   * Interview Session 変更イベントハンドラー
   */
  const handleInterviewSessionChange = useCallback((
    event: 'INSERT' | 'UPDATE' | 'DELETE',
    newData?: AIInterviewSession,
    oldData?: AIInterviewSession
  ) => {
    const sessionData = newData || oldData;
    if (!sessionData) return;

    logger.info('Interview session realtime update', {
      event,
      sessionId: sessionData.id,
      orgId: sessionData.organization_id,
      status: newData?.status,
    });

    // イベント統計更新
    setEventStats(prev => ({
      ...prev,
      insertCount: prev.insertCount + (event === 'INSERT' ? 1 : 0),
      updateCount: prev.updateCount + (event === 'UPDATE' ? 1 : 0),
      deleteCount: prev.deleteCount + (event === 'DELETE' ? 1 : 0),
    }));

    // 最終更新時刻記録
    setRealtimeState(prev => ({
      ...prev,
      lastUpdate: new Date(),
      error: null, // エラーをクリア
    }));

    // 特定セッションIDが指定されている場合のフィルタリング
    if (sessionId && sessionData.id !== sessionId) {
      logger.debug('Ignoring update for different session', {
        expected: sessionId,
        received: sessionData.id,
      });
      return;
    }

    // カスタムイベントをwindowに発火（他のコンポーネントでの利用を想定）
    const customEvent = new CustomEvent('ai-interview-session-update', {
      detail: {
        event,
        orgId: sessionData.organization_id,
        sessionId: sessionData.id,
        newData,
        oldData,
      },
    });
    window.dispatchEvent(customEvent);
  }, [sessionId]);

  // リアルタイム購読の開始/停止
  useEffect(() => {
    // 購読条件チェック
    if (disabled || !orgId || realtimeState.isSubscribed) {
      return;
    }

    logger.info('Starting interview sessions realtime subscription', { 
      orgId, 
      sessionId,
      disabled 
    });

    // 購読開始
    const unsubscribe = subscribeToOrgChannel({
      orgId,
      entity: 'ai_interview_sessions',
      suffix: sessionId, // 特定セッション監視の場合
      onMessage: (message: OrgRealtimeMessage) => {
        try {
          const { event, new: newData, old: oldData } = message;
          
          // ai_interview_sessions テーブルのメッセージのみ処理
          if (message.table !== 'ai_interview_sessions') {
            return;
          }

          handleInterviewSessionChange(
            event,
            newData as AIInterviewSession,
            oldData as AIInterviewSession
          );
        } catch (error) {
          const errorObj = error instanceof Error ? error : new Error('Unknown message processing error');
          logger.error('Error processing interview session update', { error: errorObj, message });
          
          setRealtimeState(prev => ({
            ...prev,
            error: errorObj,
          }));
          
          onError?.(errorObj);
        }
      },
      onError: (error) => {
        logger.error('Interview sessions realtime error', { error, orgId });
        
        setRealtimeState(prev => ({
          ...prev,
          error,
          isSubscribed: false,
        }));
        
        onError?.(error);
      },
      onSubscribed: () => {
        logger.info('Interview sessions realtime subscribed', { orgId, sessionId });
        
        setRealtimeState(prev => ({
          ...prev,
          isSubscribed: true,
          error: null,
        }));
        
        onSubscribed?.();
      },
      onUnsubscribed: () => {
        logger.info('Interview sessions realtime unsubscribed', { orgId, sessionId });
        
        setRealtimeState(prev => ({
          ...prev,
          isSubscribed: false,
        }));
      },
    });

    // unsubscribe 関数を保存
    unsubscribeRef.current = unsubscribe;

    // cleanup 関数
    return () => {
      if (unsubscribeRef.current) {
        logger.info('Cleaning up interview sessions realtime subscription', { orgId });
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [orgId, sessionId, disabled, onError, onSubscribed, handleInterviewSessionChange, realtimeState.isSubscribed]); // 依存配列を最小化

  // orgId変更時の再購読処理
  useEffect(() => {
    if (unsubscribeRef.current && orgId) {
      // 既存購読をクリーンアップして再購読
      unsubscribeRef.current();
      unsubscribeRef.current = null;
      
      setRealtimeState(prev => ({
        ...prev,
        isSubscribed: false,
      }));
    }
  }, [orgId]);

  // コンポーネントアンマウント時の確実なクリーンアップ
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, []);

  /**
   * 手動で再購読を開始
   */
  const reconnect = () => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    
    setRealtimeState(prev => ({
      ...prev,
      isSubscribed: false,
      error: null,
    }));

    // 次の描画サイクルで再購読（useEffectをトリガー）
    // Note: これはhackっぽいが、useEffectの依存配列を変えずに再購読する方法
  };

  return {
    /** リアルタイム接続状態 */
    realtimeState,
    
    /** イベント受信統計 */
    eventStats,
    
    /** 手動再接続 */
    reconnect,
    
    /** 購読中かどうか */
    isSubscribed: realtimeState.isSubscribed,
    
    /** 最後の更新時刻 */
    lastUpdate: realtimeState.lastUpdate,
    
    /** 接続エラー */
    error: realtimeState.error,
  };
}