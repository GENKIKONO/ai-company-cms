/**
 * Embed Page - Server Component Entry Point (Phase 4-B)
 * 
 * NOTE: [PHASE_4B_QUOTA_DISPLAY]
 * - Server Componentで quota 情報を取得
 * - Client Componentで UI 表示
 * - 制限ロジックは一切変更せず、表示のみ追加
 */

import EmbedPageWithQuota from './EmbedPageWithQuota';

export default function EmbedPage() {
  return <EmbedPageWithQuota />;
}