/**
 * Embed Page Server Component Wrapper (Phase 4-B)
 * 
 * NOTE: [DISPLAY_ONLY]
 * - Quota 情報の取得とClient Componentへの受け渡しのみ
 * - 制限ロジックには一切関与しない（fail-open設計）
 */

import { getCurrentUserOrganization } from '@/lib/organizations-server';
import { fetchOrgQuotaUsage } from '@/lib/org-features';
import type { SimpleQuotaProps } from '@/components/quota/OrgQuotaBadge';
import EmbedPageClient from './EmbedPageClient';

/**
 * NormalizedOrgQuotaUsage を SimpleQuotaProps に変換
 */
function normalizeQuotaForProps(quota: any): SimpleQuotaProps | null {
  if (!quota) return null;
  
  return {
    limit: quota.limits.effectiveLimit,
    unlimited: quota.limits.unlimited,
    usedInWindow: quota.usage.usedInWindow,
    remaining: quota.usage.remaining,
    windowType: quota.window.type,
  };
}

export default async function EmbedPageWithQuota() {
  let embedsQuota: SimpleQuotaProps | null = null;
  
  try {
    // 組織情報を取得（Server専用関数を使用）
    const organization = await getCurrentUserOrganization();
    if (organization?.id) {
      // Quota 情報を取得（fail-open）
      const quotaData = await fetchOrgQuotaUsage(organization.id, 'embeds');
      embedsQuota = normalizeQuotaForProps(quotaData);
    }
  } catch (error) {
    // fail-open: エラー時はquotaをnullのままにして、Client Componentは従来通り動作
    console.error('Failed to fetch embeds quota, proceeding without quota display:', error);
  }
  
  return <EmbedPageClient embedsQuota={embedsQuota} />;
}