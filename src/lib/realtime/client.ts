import { createClient } from '@supabase/supabase-js';
import type { RealtimeChannelSendResponse } from '@supabase/realtime-js';

import { logger } from '@/lib/log';

/**
 * P1-4: Supabase Realtime 標準化ユーティリティ
 * 
 * 前提条件:
 * - realtime.messages テーブルにRLS設定済み（organization_members.user_id による制御）
 * - Supabase側で broadcast_changes トリガー実装済み
 * - private チャネルのみ使用（public チャネルは禁止）
 * 
 * Topic命名規約: org:{organizationId}:{entity}[:{suffix}]
 * 例: org:123e4567-e89b-12d3-a456-426614174000:ai_interview_sessions
 */

// P1-4で対応するエンティティ型（将来拡張可能）
export type OrgRealtimeEntity = 'ai_interview_sessions' | 'qna_stats';

// Realtime メッセージの基本構造
export interface OrgRealtimeMessage<T = unknown> {
  type: 'broadcast_changes';
  event: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  new?: T;
  old?: T;
  timestamp?: string;
}

// 購読設定
export interface OrgChannelSubscription {
  orgId: string;
  entity: OrgRealtimeEntity;
  suffix?: string;
  onMessage: (message: OrgRealtimeMessage) => void;
  onError?: (error: Error) => void;
  onSubscribed?: () => void;
  onUnsubscribed?: () => void;
}

// アクティブチャネル管理
interface ActiveChannel {
  channel: ReturnType<typeof createClient>['channel'] extends (...args: any[]) => infer R ? R : never;
  topic: string;
  subscriptionCount: number;
  lastActivity: number;
}

/**
 * Realtime クライアント管理クラス
 * 重複購読防止・cleanup・再接続を統一管理
 */
export class OrgRealtimeClient {
  private supabase: ReturnType<typeof createClient>;
  private activeChannels: Map<string, ActiveChannel> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private maxReconnectAttempts = 5;
  private baseReconnectDelay = 1000; // 1秒

  constructor() {
    // P1-3 で設定されたSupabaseクライアントを使用
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  /**
   * Topic名生成（命名規約統一）
   * org:{orgId}:{entity}[:{suffix}]
   */
  private generateTopic(orgId: string, entity: OrgRealtimeEntity, suffix?: string): string {
    const base = `org:${orgId}:${entity}`;
    return suffix ? `${base}:${suffix}` : base;
  }

  /**
   * 組織チャネル購読
   * 
   * 重要: RLS制御により、organization_members テーブルで権限チェックが行われる
   * クライアント側で誤ったorgIdを指定しても、他組織のデータは見えない
   * 
   * @param subscription 購読設定
   * @returns unsubscribe関数
   */
  public subscribeToOrgChannel(subscription: OrgChannelSubscription): () => void {
    const { orgId, entity, suffix, onMessage, onError, onSubscribed, onUnsubscribed } = subscription;
    
    // Topic名生成
    const topic = this.generateTopic(orgId, entity, suffix);
    
    logger.info('Subscribing to org channel', { topic, entity, orgId });
    
    // 既存チャネルがあれば参照カウントを増やす
    const existing = this.activeChannels.get(topic);
    if (existing) {
      existing.subscriptionCount++;
      existing.lastActivity = Date.now();
      logger.info('Reusing existing channel', { topic, count: existing.subscriptionCount });
      
      // 即座にonSubscribedを呼ぶ（既に購読済みのため）
      onSubscribed?.();
      
      return () => this.unsubscribeFromTopic(topic);
    }

    // 新規チャネル作成（private チャネル強制）
    const channel = this.supabase.channel(topic, {
      config: {
        private: true, // RLS による権限制御を有効化
      },
    });

    // broadcast メッセージ受信設定
    channel.on('broadcast', { event: '*' }, (payload) => {
      try {
        logger.debug('Received realtime message', { topic, payload });
        
        // broadcast_changes 形式のメッセージを想定
        const validEvent = payload.event === 'INSERT' || payload.event === 'UPDATE' || payload.event === 'DELETE' 
          ? payload.event as 'INSERT' | 'UPDATE' | 'DELETE'
          : 'UPDATE' as const;
        
        const message: OrgRealtimeMessage = {
          type: 'broadcast_changes',
          event: validEvent,
          table: payload.table || entity,
          schema: payload.schema || 'public',
          new: payload.new,
          old: payload.old,
          timestamp: new Date().toISOString(),
        };
        
        onMessage(message);
      } catch (error) {
        logger.error('Error processing realtime message', { topic, error, payload });
        onError?.(error instanceof Error ? error : new Error('Unknown message processing error'));
      }
    });

    // 購読開始
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        logger.info('Successfully subscribed to org channel', { topic });
        onSubscribed?.();
        
        // 再接続試行回数リセット
        this.reconnectAttempts.delete(topic);
      } else if (status === 'CHANNEL_ERROR') {
        logger.error('Channel subscription error', { topic });
        onError?.(new Error(`Channel subscription failed: ${topic}`));
        
        // 簡易再接続戦略
        this.handleReconnection(topic, subscription);
      } else if (status === 'CLOSED') {
        logger.warn('Channel closed', { topic });
        onUnsubscribed?.();
      }
    });

    // アクティブチャネル登録
    this.activeChannels.set(topic, {
      channel,
      topic,
      subscriptionCount: 1,
      lastActivity: Date.now(),
    });

    // unsubscribe 関数を返す
    return () => this.unsubscribeFromTopic(topic);
  }

  /**
   * Topic からの購読解除
   * 参照カウント管理により、最後の購読者が解除した時にチャネル破棄
   */
  private unsubscribeFromTopic(topic: string): void {
    const activeChannel = this.activeChannels.get(topic);
    if (!activeChannel) {
      logger.warn('Attempted to unsubscribe from non-existent topic', { topic });
      return;
    }

    activeChannel.subscriptionCount--;
    logger.info('Decreasing subscription count', { 
      topic, 
      count: activeChannel.subscriptionCount 
    });

    // 最後の購読者が解除した場合、チャネル破棄
    if (activeChannel.subscriptionCount <= 0) {
      logger.info('Removing channel (no more subscribers)', { topic });
      
      // Supabase チャネル削除
      this.supabase.removeChannel(activeChannel.channel);
      
      // 内部管理から削除
      this.activeChannels.delete(topic);
      this.reconnectAttempts.delete(topic);
    }
  }

  /**
   * 簡易再接続戦略
   * 指数バックオフで再接続試行（最大5回）
   */
  private handleReconnection(topic: string, originalSubscription: OrgChannelSubscription): void {
    const currentAttempts = this.reconnectAttempts.get(topic) || 0;
    
    if (currentAttempts >= this.maxReconnectAttempts) {
      logger.error('Max reconnection attempts reached', { topic, attempts: currentAttempts });
      originalSubscription.onError?.(
        new Error(`Failed to reconnect after ${this.maxReconnectAttempts} attempts`)
      );
      return;
    }

    const delay = this.baseReconnectDelay * Math.pow(2, currentAttempts);
    this.reconnectAttempts.set(topic, currentAttempts + 1);
    
    logger.info('Scheduling reconnection', { topic, attempt: currentAttempts + 1, delay });
    
    setTimeout(() => {
      // 既存チャネル削除
      this.unsubscribeFromTopic(topic);
      
      // 再購読
      this.subscribeToOrgChannel(originalSubscription);
    }, delay);
  }

  /**
   * 全チャネルクリーンアップ
   * アプリ終了時やログアウト時に使用
   */
  public cleanup(): void {
    logger.info('Cleaning up all realtime channels', { 
      count: this.activeChannels.size 
    });
    
    for (const [topic, activeChannel] of this.activeChannels.entries()) {
      this.supabase.removeChannel(activeChannel.channel);
      logger.info('Cleaned up channel', { topic });
    }
    
    this.activeChannels.clear();
    this.reconnectAttempts.clear();
  }

  /**
   * アクティブチャネル状況取得（デバッグ用）
   */
  public getActiveChannels(): Array<{ topic: string; subscriptionCount: number; lastActivity: Date }> {
    return Array.from(this.activeChannels.entries()).map(([topic, channel]) => ({
      topic,
      subscriptionCount: channel.subscriptionCount,
      lastActivity: new Date(channel.lastActivity),
    }));
  }
}

// シングルトンインスタンス
let realtimeClientInstance: OrgRealtimeClient | null = null;

/**
 * Realtime クライアントシングルトン取得
 * アプリ全体で1つのインスタンスを共有
 */
export function getOrgRealtimeClient(): OrgRealtimeClient {
  if (!realtimeClientInstance) {
    realtimeClientInstance = new OrgRealtimeClient();
  }
  return realtimeClientInstance;
}

/**
 * 組織チャネル購読のヘルパー関数
 * React コンポーネントから直接使用可能
 */
export function subscribeToOrgChannel(subscription: OrgChannelSubscription): () => void {
  const client = getOrgRealtimeClient();
  return client.subscribeToOrgChannel(subscription);
}

/**
 * 全チャネルクリーンアップのヘルパー関数
 * ログアウト時などで使用
 */
export function cleanupAllRealtimeChannels(): void {
  const client = getOrgRealtimeClient();
  client.cleanup();
}