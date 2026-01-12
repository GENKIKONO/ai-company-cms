'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HIGButton } from '@/design-system';
import { logger } from '@/lib/utils/logger';
import { supabaseBrowser } from '@/lib/supabase/client';
import { getCurrentUserClient } from '@/lib/core/auth-state.client';

interface MonitorData {
  timestamp: string;
  responseTime: number;
  status: 'healthy' | 'degraded' | 'down' | 'error';
  checks: {
    supabase: CheckResult;
    stripe: CheckResult;
    resend: CheckResult;
    system: CheckResult;
  };
}

interface CheckResult {
  healthy: boolean;
  status: string;
  message: string;
}

export default function MonitorClient() {
  const router = useRouter();
  const [data, setData] = useState<MonitorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [organizationId, setOrganizationId] = useState<string>('');

  // 組織IDを取得
  useEffect(() => {
    const getOrganizationId = async () => {
      try {
        const supabase = supabaseBrowser;
        const user = await getCurrentUserClient();

        if (user) {
          const { data: userOrg } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .eq('role', 'owner')
            .single();

          if (userOrg) {
            setOrganizationId(userOrg.organization_id);
          } else {
            // 組織が見つからない場合はpricingページにリダイレクト
            router.push('/pricing?feature=monitor');
          }
        } else {
          // 認証されていない場合はログインページにリダイレクト
          router.push('/auth/login');
        }
      } catch (error) {
        logger.error('Failed to get organization ID:', { data: error });
        router.push('/pricing?feature=monitor');
      }
    };

    getOrganizationId();
  }, [router]);

  // システム監視機能のアクセス制御チェック（API経由で安全にeffective-features使用）
  useEffect(() => {
    if (!organizationId) return;

    const checkFeatureAccess = async () => {
      try {
        const response = await fetch('/api/my/features/system-monitoring', {
          cache: 'no-store'
        });

        if (response.ok) {
          const { hasAccess, reason } = await response.json();
          if (!hasAccess) {
            logger.debug('System monitoring access denied', { reason, organizationId });
            router.push('/pricing?feature=monitor');
            return;
          }
        } else {
          // API呼び出し失敗時もアクセス拒否
          logger.debug('System monitoring API check failed', {
            status: response.status,
            organizationId
          });
          router.push('/pricing?feature=monitor');
        }
      } catch (error) {
        logger.error('Feature access check error', { data: error instanceof Error ? error : new Error(String(error)) });
        router.push('/pricing?feature=monitor');
      }
    };

    checkFeatureAccess();
  }, [organizationId, router]);

  const fetchMonitorData = async () => {
    try {
      const response = await fetch('/api/monitor');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const result = await response.json();
      setData(result);
      setLastUpdate(new Date().toLocaleTimeString());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitorData();
    const interval = setInterval(fetchMonitorData, 30000); // 30秒ごとに更新
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-[var(--aio-success)] bg-[var(--aio-success-muted)] border-[var(--status-success)]';
      case 'degraded': return 'text-[var(--aio-warning)] bg-[var(--aio-warning-muted)] border-[var(--status-warning)]';
      case 'down': return 'text-[var(--aio-danger)] bg-[var(--aio-danger-muted)] border-[var(--status-error)]';
      case 'error': return 'text-[var(--aio-purple)] bg-[var(--aio-purple-muted)] border-[var(--aio-purple)]';
      default: return 'text-[var(--color-text-secondary)] bg-[var(--aio-surface)] border-[var(--dashboard-card-border)]';
    }
  };

  const getStatusIcon = (healthy: boolean) => {
    return healthy ? (
      <svg className="w-5 h-5 text-[var(--aio-success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ) : (
      <svg className="w-5 h-5 text-[var(--aio-danger)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--aio-surface)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--aio-primary)] mx-auto mb-4"></div>
          <p className="text-[var(--color-text-secondary)]">監視データを読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--aio-surface)] py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[var(--color-text-primary)] flex items-center">
                <svg className="w-8 h-8 mr-3 text-[var(--aio-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Production Monitor
              </h1>
              <p className="text-[var(--color-text-secondary)] mt-2">AIoHub システム監視ダッシュボード</p>
            </div>
            <div className="text-right">
              <HIGButton
                onClick={fetchMonitorData}
                variant="primary"
                size="md"
              >
                更新
              </HIGButton>
              {lastUpdate && (
                <p className="text-sm text-[var(--color-text-tertiary)] mt-1">最終更新: {lastUpdate}</p>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-[var(--aio-danger-muted)] border border-[var(--status-error)] rounded-md">
            <p className="text-[var(--aio-danger)] flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              エラー: {error}
            </p>
          </div>
        )}

        {data && (
          <>
            {/* Overall Status */}
            <div className={`mb-6 p-6 rounded-lg border-2 ${getStatusColor(data.status)}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">
                    システム全体: {data.status.toUpperCase()}
                  </h2>
                  <p className="text-sm opacity-75 mt-1">
                    応答時間: {data.responseTime}ms |
                    生成時刻: {new Date(data.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="text-4xl">
                  {data.status === 'healthy' ? (
                    <svg className="w-8 h-8 text-[var(--aio-success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : data.status === 'degraded' ? (
                    <svg className="w-8 h-8 text-[var(--aio-warning)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  ) : data.status === 'down' ? (
                    <svg className="w-8 h-8 text-[var(--aio-danger)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="w-8 h-8 text-[var(--aio-purple)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
              </div>
            </div>

            {/* Service Status Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {Object.entries(data.checks).map(([service, check]) => (
                <div
                  key={service}
                  className={`p-6 rounded-lg border-2 transition-all hover:shadow-md ${
                    check.healthy
                      ? 'bg-[var(--aio-success-muted)] border-[var(--status-success)]'
                      : 'bg-[var(--aio-danger-muted)] border-[var(--status-error)]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-[var(--color-text-primary)] capitalize">
                      {service === 'supabase' ? 'Database' :
                       service === 'stripe' ? 'Payments' :
                       service === 'resend' ? 'Email' :
                       service === 'system' ? 'System' : service}
                    </h3>
                    <span className="text-2xl">{getStatusIcon(check.healthy)}</span>
                  </div>
                  <p className={`text-sm ${check.healthy ? 'text-[var(--aio-success)]' : 'text-[var(--aio-danger)]'}`}>
                    ステータス: {check.status}
                  </p>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1">{check.message}</p>
                </div>
              ))}
            </div>

            {/* Quick Links */}
            <div className="bg-[var(--dashboard-card-bg)] rounded-lg shadow-sm border border-[var(--dashboard-card-border)] p-6">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-[var(--color-icon)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                クイックアクセス
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <a
                  href="https://aiohub.jp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 border border-[var(--dashboard-card-border)] rounded-md hover:bg-[var(--aio-surface)] transition-colors"
                >
                  <div className="font-medium flex items-center text-[var(--color-text-primary)]">
                    <svg className="w-4 h-4 mr-2 text-[var(--color-icon-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    メインサイト
                  </div>
                  <div className="text-sm text-[var(--color-text-secondary)]">aiohub.jp</div>
                </a>
                <a
                  href="/api/health"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 border border-[var(--dashboard-card-border)] rounded-md hover:bg-[var(--aio-surface)] transition-colors"
                >
                  <div className="font-medium flex items-center text-[var(--color-text-primary)]">
                    <svg className="w-4 h-4 mr-2 text-[var(--color-icon-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    ヘルスAPI
                  </div>
                  <div className="text-sm text-[var(--color-text-secondary)]">/api/health</div>
                </a>
                <a
                  href="/api/monitor?format=markdown"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 border border-[var(--dashboard-card-border)] rounded-md hover:bg-[var(--aio-surface)] transition-colors"
                >
                  <div className="font-medium flex items-center text-[var(--color-text-primary)]">
                    <svg className="w-4 h-4 mr-2 text-[var(--color-icon-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    レポート
                  </div>
                  <div className="text-sm text-[var(--color-text-secondary)]">Markdown形式</div>
                </a>
              </div>
            </div>

            {/* Technical Details */}
            <div className="mt-6 bg-[var(--dashboard-card-bg)] rounded-lg shadow-sm border border-[var(--dashboard-card-border)] p-6">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-[var(--color-icon)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                技術詳細
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="font-medium text-[var(--color-text-secondary)]">データベース</div>
                  <div className="text-[var(--color-text-tertiary)]">Supabase PostgreSQL</div>
                </div>
                <div>
                  <div className="font-medium text-[var(--color-text-secondary)]">決済システム</div>
                  <div className="text-[var(--color-text-tertiary)]">Stripe API</div>
                </div>
                <div>
                  <div className="font-medium text-[var(--color-text-secondary)]">メール配信</div>
                  <div className="text-[var(--color-text-tertiary)]">Resend API</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
