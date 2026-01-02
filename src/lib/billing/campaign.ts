/**
 * キャンペーンベースのStripe Checkout管理
 * 組織の割引グループに基づいて適切なチェックアウトリンクを提供
 */

import { createServerClient } from '@supabase/ssr';
import { env } from '@/lib/env';
import { logger } from '@/lib/utils/logger';

export interface CheckoutInfo {
  stripe_price_id: string;
  stripe_checkout_url: string | null;
  discount_rate: number;
  campaign_type: string;
  is_fallback?: boolean;
}

export interface Organization {
  id: string;
  discount_group?: string | null;
  original_signup_campaign?: string | null;
}

/**
 * 組織の割引グループから適切なキャンペーンタイプを決定
 */
export function getCampaignFromOrganization(org: Organization): string {
  // 割引グループベースの判定
  if (org.discount_group === 'test_user_30off') {
    return 'test_user';
  }
  if (org.discount_group === 'early_user_20off') {
    return 'early_user';
  }
  
  // 元のサインアップキャンペーンベースの判定
  if (org.original_signup_campaign === 'early_bird') {
    return 'early_user';
  }
  
  return 'regular';
}

/**
 * 組織のアクティブなチェックアウトリンクを取得
 */
export async function fetchActiveCheckoutLink(
  plan: string,
  organization: Organization
): Promise<CheckoutInfo | null> {
  try {
    const campaignType = getCampaignFromOrganization(organization);
    
    // Supabaseクライアント作成（サーバーサイド専用）
    const supabase = createServerClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_KEY,
      {
        cookies: {
          getAll() {
            return [];
          },
          setAll() {
            // サーバーサイドでは不要
          },
        },
      }
    );

    // アクティブなチェックアウトリンクを検索
    const { data: checkoutLink, error } = await supabase
      .from('stripe_checkout_links')
      .select('id, plan, campaign_type, stripe_price_id, stripe_checkout_url, discount_rate, is_active, is_private, created_at, updated_at')
      .eq('plan', plan)
      .eq('campaign_type', campaignType)
      .eq('is_active', true)
      .single();

    if (error || !checkoutLink) {
      logger.warn(`No active checkout link found for plan: ${plan}, campaign: ${campaignType}`, {
        orgId: organization.id,
        error: error?.message
      });
      
      // フォールバック：通常キャンペーンのリンクを探す
      const { data: fallbackLink } = await supabase
        .from('stripe_checkout_links')
        .select('id, plan, campaign_type, stripe_price_id, stripe_checkout_url, discount_rate, is_active, is_private, created_at, updated_at')
        .eq('plan', plan)
        .eq('campaign_type', 'regular')
        .eq('is_active', true)
        .single();

      if (fallbackLink) {
        return {
          stripe_price_id: fallbackLink.stripe_price_id,
          stripe_checkout_url: fallbackLink.stripe_checkout_url,
          discount_rate: fallbackLink.discount_rate,
          campaign_type: fallbackLink.campaign_type,
          is_fallback: true
        };
      }

      return null;
    }

    return {
      stripe_price_id: checkoutLink.stripe_price_id,
      stripe_checkout_url: checkoutLink.stripe_checkout_url,
      discount_rate: checkoutLink.discount_rate,
      campaign_type: checkoutLink.campaign_type,
      is_fallback: false
    };

  } catch (error) {
    logger.error('Failed to fetch active checkout link', { data: error instanceof Error ? error : new Error(String(error)) });
    return null;
  }
}

/**
 * 割引適用後の表示価格を計算
 */
export function calculateDiscountedPrice(
  originalPrice: number,
  discountRate: number
): number {
  return Math.floor(originalPrice * (100 - discountRate) / 100);
}

/**
 * キャンペーンタイプの説明文を取得
 */
export function getCampaignDescription(campaignType: string): string {
  switch (campaignType) {
    case 'test_user':
      return '6ヶ月無料 + その後ずっと30%OFF';
    case 'early_user':
      return 'ずっと20%OFF';
    case 'regular':
      return '通常価格';
    default:
      return '';
  }
}

/**
 * プライベートリンク用の特別チェックアウト情報を取得
 */
export async function getPrivateCheckoutLink(
  plan: string,
  campaignType: string
): Promise<CheckoutInfo | null> {
  try {
    const supabase = createServerClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_KEY,
      {
        cookies: {
          getAll() {
            return [];
          },
          setAll() {
            // サーバーサイドでは不要
          },
        },
      }
    );

    // プライベートリンクを検索
    const { data: checkoutLink, error } = await supabase
      .from('stripe_checkout_links')
      .select('id, plan, campaign_type, stripe_price_id, stripe_checkout_url, discount_rate, is_active, is_private, created_at, updated_at')
      .eq('plan', plan)
      .eq('campaign_type', campaignType)
      .eq('is_private', true)
      .eq('is_active', true)
      .single();

    if (error || !checkoutLink) {
      return null;
    }

    return {
      stripe_price_id: checkoutLink.stripe_price_id,
      stripe_checkout_url: checkoutLink.stripe_checkout_url,
      discount_rate: checkoutLink.discount_rate,
      campaign_type: checkoutLink.campaign_type
    };

  } catch (error) {
    logger.error('Failed to fetch private checkout link', { data: error instanceof Error ? error : new Error(String(error)) });
    return null;
  }
}