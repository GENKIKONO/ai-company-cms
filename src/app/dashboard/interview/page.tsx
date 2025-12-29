/**
 * Interview Page - 新アーキテクチャ版
 *
 * NOTE: [PHASE_4B_QUOTA_DISPLAY]
 * サーバーコンポーネントとして InterviewPageWithQuota を呼び出す
 * DashboardPageShellはInterviewPageWithQuota内で適用済み
 */

import InterviewPageWithQuota from './InterviewPageWithQuota';

export default function InterviewPage() {
  return <InterviewPageWithQuota />;
}
