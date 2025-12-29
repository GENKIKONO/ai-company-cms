'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { DashboardPageShell } from '@/components/dashboard';

// フェッチヘルパー（レスポンス規約対応）
async function fetchAdminApi<T>(url: string): Promise<{ success: boolean; data?: T; error?: string }> {
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok || !json.success) {
    return { success: false, error: json.message || 'API error' };
  }
  return { success: true, data: json.data };
}

interface IntrusionAlert {
  id: string;
  rule_id: string;
  source_ip: string;
  severity: string;
  description: string;
  detected_at: string;
  resolved_at: string | null;
  status: string;
}

interface IpReport {
  id: string;
  ip_address: string;
  reason: string;
  reporter_id: string;
  status: string;
  created_at: string;
}

interface BlockedIp {
  id: string;
  ip_address: string;
  reason: string;
  blocked_at: string;
  expires_at: string | null;
  is_active: boolean;
}

interface ScanHistory {
  id: string;
  action: string;
  actor_id: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

interface ScanSummary {
  lastScanAt: string | null;
  openAlerts: number;
  totalAlerts: number;
}

type TabType = 'overview' | 'alerts' | 'reports' | 'blocklist';

export default function SecurityDashboardPage() {
  return (
    <DashboardPageShell title="セキュリティ" requiredRole="admin">
      <SecurityDashboardContent />
    </DashboardPageShell>
  );
}

function SecurityDashboardContent() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [alerts, setAlerts] = useState<IntrusionAlert[]>([]);
  const [reports, setReports] = useState<IpReport[]>([]);
  const [blocklist, setBlocklist] = useState<BlockedIp[]>([]);
  const [scanHistory, setScanHistory] = useState<ScanHistory[]>([]);
  const [scanSummary, setScanSummary] = useState<ScanSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // スキャン履歴とサマリーを取得
  const fetchScanData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/security/history');
      const data = await res.json();
      if (res.ok && data.success) {
        setScanHistory(data.data?.history || []);
        setScanSummary(data.data?.summary || null);
      }
    } catch {
      // エラーは無視
    }
  }, []);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const supabase = createClient();

        if (activeTab === 'overview') {
          await fetchScanData();
        } else if (activeTab === 'alerts') {
          // API経由でアラートを取得（admin guard付き）
          const result = await fetchAdminApi<IntrusionAlert[]>('/api/admin/security/alerts?limit=100');
          if (!result.success) throw new Error(result.error);
          setAlerts(result.data || []);
        } else if (activeTab === 'reports') {
          const { data, error } = await supabase
            .from('ip_reports')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);
          if (error) throw error;
          setReports(data || []);
        } else {
          const { data, error } = await supabase
            .from('ip_blocklist')
            .select('*')
            .order('blocked_at', { ascending: false })
            .limit(100);
          if (error) throw error;
          setBlocklist(data || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'データ取得エラー');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [activeTab, fetchScanData]);

  const handleManualScan = async () => {
    setScanning(true);
    setToast(null);
    try {
      const res = await fetch('/api/admin/security/scan', { method: 'POST' });
      const data = await res.json();

      if (res.ok && data.success) {
        setToast({
          type: 'success',
          message: `スキャン完了: ${data.data?.alertsDetected ?? 0} 件検出 (${data.data?.duration_ms}ms)`,
        });
        // 履歴を再取得
        await fetchScanData();
      } else {
        throw new Error(data.message || 'スキャン失敗');
      }
    } catch (err) {
      setToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'スキャン実行エラー',
      });
    } finally {
      setScanning(false);
    }
  };

  // トーストを3秒後に自動消去
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const getSeverityBadge = (severity: string) => {
    const styles: Record<string, string> = {
      critical: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-[var(--aio-muted)] text-[var(--aio-primary)]',
    };
    return styles[severity?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      open: 'bg-red-100 text-red-800',
      investigating: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-gray-100 text-gray-800',
    };
    return styles[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* トースト通知 */}
        {toast && (
          <div
            className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg ${
              toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
            }`}
          >
            {toast.message}
          </div>
        )}

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
            <li className="text-gray-900 font-medium">セキュリティ</li>
          </ol>
        </nav>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">セキュリティダッシュボード</h1>
              <p className="text-sm text-gray-500 mt-1">侵入検知・IP管理・通報管理</p>
            </div>
            <button
              onClick={handleManualScan}
              disabled={scanning}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {scanning ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  スキャン中...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  手動スキャン
                </>
              )}
            </button>
          </div>

          {/* タブ */}
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'overview'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                概要
              </button>
              <button
                onClick={() => setActiveTab('alerts')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'alerts'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                侵入検知アラート
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'reports'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                IP通報
              </button>
              <button
                onClick={() => setActiveTab('blocklist')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'blocklist'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                ブロックリスト
              </button>
            </nav>
          </div>

          <div className="p-6" data-testid="security-list">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-red-500 border-t-transparent rounded-full mx-auto"></div>
                <p className="text-gray-500 mt-4">読み込み中...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-700">{error}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {/* 概要タブ */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* サマリーカード */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="text-sm font-medium text-gray-500">最終スキャン</div>
                        <div className="mt-1 text-xl font-semibold text-gray-900">
                          {formatDate(scanSummary?.lastScanAt ?? null)}
                        </div>
                      </div>
                      <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                        <div className="text-sm font-medium text-red-600">未解決アラート</div>
                        <div className="mt-1 text-3xl font-bold text-red-700">
                          {scanSummary?.openAlerts ?? 0}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="text-sm font-medium text-gray-500">総アラート数</div>
                        <div className="mt-1 text-xl font-semibold text-gray-900">
                          {scanSummary?.totalAlerts ?? 0}
                        </div>
                      </div>
                    </div>

                    {/* スキャン履歴テーブル */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">スキャン履歴</h3>
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">実行日時</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">タイプ</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">検出数</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">実行時間</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {scanHistory.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                                スキャン履歴がありません
                              </td>
                            </tr>
                          ) : (
                            scanHistory.map((scan) => {
                              const details = scan.details as Record<string, unknown> | null;
                              const result = details?.result as Record<string, unknown> | null;
                              return (
                                <tr key={scan.id}>
                                  <td className="px-4 py-4 text-sm text-gray-500">
                                    {formatDate(scan.created_at)}
                                  </td>
                                  <td className="px-4 py-4">
                                    <span
                                      className={`px-2 py-1 text-xs rounded-full ${
                                        scan.action === 'security_scan_manual'
                                          ? 'bg-purple-100 text-purple-800'
                                          : 'bg-[var(--aio-muted)] text-[var(--aio-primary)]'
                                      }`}
                                    >
                                      {scan.action === 'security_scan_manual' ? '手動' : '自動'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-4 text-sm text-gray-900">
                                    {String(result?.alertsDetected ?? result?.alerts_count ?? '-')}
                                  </td>
                                  <td className="px-4 py-4 text-sm text-gray-500">
                                    {details?.duration ? `${details.duration}ms` : result?.duration ? `${result.duration}ms` : '-'}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === 'alerts' && (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">検知日時</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">重大度</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">送信元IP</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">説明</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状態</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {alerts.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                            アラートがありません
                          </td>
                        </tr>
                      ) : (
                        alerts.map((alert) => (
                          <tr key={alert.id}>
                            <td className="px-4 py-4 text-sm text-gray-500">
                              {formatDate(alert.detected_at)}
                            </td>
                            <td className="px-4 py-4">
                              <span className={`px-2 py-1 text-xs rounded-full ${getSeverityBadge(alert.severity)}`}>
                                {alert.severity}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm font-mono text-gray-900">
                              {alert.source_ip}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900 max-w-xs truncate">
                              {alert.description}
                            </td>
                            <td className="px-4 py-4">
                              <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(alert.status)}`}>
                                {alert.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}

                {activeTab === 'reports' && (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">通報日時</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">理由</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状態</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reports.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                            通報がありません
                          </td>
                        </tr>
                      ) : (
                        reports.map((report) => (
                          <tr key={report.id}>
                            <td className="px-4 py-4 text-sm text-gray-500">
                              {formatDate(report.created_at)}
                            </td>
                            <td className="px-4 py-4 text-sm font-mono text-gray-900">
                              {report.ip_address}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900">
                              {report.reason}
                            </td>
                            <td className="px-4 py-4">
                              <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(report.status)}`}>
                                {report.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}

                {activeTab === 'blocklist' && (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ブロック日時</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">理由</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">有効期限</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状態</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {blocklist.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                            ブロックリストが空です
                          </td>
                        </tr>
                      ) : (
                        blocklist.map((blocked) => (
                          <tr key={blocked.id}>
                            <td className="px-4 py-4 text-sm text-gray-500">
                              {formatDate(blocked.blocked_at)}
                            </td>
                            <td className="px-4 py-4 text-sm font-mono text-gray-900">
                              {blocked.ip_address}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900">
                              {blocked.reason}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-500">
                              {blocked.expires_at ? formatDate(blocked.expires_at) : '永続'}
                            </td>
                            <td className="px-4 py-4">
                              <span className={`px-2 py-1 text-xs rounded-full ${blocked.is_active ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                                {blocked.is_active ? '有効' : '無効'}
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
