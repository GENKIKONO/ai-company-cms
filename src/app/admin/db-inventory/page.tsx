/**
 * DB Inventory - 統合確認用ページ
 * site_admin 専用 / read-only
 *
 * 目的: DB側で ACTIVE と確定したオブジェクトの参照点を提供
 * 機能追加ではなく統合確認用
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isSiteAdmin } from '@/lib/core/auth-state';
import { getFeatureFlagsSafe } from '@/lib/core/db-safe-wrappers';

// 棚卸し対象DBオブジェクト定数リスト
const DB_OBJECTS = {
  views: ['v_public_registry'],
  tables: [
    'public_organizations_tbl',
    'products',
    'tenants',
    'org_memberships',
    'projects',
    'tasks',
    'comments',
    'user_profiles',
    'monthly_report_sections',
    'service_role_audit',
    'intrusion_detection_rules',
    'ip_blocklist',
    'ai_queries',
    'ai_answers',
    'ai_feedback',
    'ai_retrievals',
    'ai_sources',
    'ai_sections',
    'ai_chunks',
    'ai_jsonld_versions',
    'ai_visibility_scores',
    'ai_content_units',
    'file_metadata',
    'storage_access_logs',
    'organization_verifications',
  ],
  // 大規模テーブル（count禁止、存在確認のみ）
  largePartitionedTables: [
    'audit_logs',
    'rate_limit_logs',
    'blocked_ips',
  ],
} as const;

// Edge Functions 一覧（呼び出し確認用、実行はしない）
const EDGE_FUNCTIONS = [
  'ai-public', 'ai-interview', 'admin-content', 'admin-actions',
  'admin-audit-view', 'admin-rescue', 'admin-tools',
  'content-api', 'publish-asset', 'publish_toggle', 'publish-disclosure', 'share-view',
  'image-process', 'signed-url',
  'check-and-consume-quota', 'unblock_maintenance',
  'reports', 'reports-api', 'reports-worker', 'reports-get-current',
  'reports-list', 'reports-regenerate', 'reports-jobs', 'reports-job-detail',
  'monthly-report-batch', 'monthly-reports', 'ai_monthly_report_upsert',
] as const;

// 既知の呼び出し元（静的確認結果）
const EDGE_FUNCTION_CALLERS: Record<string, string | null> = {
  'monthly-report-generate': 'src/lib/reports/client.ts',
  'embedding-runner': 'src/server/embedding-admin-client.ts',
  'translation-runner': 'src/server/translation-admin-client.ts',
  'ghostwriter': 'src/components/cms/GhostwriterInput.tsx',
  'admin-api': 'src/lib/admin-api-client.ts',
  'cache-purge': 'src/lib/cache/cdn-purge.ts',
  'content-refresh-orchestrator': 'src/lib/supabase/admin-rpc.ts',
  'admin-audit-log': 'src/lib/jobs/security-scan-job.ts',
  'org-docs-ingest': 'src/app/api/my/org-docs/files/route.ts',
};

type QueryStatus = 'OK' | 'FORBIDDEN_OR_RLS' | 'NO_DATA' | 'ERROR';

interface TableResult {
  name: string;
  status: QueryStatus;
  latestAt?: string | null;
  error?: string;
}

async function queryTable(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tableName: string,
  isLarge: boolean
): Promise<TableResult> {
  try {
    // 大規模テーブルは存在確認のみ（limit 1）
    const query = supabase
      .from(tableName)
      .select('created_at, updated_at')
      .limit(1)
      .order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      // RLS/権限エラーを区別
      if (error.code === '42501' || error.message.includes('permission denied')) {
        return { name: tableName, status: 'FORBIDDEN_OR_RLS', error: error.message };
      }
      if (error.code === 'PGRST116') {
        return { name: tableName, status: 'NO_DATA' };
      }
      return { name: tableName, status: 'ERROR', error: error.message };
    }

    if (!data || data.length === 0) {
      return { name: tableName, status: 'NO_DATA' };
    }

    const latest = data[0];
    const latestAt = latest.updated_at || latest.created_at || null;

    return { name: tableName, status: 'OK', latestAt };
  } catch (err) {
    return {
      name: tableName,
      status: 'ERROR',
      error: err instanceof Error ? err.message : 'Unknown error'
    };
  }
}

export default async function DbInventoryPage() {
  // site_admin チェック（Core経由）
  const isAdmin = await isSiteAdmin();
  if (!isAdmin) {
    redirect('/dashboard?error=forbidden');
  }

  const supabase = await createClient();

  // db-safe-wrappers 実使用（read-only）: site主体のfeature_flagsを確認
  // テーブルが存在しなくても空配列を返すだけ
  // 注意: このページは完全にread-only。write呼び出しは禁止。
  const _siteFlags = await getFeatureFlagsSafe(supabase, { type: 'user', id: 'site' });

  // 各テーブルの存在確認
  const viewResults: TableResult[] = [];
  for (const view of DB_OBJECTS.views) {
    viewResults.push(await queryTable(supabase, view, false));
  }

  const tableResults: TableResult[] = [];
  for (const table of DB_OBJECTS.tables) {
    tableResults.push(await queryTable(supabase, table, false));
  }

  const largeTableResults: TableResult[] = [];
  for (const table of DB_OBJECTS.largePartitionedTables) {
    largeTableResults.push(await queryTable(supabase, table, true));
  }

  const allResults = [...viewResults, ...tableResults, ...largeTableResults];
  const okCount = allResults.filter(r => r.status === 'OK').length;
  const totalCount = allResults.length;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">DB Inventory</h1>
          <p className="text-sm text-gray-600 mt-2">
            統合確認用ページ（read-only）- site_admin専用
          </p>
          <p className="text-xs text-gray-500 mt-1">
            参照点: {okCount} / {totalCount} オブジェクト
          </p>
        </header>

        {/* Views */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Views</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Latest</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {viewResults.map((result) => (
                  <tr key={result.name}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">{result.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={result.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {result.latestAt || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Tables */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Tables</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Latest</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tableResults.map((result) => (
                  <tr key={result.name}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">{result.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={result.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {result.latestAt || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Large/Partitioned Tables */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Large/Partitioned Tables
            <span className="text-xs font-normal text-gray-500 ml-2">(existence check only)</span>
          </h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Note</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {largeTableResults.map((result) => (
                  <tr key={result.name}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">{result.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={result.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                      count(*) 禁止 - 存在確認のみ
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Edge Functions */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Edge Functions
            <span className="text-xs font-normal text-gray-500 ml-2">(static caller check, no execution)</span>
          </h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Caller</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {EDGE_FUNCTIONS.map((fn) => {
                  const caller = EDGE_FUNCTION_CALLERS[fn] || null;
                  return (
                    <tr key={fn}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">{fn}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {caller ? (
                          <span className="text-green-600">{caller}</span>
                        ) : (
                          <span className="text-gray-400">未接続（呼び出し無し）</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="text-xs text-gray-400 mt-8">
          <p>このページは統合確認用であり、機能追加ではありません。</p>
          <p>詳細は docs/db-inventory.md を参照してください。</p>
        </footer>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: QueryStatus }) {
  const styles: Record<QueryStatus, string> = {
    OK: 'bg-green-100 text-green-800',
    FORBIDDEN_OR_RLS: 'bg-yellow-100 text-yellow-800',
    NO_DATA: 'bg-gray-100 text-gray-800',
    ERROR: 'bg-red-100 text-red-800',
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded ${styles[status]}`}>
      {status}
    </span>
  );
}
