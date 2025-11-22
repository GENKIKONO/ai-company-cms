'use client';

import { useState, useEffect, useRef } from 'react';
import { supabaseBrowser } from '@/lib/supabase-browser';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface RealtimeEvent {
  timestamp: string;
  table: string;
  eventType: string;
  payload: any;
  status: 'success' | 'error';
}

export default function RealtimeTestPage() {
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const [connectionLog, setConnectionLog] = useState<string[]>([]);
  const [testStatus, setTestStatus] = useState<{
    posts: boolean;
    qa_entries: boolean;
    cms_sections: boolean;
    site_settings: boolean;
  }>({
    posts: false,
    qa_entries: false,
    cms_sections: false,
    site_settings: false
  });

  const channelRef = useRef<RealtimeChannel | null>(null);

  // ログ追加ヘルパー
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setConnectionLog(prev => [...prev, `[${timestamp}] ${message}`]);
    // [Realtime Test] ${message}
  };

  // イベント追加ヘルパー
  const addEvent = (table: string, eventType: string, payload: any, status: 'success' | 'error' = 'success') => {
    const event: RealtimeEvent = {
      timestamp: new Date().toLocaleTimeString(),
      table,
      eventType,
      payload,
      status
    };
    setEvents(prev => [event, ...prev.slice(0, 49)]); // 最新50件まで保持
    
    setTestStatus(prev => ({
      ...prev,
      [table]: true
    }));
  };

  // 組織ID取得
  useEffect(() => {
    const getOrganizationId = async () => {
      try {
        const supabase = supabaseBrowser();
        addLog('認証ユーザー情報を取得中...');
        
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          addLog(`❌ 認証エラー: ${authError?.message || 'ユーザーが見つかりません'}`);
          return;
        }
        
        addLog(`✅ ユーザー認証成功: ${user.email}`);
        addLog('組織情報を取得中...');

        const { data: userOrg, error: orgError } = await supabase
          .from('user_organizations')
          .select('organization_id, organizations(name)')
          .eq('user_id', user.id)
          .eq('role', 'owner')
          .single();

        if (orgError || !userOrg) {
          addLog(`❌ 組織取得エラー: ${orgError?.message || '組織が見つかりません'}`);
          return;
        }

        const orgId = userOrg.organization_id;
        const orgName = (userOrg as any).organizations?.name || 'Unknown';
        
        setOrganizationId(orgId);
        addLog(`✅ 組織ID取得成功: ${orgId}`);
        addLog(`   組織名: ${orgName}`);

      } catch (error) {
        addLog(`❌ 予期しないエラー: ${error instanceof Error ? error.message : String(error)}`);
      }
    };

    getOrganizationId();
  }, []);

  // Realtime接続開始
  const startRealtimeTest = async () => {
    if (!organizationId) {
      addLog('❌ 組織IDが取得できていません');
      return;
    }

    try {
      const supabase = supabaseBrowser();
      addLog('🔄 Realtimeチャンネルを開始中...');

      // 既存チャンネルがあれば切断
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }

      // 新しいチャンネル作成
      const channel = supabase
        .channel(`test_realtime:${organizationId}`)
        
        // Posts テーブル監視
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'posts',
            filter: `organization_id=eq.${organizationId}`
          },
          (payload) => {
            addLog(`📄 Posts変更検知: ${payload.eventType}`);
            addEvent('posts', payload.eventType, payload);
          }
        )
        
        // QA Entries テーブル監視
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public', 
            table: 'qa_entries',
            filter: `organization_id=eq.${organizationId}`
          },
          (payload) => {
            addLog(`❓ QA Entries変更検知: ${payload.eventType}`);
            addEvent('qa_entries', payload.eventType, payload);
          }
        )
        
        // CMS Sections テーブル監視
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'cms_sections',
            filter: `organization_id=eq.${organizationId}`
          },
          (payload) => {
            addLog(`🎨 CMS Sections変更検知: ${payload.eventType}`);
            addEvent('cms_sections', payload.eventType, payload);
          }
        )
        
        // Site Settings テーブル監視
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'site_settings',
            filter: `organization_id=eq.${organizationId}`
          },
          (payload) => {
            addLog(`⚙️ Site Settings変更検知: ${payload.eventType}`);
            addEvent('site_settings', payload.eventType, payload);
          }
        );

      // チャンネル購読
      channel.subscribe((status) => {
        addLog(`📡 チャンネルステータス: ${status}`);
        
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          addLog('✅ Realtime接続が確立されました');
        } else if (status === 'CLOSED') {
          setIsConnected(false);
          addLog('❌ Realtime接続が切断されました');
        } else if (status === 'CHANNEL_ERROR') {
          setIsConnected(false);
          addLog('❌ チャンネルエラーが発生しました');
        } else if (status === 'TIMED_OUT') {
          setIsConnected(false);
          addLog('⏱️ 接続がタイムアウトしました');
        }
      });

      channelRef.current = channel;
      addLog('🚀 Realtimeチャンネル購読を開始しました');

    } catch (error) {
      addLog(`❌ Realtime接続エラー: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Realtime接続停止
  const stopRealtimeTest = () => {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
      setIsConnected(false);
      addLog('🔴 Realtime接続を停止しました');
    }
  };

  // テストデータ挿入
  const insertTestData = async (table: 'posts' | 'qa_entries') => {
    if (!organizationId) return;

    try {
      const supabase = supabaseBrowser();
      addLog(`📝 ${table}にテストデータを挿入中...`);

      if (table === 'posts') {
        const { error } = await supabase
          .from('posts')
          .insert({
            organization_id: organizationId,
            title: `Test Post ${Date.now()}`,
            content: 'This is a test post for Realtime testing',
            type: 'news',
            status: 'draft',
            author_id: (await supabase.auth.getUser()).data.user?.id
          });

        if (error) {
          addLog(`❌ Posts挿入エラー: ${error.message}`);
        } else {
          addLog(`✅ Posts挿入成功`);
        }

      } else if (table === 'qa_entries') {
        const { error } = await supabase
          .from('qa_entries')
          .insert({
            organization_id: organizationId,
            question: `Test Question ${Date.now()}?`,
            answer: 'This is a test answer for Realtime testing',
            category: 'general',
            is_published: false,
            created_by: (await supabase.auth.getUser()).data.user?.id
          });

        if (error) {
          addLog(`❌ QA Entries挿入エラー: ${error.message}`);
        } else {
          addLog(`✅ QA Entries挿入成功`);
        }
      }

    } catch (error) {
      addLog(`❌ データ挿入エラー: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, []);

  return (
    <div className="container mx-auto px-6 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Realtime接続テスト
        </h1>
        <p className="text-gray-600">
          Supabase Realtimeの接続とイベント受信をテストします
        </p>
      </div>

      {/* 状態表示 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-semibold mb-2">接続状態</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${organizationId ? 'bg-green-500' : 'bg-red-500'}`} />
              <span>組織ID: {organizationId || '取得中...'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span>Realtime接続: {isConnected ? '接続中' : '切断'}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-semibold mb-2">テーブル監視状態</h3>
          <div className="space-y-1">
            {Object.entries(testStatus).map(([table, received]) => (
              <div key={table} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${received ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className="text-sm">{table}: {received ? '受信済み' : '待機中'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 操作ボタン */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={startRealtimeTest}
          disabled={!organizationId}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
        >
          Realtime接続開始
        </button>
        
        <button
          onClick={stopRealtimeTest}
          disabled={!isConnected}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-300"
        >
          接続停止
        </button>
        
        <button
          onClick={() => insertTestData('posts')}
          disabled={!isConnected}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300"
        >
          Posts テストデータ挿入
        </button>
        
        <button
          onClick={() => insertTestData('qa_entries')}
          disabled={!isConnected}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:bg-gray-300"
        >
          QA テストデータ挿入
        </button>
      </div>

      {/* ログ表示 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-black text-green-400 p-4 rounded-lg font-mono">
          <h3 className="text-white font-bold mb-2">接続ログ</h3>
          <div className="h-64 overflow-y-auto space-y-1">
            {connectionLog.map((log, index) => (
              <div key={index} className="text-sm">
                {log}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-bold mb-2">Realtimeイベント</h3>
          <div className="h-64 overflow-y-auto space-y-2">
            {events.map((event, index) => (
              <div key={index} className="p-2 bg-white rounded border text-sm">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold">{event.table}</span>
                  <span className="text-gray-500">{event.timestamp}</span>
                </div>
                <div className="text-blue-600">{event.eventType}</div>
                <pre className="text-xs text-gray-600 mt-1 overflow-hidden">
                  {JSON.stringify(event.payload, null, 2).substring(0, 200)}...
                </pre>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}