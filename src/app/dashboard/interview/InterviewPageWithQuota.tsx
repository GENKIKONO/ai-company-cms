/**
 * Interview Page Server Component Wrapper (Phase 4-B)
 * 
 * NOTE: [DISPLAY_ONLY]
 * - Quota 情報の取得とClient Componentへの受け渡しのみ
 * - 制限ロジックには一切関与しない（fail-open設計）
 */

import { getCurrentUser } from '@/lib/auth';
import { getOrganization } from '@/lib/organizations';
import { fetchOrgQuotaUsage } from '@/lib/org-features';
import { logger } from '@/lib/utils/logger';
import type { SimpleQuotaProps } from '@/components/quota/OrgQuotaBadge';
import InterviewPageClient from './InterviewPageClient';

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

export default async function InterviewPageWithQuota() {
  let aiInterviewQuota: SimpleQuotaProps | null = null;
  
  try {
    // 組織情報を取得
    const user = await getCurrentUser();
    if (user?.id) {
      const organization = await getOrganization(user.id);
      if (organization?.data?.id) {
        // Quota 情報を取得（fail-open）
        const quotaResult = await fetchOrgQuotaUsage(organization.data.id, 'ai_interview');
        // 新しいRPC結果構造に対応
        aiInterviewQuota = normalizeQuotaForProps(quotaResult.data || null);
      }
    }
  } catch (error) {
    // fail-open: エラー時はquotaをnullのままにして、Client Componentは従来通り動作
    logger.error('Failed to fetch ai_interview quota, proceeding without quota display:', error);
  }
  
  return <InterviewPageClient aiInterviewQuota={aiInterviewQuota} />;
}