/**
 * Embed Page - 新アーキテクチャ版
 *
 * NOTE: [PHASE_4B_QUOTA_DISPLAY]
 * サーバーコンポーネントとして EmbedPageWithQuota を呼び出す
 * DashboardPageShellはEmbedPageWithQuota内で適用済み
 */

import EmbedPageWithQuota from './EmbedPageWithQuota';

export default function EmbedPage() {
  return <EmbedPageWithQuota />;
}
