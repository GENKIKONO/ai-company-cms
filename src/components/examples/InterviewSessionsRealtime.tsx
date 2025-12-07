'use client';

import React, { useState, useEffect } from 'react';

import { 
  useOrgInterviewRealtime, 
  type AIInterviewSession 
} from '@/hooks/useOrgInterviewRealtime';
import { logger } from '@/lib/log';

/**
 * Interview Sessions リアルタイム監視の使用例コンポーネント
 * 
 * 使用パターン:
 * 1. P1-3 の requireOrgMember() で事前に組織権限確認済み
 * 2. SSR で初期データを取得 → props として渡す
 * 3. このクライアントコンポーネントでリアルタイム更新を追加監視
 * 
 * 前提:
 * - 親コンポーネント（SSRページ）で組織メンバーシップ確認済み
 * - realtime.messages RLS で組織外データはブロック済み
 * - ai_interview_sessions テーブルで broadcast_changes 設定済み
 */

interface Props {
  /** 組織ID（P1-3 requireOrgMember で確認済み） */
  organizationId: string;
  /** 初期セッション一覧（SSRで取得済み） */
  initialSessions: AIInterviewSession[];
  /** 組織名（表示用） */
  organizationName: string;
}

/**
 * セッションステータスの表示色を決定
 */
function getStatusColor(status: AIInterviewSession['status']): string {
  switch (status) {
    case 'completed':
      return 'text-green-600 bg-green-100';
    case 'in_progress':
      return 'text-blue-600 bg-blue-100';
    case 'pending':
      return 'text-yellow-600 bg-yellow-100';
    case 'failed':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

/**
 * セッション一覧をリアルタイム更新で表示
 */
export function InterviewSessionsRealtime({ 
  organizationId, 
  initialSessions, 
  organizationName 
}: Props) {
  // セッション一覧の状態管理（初期値はSSRから）
  const [sessions, setSessions] = useState<AIInterviewSession[]>(initialSessions);
  const [updateNotification, setUpdateNotification] = useState<string | null>(null);

  // リアルタイム監視開始
  const { 
    realtimeState, 
    eventStats, 
    reconnect, 
    isSubscribed, 
    lastUpdate, 
    error 
  } = useOrgInterviewRealtime(organizationId, {
    onError: (error) => {
      logger.error('Realtime subscription error', { error, organizationId });
    },
    onSubscribed: () => {
      logger.info('Successfully subscribed to interview sessions realtime', { organizationId });
    },
  });

  // カスタムイベント（ai-interview-session-update）をリスニング
  useEffect(() => {
    const handleSessionUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { 
        event: updateType, 
        orgId, 
        sessionId, 
        newData, 
        oldData 
      } = customEvent.detail;

      // 対象組織のイベントのみ処理
      if (orgId !== organizationId) {
        return;
      }

      logger.info('Processing session update from custom event', { 
        updateType, 
        sessionId, 
        orgId 
      });

      // セッション一覧を更新
      setSessions(prevSessions => {
        switch (updateType) {
          case 'INSERT':
            // 新規セッション追加
            if (newData && !prevSessions.find(s => s.id === newData.id)) {
              setUpdateNotification(`新しいセッションが作成されました: ${newData.id.slice(0, 8)}...`);
              return [...prevSessions, newData];
            }
            return prevSessions;

          case 'UPDATE':
            // 既存セッション更新
            if (newData) {
              setUpdateNotification(
                `セッション ${newData.id.slice(0, 8)}... のステータスが ${newData.status} に更新されました`
              );
              return prevSessions.map(session => 
                session.id === newData.id ? newData : session
              );
            }
            return prevSessions;

          case 'DELETE':
            // セッション削除
            if (oldData) {
              setUpdateNotification(`セッション ${oldData.id.slice(0, 8)}... が削除されました`);
              return prevSessions.filter(session => session.id !== oldData.id);
            }
            return prevSessions;

          default:
            return prevSessions;
        }
      });
    };

    // イベントリスナー登録
    window.addEventListener('ai-interview-session-update', handleSessionUpdate);

    // クリーンアップ
    return () => {
      window.removeEventListener('ai-interview-session-update', handleSessionUpdate);
    };
  }, [organizationId]);

  // 更新通知の自動消去
  useEffect(() => {
    if (updateNotification) {
      const timer = setTimeout(() => {
        setUpdateNotification(null);
      }, 5000); // 5秒後に消去

      return () => clearTimeout(timer);
    }
  }, [updateNotification]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* ヘッダー */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          AI Interview Sessions - {organizationName}
        </h1>
        
        {/* リアルタイム接続ステータス */}
        <div className="mt-2 flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div 
              className={`w-3 h-3 rounded-full ${
                isSubscribed ? 'bg-green-500' : 'bg-gray-400'
              }`}
            />
            <span className={isSubscribed ? 'text-green-700' : 'text-gray-600'}>
              {isSubscribed ? 'リアルタイム接続中' : '接続待機中'}
            </span>
          </div>
          
          {lastUpdate && (
            <div className="text-gray-500">
              最終更新: {lastUpdate.toLocaleTimeString()}
            </div>
          )}
        </div>

        {/* イベント統計（デバッグ用） */}
        <div className="mt-2 text-xs text-gray-400">
          受信イベント: 追加{eventStats.insertCount} / 更新{eventStats.updateCount} / 削除{eventStats.deleteCount}
        </div>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-red-800 font-medium">接続エラー</h3>
              <p className="text-red-600 text-sm mt-1">{error.message}</p>
            </div>
            <button
              onClick={reconnect}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
            >
              再接続
            </button>
          </div>
        </div>
      )}

      {/* 更新通知 */}
      {updateNotification && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-blue-800 text-sm">{updateNotification}</p>
        </div>
      )}

      {/* セッション一覧 */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            セッション一覧 ({sessions.length}件)
          </h2>
        </div>

        {sessions.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            セッションがまだありません
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {sessions.map((session) => (
              <div key={session.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-sm font-medium text-gray-900">
                        セッション ID: {session.id.slice(0, 16)}...
                      </h3>
                      <span 
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(session.status)}`}
                      >
                        {session.status}
                      </span>
                    </div>
                    
                    <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                      <span>作成: {new Date(session.created_at).toLocaleString()}</span>
                      <span>更新: {new Date(session.updated_at).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="ml-4">
                    <button className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                      詳細を見る
                    </button>
                  </div>
                </div>

                {/* 回答情報（存在する場合） */}
                {session.answers && Object.keys(session.answers).length > 0 && (
                  <div className="mt-2 text-sm text-gray-600">
                    回答済み項目: {Object.keys(session.answers).length}件
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* デバッグ情報（開発時のみ表示） */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-6 p-4 bg-gray-50 rounded-md">
          <h3 className="text-sm font-medium text-gray-700 mb-2">デバッグ情報</h3>
          <pre className="text-xs text-gray-600 whitespace-pre-wrap">
            {JSON.stringify({
              organizationId,
              sessionCount: sessions.length,
              realtimeState,
              eventStats,
            }, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

/**
 * SSRページでの使用例:
 * 
 * ```tsx
 * // app/dashboard/interview-sessions/page.tsx
 * import { requireOrgMember } from '@/lib/auth/server';
 * import { InterviewSessionsRealtime } from '@/components/examples/InterviewSessionsRealtime';
 * 
 * interface PageProps {
 *   searchParams: { orgId: string };
 * }
 * 
 * export default async function InterviewSessionsPage({ searchParams }: PageProps) {
 *   const { orgId } = searchParams;
 *   
 *   // P1-3 認証・認可チェック
 *   const { user, organization } = await requireOrgMember(orgId);
 *   
 *   // 初期データ取得（任意のAPI経由）
 *   const initialSessions = await fetchInterviewSessions(orgId);
 *   
 *   return (
 *     <InterviewSessionsRealtime
 *       organizationId={orgId}
 *       initialSessions={initialSessions}
 *       organizationName={organization.name}
 *     />
 *   );
 * }
 * ```
 */