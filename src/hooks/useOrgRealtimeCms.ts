'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface CMSRealtimeData {
  sections: Record<string, any>[];
  settings: Record<string, any>[];
  assets: Record<string, any>[];
  lastUpdate: string;
}

interface UseOrgRealtimeCmsOptions {
  organizationId: string;
  autoConnect?: boolean;
  onUpdate?: (data: Partial<CMSRealtimeData>) => void;
  onError?: (error: Error) => void;
}

/**
 * Organization-specific CMS Realtime Hook
 * 
 * Supabase Assistantから提供されたRealtime統合フック
 * 組織レベルでのCMSデータのリアルタイム更新を管理
 */
export function useOrgRealtimeCms(options: UseOrgRealtimeCmsOptions) {
  const { organizationId, autoConnect = true, onUpdate, onError } = options;
  
  const [data, setData] = useState<CMSRealtimeData>({
    sections: [],
    settings: [],
    assets: [],
    lastUpdate: new Date().toISOString()
  });
  
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  // 初期データロード
  const loadInitialData = useCallback(async () => {
    if (!organizationId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // 並行して全てのCMSデータを取得
      const [sectionsRes, settingsRes, assetsRes] = await Promise.allSettled([
        fetch(`/api/admin/cms/sections?org=${organizationId}`),
        fetch(`/api/admin/cms/site-settings?org=${organizationId}`),
        fetch(`/api/admin/cms/assets?org=${organizationId}`)
      ]);

      const newData: Partial<CMSRealtimeData> = {
        lastUpdate: new Date().toISOString()
      };

      // Sections
      if (sectionsRes.status === 'fulfilled' && sectionsRes.value.ok) {
        const sectionsData = await sectionsRes.value.json();
        newData.sections = sectionsData.data || [];
      }

      // Settings
      if (settingsRes.status === 'fulfilled' && settingsRes.value.ok) {
        const settingsData = await settingsRes.value.json();
        newData.settings = settingsData.data || [];
      }

      // Assets
      if (assetsRes.status === 'fulfilled' && assetsRes.value.ok) {
        const assetsData = await assetsRes.value.json();
        newData.assets = assetsData.data || [];
      }

      setData(prev => ({ ...prev, ...newData }));
      onUpdate?.(newData);

    } catch (err) {
      const error = err instanceof Error ? err : new Error('データロードに失敗しました');
      setError(error.message);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, onUpdate, onError]);

  // Realtimeチャンネル接続
  const connect = useCallback(async () => {
    if (!organizationId || channel) return;

    const supabase = supabaseBrowser;

    try {
      // Realtime認証を設定
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        await supabase.realtime.setAuth(session.access_token);
      }

      // 組織専用チャンネルに接続（命名規約: org:{orgId}:{entity}）
      const newChannel = supabase
        .channel(`org:${organizationId}:cms`, { config: { private: true } })
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'cms_sections',
            filter: `organization_id=eq.${organizationId}`
          },
          (payload) => {
            // [CMS Realtime] Section change: payload
            
            setData(prev => {
              const newSections = [...prev.sections];
              
              if (payload.eventType === 'INSERT') {
                newSections.unshift(payload.new);
              } else if (payload.eventType === 'UPDATE') {
                const index = newSections.findIndex(s => s.id === payload.new.id);
                if (index >= 0) {
                  newSections[index] = payload.new;
                }
              } else if (payload.eventType === 'DELETE') {
                const index = newSections.findIndex(s => s.id === payload.old.id);
                if (index >= 0) {
                  newSections.splice(index, 1);
                }
              }
              
              const updated = {
                ...prev,
                sections: newSections,
                lastUpdate: new Date().toISOString()
              };
              
              onUpdate?.({ sections: newSections, lastUpdate: updated.lastUpdate });
              return updated;
            });
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'site_settings',
            filter: `organization_id=eq.${organizationId}`
          },
          (payload) => {
            // [CMS Realtime] Setting change: payload
            
            setData(prev => {
              const newSettings = [...prev.settings];
              
              if (payload.eventType === 'INSERT') {
                newSettings.unshift(payload.new);
              } else if (payload.eventType === 'UPDATE') {
                const index = newSettings.findIndex(s => s.id === payload.new.id);
                if (index >= 0) {
                  newSettings[index] = payload.new;
                }
              } else if (payload.eventType === 'DELETE') {
                const index = newSettings.findIndex(s => s.id === payload.old.id);
                if (index >= 0) {
                  newSettings.splice(index, 1);
                }
              }
              
              const updated = {
                ...prev,
                settings: newSettings,
                lastUpdate: new Date().toISOString()
              };
              
              onUpdate?.({ settings: newSettings, lastUpdate: updated.lastUpdate });
              return updated;
            });
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'cms_assets',
            filter: `organization_id=eq.${organizationId}`
          },
          (payload) => {
            // [CMS Realtime] Asset change: payload
            
            setData(prev => {
              const newAssets = [...prev.assets];
              
              if (payload.eventType === 'INSERT') {
                newAssets.unshift(payload.new);
              } else if (payload.eventType === 'UPDATE') {
                const index = newAssets.findIndex(a => a.id === payload.new.id);
                if (index >= 0) {
                  newAssets[index] = payload.new;
                }
              } else if (payload.eventType === 'DELETE') {
                const index = newAssets.findIndex(a => a.id === payload.old.id);
                if (index >= 0) {
                  newAssets.splice(index, 1);
                }
              }
              
              const updated = {
                ...prev,
                assets: newAssets,
                lastUpdate: new Date().toISOString()
              };
              
              onUpdate?.({ assets: newAssets, lastUpdate: updated.lastUpdate });
              return updated;
            });
          }
        );

      // チャンネル状態監視
      newChannel.subscribe((status) => {
        // [CMS Realtime] Status: status
        
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setError(null);
        } else if (status === 'CLOSED') {
          setIsConnected(false);
        } else if (status === 'CHANNEL_ERROR') {
          setIsConnected(false);
          const error = new Error('Realtimeチャンネルエラー');
          setError(error.message);
          onError?.(error);
        }
      });

      setChannel(newChannel);
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Realtime接続に失敗しました');
      setError(error.message);
      onError?.(error);
    }
  }, [organizationId, channel, onUpdate, onError]);

  // チャンネル切断
  const disconnect = useCallback(() => {
    if (channel) {
      channel.unsubscribe();
      setChannel(null);
      setIsConnected(false);
    }
  }, [channel]);

  // データ強制リフレッシュ
  const refresh = useCallback(async () => {
    await loadInitialData();
  }, [loadInitialData]);

  // 初期化とクリーンアップ
  useEffect(() => {
    if (organizationId && autoConnect) {
      loadInitialData().then(() => {
        connect();
      });
    }

    return () => {
      disconnect();
    };
  }, [organizationId, autoConnect, loadInitialData, connect, disconnect]);

  return {
    // データ
    sections: data.sections,
    settings: data.settings,
    assets: data.assets,
    lastUpdate: data.lastUpdate,
    
    // 状態
    isConnected,
    isLoading,
    error,
    
    // アクション
    connect,
    disconnect,
    refresh,
    
    // メタデータ
    organizationId,
    channelName: `org:${organizationId}:cms`
  };
}

// 便利なヘルパー関数
export function useCMSSectionByKey(
  sections: Record<string, any>[],
  pageKey: string,
  sectionKey: string
) {
  return sections.find(
    section => section.page_key === pageKey && section.section_key === sectionKey
  );
}

export function useCMSSettingByKey(
  settings: Record<string, any>[],
  key: string
) {
  const setting = settings.find(s => s.key === key);
  return setting?.value;
}