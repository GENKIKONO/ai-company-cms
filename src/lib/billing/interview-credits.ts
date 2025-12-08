/**
 * AIインタビュアー完了セッション数の月間制限チェック
 * プラン別の上限を厳格に管理（無制限は禁止）
 */

import type { SupabaseClient } from '@supabase/supabase-js';
// TODO: [SUPABASE_TYPE_FOLLOWUP] Supabase Database 型定義を再構築後に復元する
import { logger } from '@/lib/utils/logger';

type SupabaseClientType = SupabaseClient<any>;

/**
 * プラン種別定義
 */
type PlanKey = 'starter' | 'pro' | 'business' | 'enterprise';

// TODO: [UNIFICATION_CANDIDATE] Phase 3-B: AI面接クレジット制限の Supabase plan_features 移行
// 現状: Stripe price_id → 環境変数マッピング → 静的制限値
// 提案: plan_features テーブルで ai_interview_credits 機能の limit 値管理
// 利点: 管理画面でのクォータ一元表示、プラン別カスタマイズ、オーバーライド可能
// 影響: 既存の price_id マッピングロジック維持必須（後方互換性）

/**
 * プラン別月間AIインタビュー上限
 * 「completed セッション数」ベースでカウント
 */
const MONTHLY_INTERVIEW_LIMITS: Record<PlanKey, number> = {
  starter: 5,      // Starter: 月5回
  pro: 40,         // Pro: 月40回
  business: 200,   // Business: 月200回
  enterprise: 500, // Enterprise: 月500回（無制限は禁止）
};

/**
 * Stripe price_id → PlanKey のマッピング
 * 環境変数から動的に生成
 */
const PRICE_ID_TO_PLAN_KEY: Record<string, PlanKey> = {};

// 環境変数 → planKey のマッピング定義
const ENV_TO_PLAN: Array<{ envKey: string; planKey: PlanKey }> = [
  // BASIC → starter プラン（月5回）
  { envKey: 'STRIPE_TEST_BASIC_PRICE_ID', planKey: 'starter' },
  { envKey: 'STRIPE_EARLY_BASIC_PRICE_ID', planKey: 'starter' },
  { envKey: 'STRIPE_NORMAL_BASIC_PRICE_ID', planKey: 'starter' },
  
  // PRO → pro プラン（月40回）
  { envKey: 'STRIPE_TEST_PRO_PRICE_ID', planKey: 'pro' },
  { envKey: 'STRIPE_EARLY_PRO_PRICE_ID', planKey: 'pro' },
  { envKey: 'STRIPE_NORMAL_PRO_PRICE_ID', planKey: 'pro' },
  
  // BUSINESS → business プラン（月200回）
  { envKey: 'STRIPE_TEST_BUSINESS_PRICE_ID', planKey: 'business' },
  { envKey: 'STRIPE_EARLY_BUSINESS_PRICE_ID', planKey: 'business' },
  { envKey: 'STRIPE_NORMAL_BUSINESS_PRICE_ID', planKey: 'business' },
  
  // Enterprise は現状 Stripe 定額未使用のためマッピング不要
];

// 環境変数から実際の price_id を読み取ってマッピングを構築
for (const { envKey, planKey } of ENV_TO_PLAN) {
  const priceId = process.env[envKey];
  if (priceId && priceId.trim()) {
    PRICE_ID_TO_PLAN_KEY[priceId] = planKey;
  }
}

/**
 * price_id → PlanKey の解決
 * 
 * 環境変数から構築した PRICE_ID_TO_PLAN_KEY マップを使用。
 * 実際のStripe price_idは Vercel 環境変数に設定済み。
 */
function resolvePlanKeyFromPriceId(priceId: string | null): PlanKey {
  // サブスクリプション自体がない／priceIdがnull → starter扱い
  if (!priceId) {
    return 'starter';
  }

  const planKey = PRICE_ID_TO_PLAN_KEY[priceId];
  if (planKey) {
    return planKey;
  }

  // ここに到達するのは「環境変数が未設定 or 未知のpriceId」の場合
  // 一時的な安全側フォールバック: starter の 5 回制限を適用
  logger.error('[interview-credits] Unknown Stripe price_id. Falling back to starter limit.', {
    priceId,
    availablePriceIds: Object.keys(PRICE_ID_TO_PLAN_KEY),
    configuredEnvKeys: ENV_TO_PLAN.map(item => item.envKey),
    message: 'Check STRIPE_*_PRICE_ID environment variables in Vercel to enable proper plan limits.'
  });
  return 'starter';
}

/**
 * 月間AIインタビュー使用量チェック結果
 */
export interface QuestionUsageResult {
  allowed: boolean;                    // インタビュー実行可能かどうか
  currentUsage: number;               // 今月の completed セッション数
  monthlyLimit: number;               // 今月の上限数 (常に数値)
  priceId: string | null;            // 有効なsubscriptionのprice_id
  remainingQuestions: number;          // 残り実行可能数 (常に数値)
  isExceeded: boolean;               // 制限を超過しているかどうか
}

/**
 * DEPRECATED: Supabase get_org_quota_usage / isFeatureQuotaLimitReached に移行済み。新規コードでは使用しないこと。
 * 
 * 組織の今月の質問数使用状況を確認し、新しい質問実行の可否を判定
 */
export async function checkMonthlyQuestionUsage(
  supabase: SupabaseClientType,
  organizationId: string
): Promise<QuestionUsageResult> {
  try {
    // 1. 組織の有効なsubscriptionを取得
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('id, price_id, status')
      .eq('organization_id', organizationId)
      .in('status', ['active', 'trialing'])  // 有効なsubscriptionのみ
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subscriptionError) {
      logger.error('Failed to fetch organization subscription', { 
        organizationId, 
        error: subscriptionError 
      });
      // エラー時は安全側（ブロック）
      const starterLimit = MONTHLY_INTERVIEW_LIMITS.starter;
      return {
        allowed: false,
        currentUsage: starterLimit,
        monthlyLimit: starterLimit,
        priceId: null,
        remainingQuestions: 0,
        isExceeded: true
      };
    }

    // 有効なsubscriptionがない場合はStarter制限適用
    if (!subscriptionData) {
      logger.debug('No active subscription found, applying starter limit', { organizationId });
      
      // 使用量を取得してStarter制限と比較
      const currentUsage = await getCurrentMonthUsage(supabase, organizationId);
      const starterLimit = MONTHLY_INTERVIEW_LIMITS.starter;
      const remainingQuestions = Math.max(0, starterLimit - currentUsage);
      const isExceeded = currentUsage >= starterLimit;
      
      return {
        allowed: !isExceeded,
        currentUsage,
        monthlyLimit: starterLimit,
        priceId: null,
        remainingQuestions,
        isExceeded
      };
    }

    const priceId = subscriptionData.price_id;

    // 2. price_idからプランキーを解決し、対応する制限を取得
    const planKey = resolvePlanKeyFromPriceId(priceId);
    const monthlyLimit = MONTHLY_INTERVIEW_LIMITS[planKey];
    
    logger.debug('Plan resolved for organization', {
      organizationId,
      priceId,
      planKey,
      monthlyLimit
    });

    // 3. 今月の質問数使用量を取得
    const currentUsage = await getCurrentMonthUsage(supabase, organizationId);
    const remainingQuestions = Math.max(0, monthlyLimit - currentUsage);
    const isExceeded = currentUsage >= monthlyLimit;
    const allowed = !isExceeded;

    logger.debug('Monthly question usage check completed', {
      organizationId,
      priceId,
      currentUsage,
      monthlyLimit,
      remainingQuestions,
      isExceeded,
      allowed
    });

    return {
      allowed,
      currentUsage,
      monthlyLimit,
      priceId,
      remainingQuestions,
      isExceeded
    };

  } catch (error) {
    logger.error('Exception in monthly question usage check', {
      organizationId,
      error: error instanceof Error ? error.message : error
    });

    // 例外発生時は安全側（ブロック）
    const starterLimit = MONTHLY_INTERVIEW_LIMITS.starter;
    return {
      allowed: false,
      currentUsage: starterLimit,
      monthlyLimit: starterLimit,
      priceId: null,
      remainingQuestions: 0,
      isExceeded: true
    };
  }
}

/**
 * 今月の使用量を取得するヘルパー関数
 * 完了済みセッション数をカウント（ai_interview_sessions.status = 'completed'）
 */
async function getCurrentMonthUsage(
  supabase: SupabaseClientType,
  organizationId: string
): Promise<number> {
  try {
    // 今月の開始日・終了日を計算
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

    const { count, error: usageError } = await supabase
      .from('ai_interview_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'completed')
      .gte('created_at', monthStart)
      .lt('created_at', monthEnd)
      .is('deleted_at', null);

    if (usageError) {
      logger.error('Failed to fetch monthly completed sessions', { 
        organizationId, 
        error: usageError 
      });
      // エラー時は安全側に大きな値を返して制限をかける
      return 999;
    }

    return count || 0;
  } catch (error) {
    logger.error('Exception in getCurrentMonthUsage', {
      organizationId,
      error: error instanceof Error ? error.message : error
    });
    // エラー時は安全側に大きな値を返して制限をかける
    return 999;
  }
}

/**
 * DEPRECATED: Supabase get_org_quota_usage / isFeatureQuotaLimitReached に移行済み。新規コードでは使用しないこと。
 * 
 * 質問実行前の事前チェック（複数質問の場合）
 * セッション作成時に指定された質問数がプラン制限内かをチェック
 */
export async function checkQuestionQuota(
  supabase: SupabaseClientType,
  organizationId: string,
  requestedQuestions: number
): Promise<QuestionUsageResult & { canExecuteAll: boolean }> {
  const usageResult = await checkMonthlyQuestionUsage(supabase, organizationId);
  
  // 要求された質問数が残り枠内かチェック
  const canExecuteAll = requestedQuestions <= usageResult.remainingQuestions;
  
  logger.debug('Question quota check completed', {
    organizationId,
    priceId: usageResult.priceId,
    requestedQuestions,
    remainingQuestions: usageResult.remainingQuestions,
    monthlyLimit: usageResult.monthlyLimit,
    canExecuteAll
  });

  return {
    ...usageResult,
    canExecuteAll
  };
}

/**
 * DEPRECATED: Supabase get_org_quota_usage / fetchOrgQuotaUsage に移行済み。新規コードでは使用しないこと。
 * 
 * プラン情報の取得（管理画面表示用）
 */
export async function getOrganizationPlanInfo(
  supabase: SupabaseClientType,
  organizationId: string
): Promise<{
  priceId: string | null;
  monthlyLimit: number;
  currentUsage: number;
  remainingQuestions: number;
  usagePercentage: number;
  isExceeded: boolean;
}> {
  const usageResult = await checkMonthlyQuestionUsage(supabase, organizationId);
  
  const usagePercentage = usageResult.monthlyLimit > 0
    ? Math.round((usageResult.currentUsage / usageResult.monthlyLimit) * 100)
    : 0;

  return {
    priceId: usageResult.priceId,
    monthlyLimit: usageResult.monthlyLimit,
    currentUsage: usageResult.currentUsage,
    remainingQuestions: usageResult.remainingQuestions,
    usagePercentage,
    isExceeded: usageResult.isExceeded
  };
}