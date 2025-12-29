/**
 * AI × SEO 相関分析ダッシュボードページ
 * Feature Flags: ai_bot_analytics, ai_visibility_analytics, ai_reports
 *
 * NOTE: [FEATUREGATE_MIGRATION] プラン名ハードコード判定を廃止し、
 * featureGate経由の機能フラグ判定に移行済み
 */

import { Suspense } from 'react';
import { DashboardPageShell } from '@/components/dashboard';
import { DashboardLoadingState } from '@/components/dashboard/ui';
import { AISEOReportClient } from './AISEOReportClient';

export default function AISEOReportPage() {
  return (
    <DashboardPageShell title="AI × SEO分析" requiredRole="viewer">
      <div className="min-h-screen bg-[var(--aio-surface)]">
        <Suspense fallback={<DashboardLoadingState message="読み込み中" />}>
          <AISEOReportClient />
        </Suspense>
      </div>
    </DashboardPageShell>
  );
}