/**
 * System Diagnostics Page
 * /ops/diagnostics
 *
 * NOTE: [CORE_ARCHITECTURE] Ops Admin権限チェックを実施
 * See: docs/core-architecture.md
 */

import { requireOpsAdminPage } from '@/lib/ops-guard';
import DiagnosticsClient from './DiagnosticsClient';

// 管理系ページ: cookiesを使用するためリクエスト時実行が必要
export const dynamic = 'force-dynamic';

export default async function DiagnosticsPage() {
  // Ops Admin権限チェック（Core経由）
  await requireOpsAdminPage();

  return <DiagnosticsClient />;
}
