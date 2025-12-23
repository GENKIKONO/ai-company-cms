/**
 * Realtime Channel Factory
 * RLS対応の組織スコープチャンネル生成
 */

import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { orgTopic } from './topics';

interface ChannelConfig {
  private?: boolean;
  broadcast?: { self?: boolean; ack?: boolean };
  presence?: { key?: string };
}

/**
 * 組織スコープのRealtimeチャンネルを生成
 * private: true がデフォルトで設定される（RLS必須）
 */
export function channelForOrgEntity(
  supabase: SupabaseClient,
  orgId: string,
  entity: string,
  config?: Partial<ChannelConfig>
): RealtimeChannel {
  const topic = orgTopic(orgId, entity);

  return supabase.channel(topic, {
    config: {
      private: true, // RLS必須
      ...config
    }
  });
}

/**
 * チャンネル購読前にRealtime認証を設定
 * JWTトークンをRealtimeサーバーに送信
 */
export async function ensureRealtimeAuth(supabase: SupabaseClient): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    await supabase.realtime.setAuth(session.access_token);
  }
}

/**
 * 組織スコープチャンネルの作成と認証を一括で行う
 */
export async function createAuthenticatedOrgChannel(
  supabase: SupabaseClient,
  orgId: string,
  entity: string,
  config?: Partial<ChannelConfig>
): Promise<RealtimeChannel> {
  await ensureRealtimeAuth(supabase);
  return channelForOrgEntity(supabase, orgId, entity, config);
}
