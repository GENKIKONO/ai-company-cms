/**
 * 組織 Quota/Usage 管理モジュール（Phase 4-A）
 * 
 * Supabase get_org_quota_usage RPC の呼び出しと
 * レスポンス正規化ヘルパーを提供
 * 
 * NOTE: [FAIL_OPEN_DESIGN]
 * - RPC エラー時は null を返す（既存挙動を壊さない）
 * - 制限判定では fail-open とする（アクセス拒否よりデータ不整合を優先）
 */

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import type { 
  NormalizedOrgQuotaUsage, 
  OrgQuotaUsageRpcResponse, 
  SupabaseFeatureKey,
  SupabasePlanType 
} from '@/types/features';

// RPC結果の拡張型（エラー情報を含む）
export interface FetchOrgQuotaUsageResult {
  data?: NormalizedOrgQuotaUsage;
  error?: {
    type: 'permission' | 'not_found' | 'network' | 'unknown';
    message: string;
    code?: string;
  };
}

/**
 * RPC 生レスポンスを正規化された形式に変換
 * @param raw get_org_quota_usage RPC の戻り値
 * @returns 正規化された quota/usage データ
 */
export function normalizeOrgQuotaUsageResponse(
  raw: OrgQuotaUsageRpcResponse,
): NormalizedOrgQuotaUsage {
  // Date パース（失敗時は null）
  const parseDate = (dateStr: string | null): Date | null => {
    if (!dateStr) return null;
    try {
      const parsed = new Date(dateStr);
      return isNaN(parsed.getTime()) ? null : parsed;
    } catch {
      return null;
    }
  };

  // meta.plan の安全な取得
  const plan: SupabasePlanType | null = raw.meta?.plan || null;

  return {
    organizationId: raw.organization_id,
    feature: raw.feature,
    window: {
      type: raw.window.type,
      start: parseDate(raw.window.start),
      end: parseDate(raw.window.end),
    },
    limits: {
      effectiveLimit: raw.limits.effective_limit,
      unlimited: raw.limits.unlimited,
      source: raw.limits.source,
    },
    usage: {
      usedInWindow: raw.usage.used_in_window,
      remaining: raw.usage.remaining,
    },
    plan,
    version: raw.version,
    updatedAt: parseDate(raw.updated_at) || new Date(), // フォールバック to 現在時刻
  };
}

/**
 * Supabase get_org_quota_usage RPC を呼び出して組織の機能使用量を取得
 * @param organizationId 組織UUID
 * @param featureKey 機能キー
 * @returns quota/usage データまたはエラー情報
 */
export async function fetchOrgQuotaUsage(
  organizationId: string,
  featureKey: SupabaseFeatureKey,
): Promise<FetchOrgQuotaUsageResult> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase.rpc('get_org_quota_usage', {
      p_org_id: organizationId,
      p_feature_key: featureKey,
    });

    if (error) {
      // 42501: insufficient_privilege (RLS権限エラー)
      if (error.code === '42501') {
        logger.error('RLS permission error in fetchOrgQuotaUsage', {
          organizationId,
          featureKey,
          error: error.message,
          code: error.code,
        });
        return {
          error: {
            type: 'permission',
            message: 'この組織の使用量情報にアクセスする権限がありません',
            code: error.code,
          }
        };
      }

      // その他のエラー
      logger.error('Failed to fetch org quota usage via RPC', {
        organizationId,
        featureKey,
        error: error.message,
        code: error.code,
      });
      return {
        error: {
          type: 'unknown',
          message: '使用量情報の取得に失敗しました',
          code: error.code,
        }
      };
    }

    if (!data) {
      logger.error('get_org_quota_usage returned no data', {
        organizationId,
        featureKey,
      });
      return {
        error: {
          type: 'not_found',
          message: '組織の使用量情報が見つかりません',
        }
      };
    }

    return { data: normalizeOrgQuotaUsageResponse(data as OrgQuotaUsageRpcResponse) };

  } catch (error) {
    logger.error('Exception in fetchOrgQuotaUsage', {
      organizationId,
      featureKey,
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      error: {
        type: 'network',
        message: 'ネットワークエラーが発生しました',
      }
    };
  }
}

/**
 * 後方互換性のためのラッパー関数
 * @deprecated 新しいコードでは fetchOrgQuotaUsage を直接使用し、エラーハンドリングを行ってください
 * @param organizationId 組織UUID
 * @param featureKey 機能キー
 * @returns 正規化された quota/usage データ または null（失敗時）
 */
export async function fetchOrgQuotaUsageLegacy(
  organizationId: string,
  featureKey: SupabaseFeatureKey,
): Promise<NormalizedOrgQuotaUsage | null> {
  const result = await fetchOrgQuotaUsage(organizationId, featureKey);
  return result.data || null;
}

/**
 * 機能の上限到達判定（Quota ベース）
 * @param organizationId 組織UUID
 * @param featureKey 機能キー
 * @returns true: 上限到達、false: 利用可能または判定不可
 */
export async function isFeatureQuotaLimitReached(
  organizationId: string,
  featureKey: SupabaseFeatureKey,
): Promise<boolean> {
  try {
    const result = await fetchOrgQuotaUsage(organizationId, featureKey);
    
    if (result.error) {
      // RLS権限エラーの場合は fail-open（現状の挙動を壊さない）
      if (result.error.type === 'permission') {
        logger.error('RLS permission error in isFeatureQuotaLimitReached, returning fail-open', {
          organizationId,
          featureKey,
          error: result.error.message,
        });
      } else {
        logger.error('Error in isFeatureQuotaLimitReached, returning fail-open', {
          organizationId,
          featureKey,
          error: result.error.message,
        });
      }
      return false;
    }

    if (!result.data) {
      // 予期しない状態
      logger.error('Unexpected state in isFeatureQuotaLimitReached - no data and no error');
      return false;
    }

    const quota = result.data;

    // unlimited の場合は常に利用可能
    if (quota.limits.unlimited) {
      return false;
    }

    // effectiveLimit = 0 の場合は機能無効と見なす
    if (quota.limits.effectiveLimit <= 0) {
      return quota.limits.effectiveLimit === 0; // 0 なら true、-1 なら false（unlimited扱い）
    }

    // 通常の制限チェック
    return quota.usage.usedInWindow >= quota.limits.effectiveLimit;

  } catch (error) {
    logger.error('Exception in isFeatureQuotaLimitReached', {
      organizationId,
      featureKey,
      error: error instanceof Error ? error.message : String(error),
    });
    // 例外時も fail-open
    return false;
  }
}