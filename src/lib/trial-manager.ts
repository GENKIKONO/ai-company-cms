/**
 * Trial Management System
 * 14日間無料トライアル機能の管理
 */

import { createClient } from '@/lib/supabase-client';
import type { Organization } from '@/types/database';
import { logger } from '@/lib/utils/logger';

export interface TrialStatus {
  isTrialing: boolean;
  isExpired: boolean;
  daysRemaining: number;
  endDate: Date | null;
  shouldTransitionToStarter: boolean;
}

/**
 * 新規組織にトライアルを開始
 */
export async function startTrial(organizationId: string): Promise<boolean> {
  try {
    const supabase = createClient();
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 14);

    const { error } = await supabase
      .from('organizations')
      .update({
        plan: 'trial',
        subscription_status: 'trialing',
        trial_end_date: trialEndDate.toISOString(),
      })
      .eq('id', organizationId);

    return !error;
  } catch (error) {
    logger.error('Failed to start trial', error instanceof Error ? error : new Error(String(error)));
    return false;
  }
}

/**
 * トライアル状態を確認
 */
export function getTrialStatus(organization: Organization): TrialStatus {
  const now = new Date();
  const endDate = organization.trial_end_date ? new Date(organization.trial_end_date) : null;
  const isTrialing = organization.subscription_status === 'trialing' && organization.plan === 'trial';
  
  if (!endDate || !isTrialing) {
    return {
      isTrialing: false,
      isExpired: false,
      daysRemaining: 0,
      endDate: null,
      shouldTransitionToStarter: false,
    };
  }

  const timeRemaining = endDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));
  const isExpired = timeRemaining <= 0;

  return {
    isTrialing: true,
    isExpired,
    daysRemaining: Math.max(0, daysRemaining),
    endDate,
    shouldTransitionToStarter: isExpired,
  };
}

/**
 * トライアル期限切れ組織をStarterプランに移行
 */
export async function transitionToStarter(organizationId: string): Promise<boolean> {
  try {
    const supabase = createClient();

    const { error } = await supabase
      .from('organizations')
      .update({
        plan: 'starter',
        subscription_status: 'active',
        trial_end_date: null,
      })
      .eq('id', organizationId);

    return !error;
  } catch (error) {
    logger.error('Failed to transition to starter', error instanceof Error ? error : new Error(String(error)));
    return false;
  }
}

/**
 * 期限切れトライアルをチェックして移行処理
 */
export async function checkAndTransitionExpiredTrials(): Promise<number> {
  try {
    const supabase = createClient();
    const now = new Date().toISOString();

    // 期限切れのトライアル組織を取得
    const { data: expiredTrials, error } = await supabase
      .from('organizations')
      .select('id, name, trial_end_date')
      .eq('subscription_status', 'trialing')
      .eq('plan', 'trial')
      .lt('trial_end_date', now);

    if (error || !expiredTrials) {
      logger.error('Failed to fetch expired trials', error instanceof Error ? error : new Error(String(error)));
      return 0;
    }

    let transitionedCount = 0;
    for (const org of expiredTrials) {
      const success = await transitionToStarter(org.id);
      if (success) {
        transitionedCount++;
        console.log(`Transitioned organization ${org.name} (${org.id}) to Starter plan`);
      }
    }

    return transitionedCount;
  } catch (error) {
    logger.error('Failed to check expired trials', error instanceof Error ? error : new Error(String(error)));
    return 0;
  }
}

/**
 * トライアル通知メッセージを生成
 */
export function getTrialNotificationMessage(status: TrialStatus): string | null {
  if (!status.isTrialing) return null;

  if (status.isExpired) {
    return 'トライアル期間が終了しました。Starterプランで継続利用できます。';
  }

  if (status.daysRemaining <= 3) {
    return `トライアル期間があと${status.daysRemaining}日で終了します。`;
  }

  if (status.daysRemaining <= 7) {
    return `トライアル期間があと${status.daysRemaining}日です。`;
  }

  return null;
}

/**
 * 構造化データスコア計算（モック実装）
 */
export function calculateStructuredDataScore(organization: Organization): number {
  let score = 0;
  const maxScore = 100;

  // 基本情報完成度 (30点)
  if (organization.name) score += 5;
  if (organization.description) score += 5;
  if (organization.logo_url) score += 5;
  if (organization.url) score += 5;
  if (organization.email) score += 5;
  if (organization.address_locality) score += 5;

  // サービス情報 (40点)
  const serviceCount = organization.services?.length || 0;
  if (serviceCount > 0) score += 10;
  if (serviceCount >= 3) score += 10;
  if (serviceCount >= 5) score += 20;

  // Q&A情報 (20点)
  const faqCount = organization.faqs?.length || 0;
  if (faqCount > 0) score += 5;
  if (faqCount >= 5) score += 10;
  if (faqCount >= 10) score += 5;

  // 導入事例 (10点)
  const caseStudyCount = organization.case_studies?.length || 0;
  if (caseStudyCount > 0) score += 5;
  if (caseStudyCount >= 3) score += 5;

  return Math.min(score, maxScore);
}