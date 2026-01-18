'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { ROUTES } from '@/lib/routes';
import { DashboardPageShell } from '@/components/dashboard';

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
  return (
    <DashboardPageShell title="AI可視性" requiredRole="admin">
      <AiVisibilityContent />
    </DashboardPageShell>
  );
}

function AiVisibilityContent() {
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
            .select('id, organization_id, key, value, description, is_enabled, enabled, check_interval_hours, notification_threshold, updated_at, created_at')
            .order('updated_at', { ascending: false })
            .limit(100);
          if (error) throw error;
          setConfigs(data || []);
        } else {
          const { data, error } = await supabase
            .from('ai_bot_logs')
            .select('id, organization_id, url, request_path, bot_name, user_agent, accessed_at, response_status, status_code, created_at')
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
    if (score >= 80) return 'bg-[var(--aio-success-muted)] text-[var(--aio-success)]';
    if (score >= 60) return 'bg-[var(--aio-warning-muted)] text-[var(--aio-warning)]';
    if (score >= 40) return 'bg-[var(--aio-pending-muted)] text-[var(--aio-pending)]';
    return 'bg-[var(--aio-danger-muted)] text-[var(--aio-danger)]';
  };

  return (
    <div className="py-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            <li>
              <Link href={ROUTES.dashboard} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]">
                ダッシュボード
              </Link>
            </li>
            <li><span className="text-[var(--color-text-tertiary)]">/</span></li>
            <li>
              <Link href={ROUTES.dashboardManage} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]">
                管理
              </Link>
            </li>
            <li><span className="text-[var(--color-text-tertiary)]">/</span></li>
            <li className="text-[var(--color-text-primary)] font-medium">AI可視性</li>
          </ol>
        </nav>

        <div className="bg-white rounded-lg shadow-sm border border-[var(--dashboard-card-border)]">
          <div className="px-6 py-4 border-b border-[var(--dashboard-card-border)]">
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">AI可視性ダッシュボード</h1>
            <p className="text-sm text-[var(--color-text-tertiary)] mt-1">AIクローラーからの可視性スコアとボットアクセス状況</p>
          </div>

          {/* タブ */}
          <div className="border-b border-[var(--dashboard-card-border)]">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('scores')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'scores'
                    ? 'border-[var(--aio-primary)] text-[var(--aio-primary)]'
                    : 'border-transparent text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'
                }`}
              >
                可視性スコア
              </button>
              <button
                onClick={() => setActiveTab('config')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'config'
                    ? 'border-[var(--aio-primary)] text-[var(--aio-primary)]'
                    : 'border-transparent text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'
                }`}
              >
                設定
              </button>
              <button
                onClick={() => setActiveTab('bot_logs')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'bot_logs'
                    ? 'border-[var(--aio-primary)] text-[var(--aio-primary)]'
                    : 'border-transparent text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'
                }`}
              >
                ボットログ
              </button>
            </nav>
          </div>

          <div className="p-6" data-testid="ai-visibility-list">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-[var(--aio-primary)] border-t-transparent rounded-full mx-auto"></div>
                <p className="text-[var(--color-text-tertiary)] mt-4">読み込み中...</p>
              </div>
            ) : error ? (
              <div className="bg-[var(--aio-danger-muted)] border border-[var(--aio-danger)] rounded-md p-4">
                <p className="text-[var(--aio-danger)]">{error}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {activeTab === 'scores' && (
                  <table className="min-w-full divide-y divide-[var(--dashboard-card-border)]">
                    <thead className="bg-[var(--aio-surface)]">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase">計測日時</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase">組織</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase">ソース</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase">タイプ</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase">スコア</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-[var(--dashboard-card-border)]">
                      {scores.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-[var(--color-text-tertiary)]">
                            スコアデータがありません
                          </td>
                        </tr>
                      ) : (
                        scores.map((score) => (
                          <tr key={score.id}>
                            <td className="px-4 py-4 text-sm text-[var(--color-text-tertiary)]">
                              {new Date(score.measured_at).toLocaleString('ja-JP')}
                            </td>
                            <td className="px-4 py-4 text-sm text-[var(--color-text-primary)]">
                              {score.organizations?.name || score.organization_id.slice(0, 8)}
                            </td>
                            <td className="px-4 py-4 text-sm text-[var(--color-text-primary)]">
                              {score.source_key}
                            </td>
                            <td className="px-4 py-4 text-sm text-[var(--color-text-primary)]">
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
                  <table className="min-w-full divide-y divide-[var(--dashboard-card-border)]">
                    <thead className="bg-[var(--aio-surface)]">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase">組織ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase">有効</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase">チェック間隔</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase">通知閾値</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase">更新日時</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-[var(--dashboard-card-border)]">
                      {configs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-[var(--color-text-tertiary)]">
                            設定がありません
                          </td>
                        </tr>
                      ) : (
                        configs.map((config) => (
                          <tr key={config.id}>
                            <td className="px-4 py-4 text-sm text-[var(--color-text-tertiary)] font-mono">
                              {config.organization_id.slice(0, 8)}...
                            </td>
                            <td className="px-4 py-4">
                              <span className={`px-2 py-1 text-xs rounded-full ${config.enabled ? 'bg-[var(--aio-success-muted)] text-[var(--aio-success)]' : 'bg-[var(--aio-surface)] text-[var(--color-text-primary)]'}`}>
                                {config.enabled ? '有効' : '無効'}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm text-[var(--color-text-primary)]">
                              {config.check_interval_hours}時間
                            </td>
                            <td className="px-4 py-4 text-sm text-[var(--color-text-primary)]">
                              {config.notification_threshold}%
                            </td>
                            <td className="px-4 py-4 text-sm text-[var(--color-text-tertiary)]">
                              {new Date(config.updated_at).toLocaleString('ja-JP')}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}

                {activeTab === 'bot_logs' && (
                  <table className="min-w-full divide-y divide-[var(--dashboard-card-border)]">
                    <thead className="bg-[var(--aio-surface)]">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase">日時</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase">ボット名</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase">パス</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase">ステータス</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-[var(--dashboard-card-border)]">
                      {botLogs.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-[var(--color-text-tertiary)]">
                            ボットログがありません
                          </td>
                        </tr>
                      ) : (
                        botLogs.map((log) => (
                          <tr key={log.id}>
                            <td className="px-4 py-4 text-sm text-[var(--color-text-tertiary)]">
                              {new Date(log.created_at).toLocaleString('ja-JP')}
                            </td>
                            <td className="px-4 py-4 text-sm text-[var(--color-text-primary)]">
                              {log.bot_name}
                            </td>
                            <td className="px-4 py-4 text-sm text-[var(--color-text-primary)] max-w-xs truncate font-mono">
                              {log.request_path}
                            </td>
                            <td className="px-4 py-4">
                              <span className={`px-2 py-1 text-xs rounded-full ${log.status_code === 200 ? 'bg-[var(--aio-success-muted)] text-[var(--aio-success)]' : 'bg-[var(--aio-warning-muted)] text-[var(--aio-warning)]'}`}>
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
