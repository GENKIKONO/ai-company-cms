/**
 * AIOHub P3-1: Super Admin Console - Main Dashboard (VIEW準拠版)
 * 
 * VIEWベースのデータ取得：
 * - admin_alerts_latest_v1
 * - admin_jobs_recent_v1
 * - admin_summary_today_v1
 */

import { Metadata } from 'next';
import { requireSuperAdminUser } from '@/lib/auth/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import AlertsPanel from './AlertsPanel';
import JobsPanel from './JobsPanel';
import SystemHealthPanel from './SystemHealthPanel';
import SummaryCards from './SummaryCards';
import SlowQueriesPanel from './SlowQueriesPanel';
import SchemaDiffPanel from './SchemaDiffPanel';
import ContentRefreshKpiCards from './ContentRefreshKpiCards';
import { getAllKpiMetrics } from '@/lib/supabase/admin-rpc';
import type { 
  AdminConsoleData,
  AdminAlertEvent,
  AdminJobRun,
  AdminConsoleSummary,
  AdminSummaryRaw,
  SlowQueryStat
} from '@/types/admin-console';
import { mapSummaryRowToSummary } from '@/types/admin-console';

export const metadata: Metadata = {
  title: 'Super Admin Console - AIOHub',
  description: 'System monitoring and administration dashboard',
};

export default async function AdminConsolePage() {
  try {
    // Super Admin 認証
    await requireSuperAdminUser();

    // VIEWベースのデータ取得とP4-8 KPI取得を並列実行
    const [consoleData, kpiMetrics] = await Promise.allSettled([
      fetchConsoleDataFromViews(),
      getAllKpiMetrics()
    ]);

    // データ取得結果の処理
    const finalConsoleData = consoleData.status === 'fulfilled' ? consoleData.value : {
      health: { 
        database: {
          status: 'critical' as const,
          responseTime: 0,
          activeConnections: 0,
          details: 'Database health check failed'
        },
        supabase: {
          status: 'critical' as const,
          apiResponseTime: 0,
          storageStatus: 'critical' as const,
          details: 'Supabase health check failed'
        },
        external_services: {
          status: 'critical' as const,
          services: []
        },
        overall: 'critical' as const, 
        lastChecked: new Date().toISOString() 
      },
      stats: { alerts: { total: 0, byType: {}, bySeverity: {}, recent24h: 0 }, jobs: { total: 0, byType: {}, byStatus: { success: 0, error: 0 }, recent24h: 0, failureRate: 0 }, performance: { avgResponseTime: 0, errorRate: 1, uptime: 0 } },
      summary: { todayAlerts: 0, criticalAlertsToday: 0, failedJobsLast24h: 0, slowQueriesCount: 0 },
      recentAlerts: [],
      recentJobs: [],
      slowQueries: []
    };

    const finalKpiMetrics = kpiMetrics.status === 'fulfilled' ? kpiMetrics.value : {
      rlsDenies: [],
      edgeFailures: [],
      publicFreshness: [],
      errors: [{ message: 'Failed to fetch KPI metrics' }]
    };

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Super Admin Console</h1>
            <p className="text-gray-600 mt-2">System monitoring and administration dashboard</p>
          </div>

          {/* Summary Cards */}
          <div className="mb-8">
            <SummaryCards summary={finalConsoleData.summary} />
          </div>

          {/* Content Refresh KPI Cards - P4-8 */}
          <ContentRefreshKpiCards 
            rlsDenies={finalKpiMetrics.rlsDenies}
            edgeFailures={finalKpiMetrics.edgeFailures}
            publicFreshness={finalKpiMetrics.publicFreshness}
            errors={finalKpiMetrics.errors}
          />

          {/* System Health Overview */}
          <div className="mb-8">
            <SystemHealthPanel health={finalConsoleData.health} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Alerts */}
            <div>
              <AlertsPanel 
                alerts={finalConsoleData.recentAlerts}
                stats={finalConsoleData.stats.alerts}
                isPreview={true}
              />
            </div>

            {/* Recent Job Runs */}
            <div>
              <JobsPanel 
                jobs={finalConsoleData.recentJobs}
                stats={finalConsoleData.stats.jobs}
                isPreview={true}
              />
            </div>

            {/* Slow Queries Panel */}
            <div>
              <SlowQueriesPanel 
                queries={finalConsoleData.slowQueries}
                isPreview={true} 
              />
            </div>
          </div>

          {/* Schema Diff Monitoring */}
          <div className="mt-8">
            <SchemaDiffPanel className="w-full" />
          </div>

          {/* Quick Actions */}
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="flex flex-wrap gap-4">
              <button className="px-4 py-2 bg-[var(--aio-primary)] text-white rounded hover:bg-[var(--aio-primary-hover)] transition">
                Run Health Check
              </button>
              <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition">
                Clear Cache
              </button>
              <button className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition">
                Generate Report
              </button>
              <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition">
                Emergency Stop
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    logger.error('Admin console page error:', error);
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">Super admin privileges required.</p>
        </div>
      </div>
    );
  }
}

/**
 * VIEWベースのデータ取得関数
 * 
 * Supabase VIEWから直接取得：
 * - admin_alerts_latest_v1
 * - admin_jobs_recent_v1  
 * - admin_summary_today_v1
 * 
 * 将来の実装:
 * - slow queries: Edge Function + pg_stat_statements (JWT認証 + マスキング)
 * - パフォーマンス: データ増加時は created_at インデックス追加を検討
 */
async function fetchConsoleDataFromViews(): Promise<AdminConsoleData> {
  const supabase = await createClient();

  try {
    // 並列でVIEWからデータ取得
    // NOTE: データ量増加時はVIEWの実行プランとパフォーマンスを監視
    // 必要に応じて alert_events(created_at DESC), job_runs(created_at DESC) のインデックス追加
    const [alertsResult, jobsResult, summaryResult] = await Promise.allSettled([
      // アラートデータ（VIEW: admin_alerts_latest_v1）
      supabase
        .from('admin_alerts_latest_v1')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10),
      
      // ジョブデータ（VIEW: admin_jobs_recent_v1）
      supabase
        .from('admin_jobs_recent_v1')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10),
      
      // サマリーデータ（VIEW: admin_summary_today_v1）
      supabase
        .from('admin_summary_today_v1')
        .select('*')
        .single()
    ]);

    // アラートデータの取得結果
    let alerts: AdminAlertEvent[] = [];
    if (alertsResult.status === 'fulfilled' && alertsResult.value.data) {
      alerts = alertsResult.value.data;
      logger.info('Alerts loaded from VIEW', { count: alerts.length });
    } else {
      logger.warn('Failed to load alerts from VIEW:', alertsResult.status === 'rejected' ? alertsResult.reason : 'No data');
    }

    // ジョブデータの取得結果
    let jobs: AdminJobRun[] = [];
    if (jobsResult.status === 'fulfilled' && jobsResult.value.data) {
      jobs = jobsResult.value.data;
      logger.info('Jobs loaded from VIEW', { count: jobs.length });
    } else {
      logger.warn('Failed to load jobs from VIEW:', jobsResult.status === 'rejected' ? jobsResult.reason : 'No data');
    }

    // サマリーデータの取得結果とマッピング
    let summary: AdminConsoleSummary;
    if (summaryResult.status === 'fulfilled' && (summaryResult.value as any)?.data) {
      const summaryRow = (summaryResult.value as any).data as AdminSummaryRaw;
      summary = mapSummaryRowToSummary(summaryRow);
      logger.info('Summary loaded from VIEW', summary);
    } else {
      logger.warn('Failed to load summary from VIEW:', summaryResult.status === 'rejected' ? summaryResult.reason : 'No data');
      summary = mapSummaryRowToSummary(null);
    }

    // 統計情報の計算
    const stats = calculateStatsFromViewData(alerts, jobs);

    // システムヘルス情報の生成
    const health = await checkSystemHealth(supabase);

    // TODO: SlowQueries取得 - 将来はここで Edge Function を呼び出し
    // const slowQueries = await fetchSlowQueriesForAdmin(supabase);
    const slowQueries: SlowQueryStat[] = []; // 現在はダミー

    return {
      health,
      stats,
      summary,
      recentAlerts: alerts,
      recentJobs: jobs,
      slowQueries,
    };

  } catch (error) {
    logger.error('Failed to fetch console data from VIEWs:', error);
    
    // フォールバックデータを返す
    return {
      health: {
        database: { status: 'critical', responseTime: 0, activeConnections: 0, details: 'Failed to connect' },
        supabase: { status: 'critical', apiResponseTime: 0, storageStatus: 'critical', details: 'Failed to connect' },
        external_services: { status: 'critical', services: [] },
        overall: 'critical',
        lastChecked: new Date().toISOString(),
      },
      stats: {
        alerts: { total: 0, byType: {}, bySeverity: {}, recent24h: 0 },
        jobs: { total: 0, byType: {}, byStatus: { success: 0, error: 0 }, recent24h: 0, failureRate: 0 },
        performance: { avgResponseTime: 0, errorRate: 1, uptime: 0 },
      },
      summary: mapSummaryRowToSummary(null),
      recentAlerts: [],
      recentJobs: [],
      slowQueries: [], // フォールバック時もダミー
    };
  }
}

/**
 * VIEWデータから統計情報を計算
 * VIEWに含まれるデータのみを使用して集計
 */
function calculateStatsFromViewData(alerts: AdminAlertEvent[], jobs: AdminJobRun[]) {
  try {
    // アラート統計
    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};

    alerts.forEach(alert => {
      byType[alert.event_type] = (byType[alert.event_type] || 0) + 1;
      bySeverity[alert.severity] = (bySeverity[alert.severity] || 0) + 1;
    });

    // ジョブ統計
    const byJobType: Record<string, number> = {};
    const byJobStatus = { success: 0, error: 0 };

    jobs.forEach(job => {
      byJobType[job.job_name] = (byJobType[job.job_name] || 0) + 1;
      if (job.status === 'success') byJobStatus.success++;
      if (job.status === 'error') byJobStatus.error++;
    });

    const totalJobs = jobs.length;
    const failureRate = totalJobs > 0 ? byJobStatus.error / totalJobs : 0;

    return {
      alerts: {
        total: alerts.length,
        byType,
        bySeverity,
        recent24h: alerts.length, // VIEWが24h範囲を想定
      },
      jobs: {
        total: jobs.length,
        byType: byJobType,
        byStatus: byJobStatus,
        recent24h: jobs.length, // VIEWが24h範囲を想定
        failureRate,
      },
      performance: {
        avgResponseTime: 150, // TODO: 実際のメトリクスから取得
        errorRate: failureRate,
        uptime: 0.999, // TODO: 実際のメトリクスから取得
      },
    };
  } catch (error) {
    logger.error('Failed to calculate stats from VIEW data:', error);
    return {
      alerts: { total: 0, byType: {}, bySeverity: {}, recent24h: 0 },
      jobs: { total: 0, byType: {}, byStatus: { success: 0, error: 0 }, recent24h: 0, failureRate: 0 },
      performance: { avgResponseTime: 0, errorRate: 1, uptime: 0 },
    };
  }
}

/**
 * システムヘルスチェック
 * VIEWアクセス可能性も含めて確認
 */
async function checkSystemHealth(supabase: any) {
  const startTime = Date.now();
  
  try {
    // VIEWアクセス確認（軽量クエリ）
    await supabase.from('admin_summary_today_v1').select('today_alerts').limit(1);
    const dbResponseTime = Date.now() - startTime;

    return {
      database: {
        status: 'healthy' as const,
        responseTime: dbResponseTime,
        activeConnections: 10, // TODO: 実際の値を取得
      },
      supabase: {
        status: 'healthy' as const,
        apiResponseTime: dbResponseTime,
        storageStatus: 'healthy' as const,
      },
      external_services: {
        status: 'healthy' as const,
        services: [
          { name: 'Authentication', status: 'healthy' as const, responseTime: 45 },
          { name: 'Storage', status: 'healthy' as const, responseTime: 32 },
          { name: 'Admin VIEWs', status: 'healthy' as const, responseTime: dbResponseTime },
        ],
      },
      overall: 'healthy' as const,
      lastChecked: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Health check failed (including VIEWs):', error);
    return {
      database: { status: 'critical' as const, responseTime: 0, activeConnections: 0, details: 'VIEW access failed' },
      supabase: { status: 'critical' as const, apiResponseTime: 0, storageStatus: 'critical' as const },
      external_services: { status: 'critical' as const, services: [] },
      overall: 'critical' as const,
      lastChecked: new Date().toISOString(),
    };
  }
}