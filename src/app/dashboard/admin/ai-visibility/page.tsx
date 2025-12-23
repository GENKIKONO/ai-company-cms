'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface VisibilityScore {
  id: string;
  organization_id: string;
  source_key: string;
  score: number;
  visibility_type: string;
  measured_at: string;
  organizations?: {
    name: string;
    slug: string;
  };
}

interface VisibilityConfig {
  id: string;
  organization_id: string;
  enabled: boolean;
  check_interval_hours: number;
  notification_threshold: number;
  updated_at: string;
}

interface BotLog {
  id: string;
  bot_name: string;
  user_agent: string;
  request_path: string;
  status_code: number;
  created_at: string;
}

type TabType = 'scores' | 'config' | 'bot_logs';

export default function AiVisibilityPage() {
  const [activeTab, setActiveTab] = useState<TabType>('scores');
  const [scores, setScores] = useState<VisibilityScore[]>([]);
  const [configs, setConfigs] = useState<VisibilityConfig[]>([]);
  const [botLogs, setBotLogs] = useState<BotLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const supabase = createClient();

        if (activeTab === 'scores') {
          const { data, error } = await supabase
            .from('ai_visibility_scores')
            .select(`
              *,
              organizations(name, slug)
            `)
            .order('measured_at', { ascending: false })
            .limit(100);
          if (error) throw error;
          setScores(data || []);
        } else if (activeTab === 'config') {
          const { data, error } = await supabase
            .from('ai_visibility_config')
            .select('*')
            .order('updated_at', { ascending: false })
            .limit(100);
          if (error) throw error;
          setConfigs(data || []);
        } else {
          const { data, error } = await supabase
            .from('ai_bot_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(200);
          if (error) throw error;
          setBotLogs(data || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'データ取得エラー');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [activeTab]);

  const getScoreBadge = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    if (score >= 40) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="py-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            <li>
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                ダッシュボード
              </Link>
            </li>
            <li><span className="text-gray-500">/</span></li>
            <li>
              <Link href="/dashboard/admin" className="text-gray-500 hover:text-gray-700">
                管理
              </Link>
            </li>
            <li><span className="text-gray-500">/</span></li>
            <li className="text-gray-900 font-medium">AI可視性</li>
          </ol>
        </nav>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">AI可視性ダッシュボード</h1>
            <p className="text-sm text-gray-500 mt-1">AIクローラーからの可視性スコアとボットアクセス状況</p>
          </div>

          {/* タブ */}
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('scores')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'scores'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                可視性スコア
              </button>
              <button
                onClick={() => setActiveTab('config')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'config'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                設定
              </button>
              <button
                onClick={() => setActiveTab('bot_logs')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'bot_logs'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                ボットログ
              </button>
            </nav>
          </div>

          <div className="p-6" data-testid="ai-visibility-list">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                <p className="text-gray-500 mt-4">読み込み中...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-700">{error}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {activeTab === 'scores' && (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">計測日時</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">組織</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ソース</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">タイプ</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">スコア</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {scores.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                            スコアデータがありません
                          </td>
                        </tr>
                      ) : (
                        scores.map((score) => (
                          <tr key={score.id}>
                            <td className="px-4 py-4 text-sm text-gray-500">
                              {new Date(score.measured_at).toLocaleString('ja-JP')}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900">
                              {score.organizations?.name || score.organization_id.slice(0, 8)}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900">
                              {score.source_key}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900">
                              {score.visibility_type}
                            </td>
                            <td className="px-4 py-4">
                              <span className={`px-2 py-1 text-xs rounded-full font-medium ${getScoreBadge(score.score)}`}>
                                {score.score}%
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}

                {activeTab === 'config' && (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">組織ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">有効</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">チェック間隔</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">通知閾値</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">更新日時</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {configs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                            設定がありません
                          </td>
                        </tr>
                      ) : (
                        configs.map((config) => (
                          <tr key={config.id}>
                            <td className="px-4 py-4 text-sm text-gray-500 font-mono">
                              {config.organization_id.slice(0, 8)}...
                            </td>
                            <td className="px-4 py-4">
                              <span className={`px-2 py-1 text-xs rounded-full ${config.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {config.enabled ? '有効' : '無効'}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900">
                              {config.check_interval_hours}時間
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900">
                              {config.notification_threshold}%
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-500">
                              {new Date(config.updated_at).toLocaleString('ja-JP')}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}

                {activeTab === 'bot_logs' && (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">日時</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ボット名</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">パス</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ステータス</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {botLogs.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                            ボットログがありません
                          </td>
                        </tr>
                      ) : (
                        botLogs.map((log) => (
                          <tr key={log.id}>
                            <td className="px-4 py-4 text-sm text-gray-500">
                              {new Date(log.created_at).toLocaleString('ja-JP')}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900">
                              {log.bot_name}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900 max-w-xs truncate font-mono">
                              {log.request_path}
                            </td>
                            <td className="px-4 py-4">
                              <span className={`px-2 py-1 text-xs rounded-full ${log.status_code === 200 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                {log.status_code}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
