/**
 * 組織機能制御の統一入口モジュール
 * 
 * Supabase の get_effective_org_features(org_id) を中心とした
 * 機能ON/OFF・制限値チェックの統一インターフェース
 */

import { supabaseAdmin } from '@/lib/supabase-admin-client';
import { PLAN_LIMITS, PLAN_FEATURE_MAP, type PlanType } from '@/config/plans';
import { logger } from '@/lib/utils/logger';

// =============================================================================
// 型定義
// =============================================================================

/**
 * 機能キー型定義（feature_registry.feature_key に対応）
 * DB側のfeature_keyと整合性を保つため、実際のDB値と合わせる必要あり
 */
export type FeatureKey = 
  | 'system_monitoring'
  | 'ai_reports' 
  | 'ai_visibility'
  | 'business_matching'
  | 'embeds'
  | 'service_gallery'
  | 'service_video'
  | 'faq_module'
  | 'materials'
  | 'case_studies'
  | 'services'
  | 'qa_items'
  | 'posts'
  | 'verified_badge'
  | 'approval_flow'
  | 'team_management';

/**
 * 機能設定構造（柔軟性を重視）
 * plan_features.config_value(jsonb) から得られる値を想定
 */
export interface FeatureConfig {
  enabled: boolean;
  limit?: number | null;
  level?: string | null;
  limits?: any; // 複雑な構造は一旦anyで受ける
  [key: string]: any; // 将来の拡張に備えて柔軟に
}

/**
 * 組織の効果的機能設定（RPC応答構造）
 */
export interface EffectiveOrgFeatures {
  features: Partial<Record<FeatureKey, FeatureConfig>>;
  _meta?: {
    source: 'rpc' | 'entitlements_fallback' | 'plan_limits_fallback';
    retrieved_at: string;
    organization_id: string;
    warnings?: string[];
  };
}

// =============================================================================
// 機能キー正規化マッピング
// =============================================================================

/**
 * 既存のキー（entitlements / gate.ts系）を feature_id に正規化
 */
const FEATURE_KEY_MAPPING: Record<string, FeatureKey> = {
  // 既存 entitlements キー
  'monitoring': 'system_monitoring',
  'business_matching_beta': 'business_matching',
  'advanced_embed': 'embeds',
  'service_gallery': 'service_gallery',
  'service_video': 'service_video',
  
  // 静的設定キー
  'system_monitoring': 'system_monitoring',
  'ai_reports': 'ai_reports',
  'ai_visibility': 'ai_visibility',
  'faqs': 'faq_module',
  'materials': 'materials',
  'case_studies': 'case_studies',
  'services': 'services',
  'qa_items': 'qa_items',
  'posts': 'posts',
  'verified_badge': 'verified_badge',
  'approval_flow': 'approval_flow',
  'team_management': 'team_management',
};

/**
 * 機能キーを正規化（既存キー → feature_id）
 */
export function normalizeFeatureKey(key: string): FeatureKey | null {
  const normalized = FEATURE_KEY_MAPPING[key];
  if (!normalized) {
    logger.warn(`Unknown feature key: ${key}`, { key });
    return null;
  }
  return normalized;
}

// =============================================================================
// メイン関数群
// =============================================================================

/**
 * 組織の全機能設定を取得（Supabase関数経由）
 */
export async function getEffectiveOrgFeatures(orgId: string): Promise<EffectiveOrgFeatures> {
  const context = { organizationId: orgId, component: 'effective-features' };
  
  try {
    // 1. Supabase RPC呼び出しを試行
    logger.debug('Fetching effective org features from Supabase', undefined, context);
    
    const { data, error } = await supabaseAdmin.rpc('get_effective_org_features', {
      org_id: orgId
    });

    if (error) {
      logger.warn('get_effective_org_features RPC failed, trying entitlements fallback', error, context);
      return await getEffectiveOrgFeaturesFromEntitlements(orgId);
    }

    if (!data || typeof data !== 'object' || !data.features || typeof data.features !== 'object') {
      logger.warn('get_effective_org_features returned invalid data structure, trying entitlements fallback', { 
        dataType: typeof data, 
        hasFeatures: !!(data && data.features),
        featuresType: data && typeof data.features
      }, context);
      return await getEffectiveOrgFeaturesFromEntitlements(orgId);
    }

    // Supabase応答を型変換
    const features: Partial<Record<FeatureKey, FeatureConfig>> = {};
    
    for (const [featureId, config] of Object.entries(data.features)) {
      try {
        const normalizedId = normalizeFeatureKey(featureId);
        if (normalizedId && config && typeof config === 'object') {
          const configObj = config as any; // 型安全性より実行時安全性を優先
          features[normalizedId] = {
            enabled: Boolean(configObj.enabled),
            limit: typeof configObj.limit === 'number' ? configObj.limit : null,
            level: typeof configObj.level === 'string' ? configObj.level : null,
            limits: configObj.limits || undefined,
            // 未知の構造に備えて元のconfigも保存
            ...configObj
          };
        }
      } catch (error) {
        logger.warn(`Failed to process feature ${featureId} from RPC response`, error, context);
        continue;
      }
    }

    logger.debug('Successfully fetched effective org features from Supabase', { featuresCount: Object.keys(features).length }, context);

    return {
      features,
      _meta: {
        source: 'rpc',
        retrieved_at: new Date().toISOString(),
        organization_id: orgId,
      }
    };

  } catch (error) {
    logger.error('Unexpected error in getEffectiveOrgFeatures, falling back to entitlements', error, context);
    return await getEffectiveOrgFeaturesFromEntitlements(orgId);
  }
}

/**
 * フォールバック：entitlements直接読み取り
 */
async function getEffectiveOrgFeaturesFromEntitlements(orgId: string): Promise<EffectiveOrgFeatures> {
  const context = { organizationId: orgId, component: 'effective-features-fallback' };

  try {
    logger.debug('Trying entitlements fallback', undefined, context);
    
    const { data: org, error } = await supabaseAdmin
      .from('organizations')
      .select('plan, entitlements')
      .eq('id', orgId)
      .single();

    if (error || !org) {
      logger.warn('Failed to fetch organization from entitlements fallback, using static fallback', error, context);
      return getEffectiveOrgFeaturesFromStaticConfig(org?.plan || 'starter');
    }

    // entitlements + プラン標準設定から構築
    const features: Partial<Record<FeatureKey, FeatureConfig>> = {};
    const planType = (org.plan || 'starter') as PlanType;
    const entitlements = org.entitlements || {};

    // 静的プラン設定をベースに構築
    const planLimits = PLAN_LIMITS[planType];
    
    // 各機能IDについてentitlementsと静的設定をマージ
    Object.values(FEATURE_KEY_MAPPING).forEach(featureId => {
      // entitlementsから値を安全に取得（複数のキー形式をサポート）
      const entitlementValue = entitlements[featureId] 
        || entitlements[featureId.replace('_', '-')] // kebab-case variant
        || entitlements[featureId.toUpperCase()] // UPPER_CASE variant
        || undefined;
      let config: FeatureConfig;

      switch (featureId) {
        case 'system_monitoring':
          config = {
            enabled: entitlementValue?.enabled ?? planLimits.system_monitoring,
          };
          break;
        
        case 'ai_reports':
          config = {
            enabled: entitlementValue?.enabled ?? Boolean(planLimits.ai_reports),
            level: entitlementValue?.level ?? (typeof planLimits.ai_reports === 'string' ? planLimits.ai_reports : null),
          };
          break;

        case 'faq_module':
          config = {
            enabled: entitlementValue?.enabled ?? (planLimits.faqs > 0),
            limit: entitlementValue?.limit ?? (planLimits.faqs === Number.POSITIVE_INFINITY ? null : planLimits.faqs),
          };
          break;

        case 'materials':
          config = {
            enabled: entitlementValue?.enabled ?? (planLimits.materials > 0),
            limit: entitlementValue?.limit ?? (planLimits.materials === Number.POSITIVE_INFINITY ? null : planLimits.materials),
          };
          break;

        case 'case_studies':
          config = {
            enabled: entitlementValue?.enabled ?? (planLimits.case_studies > 0),
            limit: entitlementValue?.limit ?? (planLimits.case_studies === Number.POSITIVE_INFINITY ? null : planLimits.case_studies),
          };
          break;

        case 'services':
          config = {
            enabled: entitlementValue?.enabled ?? (planLimits.services > 0),
            limit: entitlementValue?.limit ?? (planLimits.services === Number.POSITIVE_INFINITY ? null : planLimits.services),
          };
          break;

        case 'qa_items':
          config = {
            enabled: entitlementValue?.enabled ?? (planLimits.qa_items > 0),
            limit: entitlementValue?.limit ?? (planLimits.qa_items === Number.POSITIVE_INFINITY ? null : planLimits.qa_items),
          };
          break;

        case 'posts':
          config = {
            enabled: entitlementValue?.enabled ?? (planLimits.posts > 0),
            limit: entitlementValue?.limit ?? (planLimits.posts === Number.POSITIVE_INFINITY ? null : planLimits.posts),
          };
          break;

        case 'embeds':
          config = {
            enabled: entitlementValue?.enabled ?? (planLimits.embeds > 0),
            limit: entitlementValue?.limit ?? (planLimits.embeds === Number.POSITIVE_INFINITY ? null : planLimits.embeds),
          };
          break;

        case 'verified_badge':
          config = {
            enabled: entitlementValue?.enabled ?? planLimits.verified_badge,
          };
          break;

        case 'approval_flow':
          config = {
            enabled: entitlementValue?.enabled ?? Boolean((planLimits as any).approval_flow),
          };
          break;

        case 'team_management':
          config = {
            enabled: entitlementValue?.enabled ?? Boolean((planLimits as any).team_management),
          };
          break;

        // その他の機能（entitlementsベース）
        default:
          config = {
            enabled: entitlementValue?.enabled ?? false,
            limit: entitlementValue?.limit ?? null,
            level: entitlementValue?.level ?? null,
          };
      }

      features[featureId] = config;
    });

    logger.debug('Successfully built effective org features from entitlements fallback', { featuresCount: Object.keys(features).length }, context);

    return {
      features,
      _meta: {
        source: 'entitlements_fallback',
        retrieved_at: new Date().toISOString(),
        organization_id: orgId,
      }
    };

  } catch (error) {
    logger.error('Entitlements fallback failed, using static fallback', error, context);
    return getEffectiveOrgFeaturesFromStaticConfig('starter');
  }
}

/**
 * 最終フォールバック：静的プラン設定のみ
 */
function getEffectiveOrgFeaturesFromStaticConfig(planType: PlanType): EffectiveOrgFeatures {
  const context = { component: 'effective-features-static-fallback' };
  logger.warn('Using plan limits fallback (last resort)', { planType }, context);
  
  const planLimits = PLAN_LIMITS[planType];
  
  // 安全にすべての機能を設定
  const features = {} as Record<FeatureKey, FeatureConfig>;
  
  features.system_monitoring = { enabled: planLimits.system_monitoring };
  features.ai_reports = { 
    enabled: Boolean(planLimits.ai_reports), 
    level: typeof planLimits.ai_reports === 'string' ? planLimits.ai_reports : null 
  };
  features.ai_visibility = { enabled: Boolean(planLimits.ai_reports) };
  features.business_matching = { enabled: false };
  features.embeds = { 
    enabled: planLimits.embeds > 0,
    limit: planLimits.embeds === Number.POSITIVE_INFINITY ? null : planLimits.embeds,
  };
  features.service_gallery = { enabled: false };
  features.service_video = { enabled: false };
  features.faq_module = { 
    enabled: planLimits.faqs > 0,
    limit: planLimits.faqs === Number.POSITIVE_INFINITY ? null : planLimits.faqs,
  };
  features.materials = { 
    enabled: planLimits.materials > 0,
    limit: planLimits.materials === Number.POSITIVE_INFINITY ? null : planLimits.materials,
  };
  features.case_studies = { 
    enabled: planLimits.case_studies > 0,
    limit: planLimits.case_studies === Number.POSITIVE_INFINITY ? null : planLimits.case_studies,
  };
  features.services = { 
    enabled: planLimits.services > 0,
    limit: planLimits.services === Number.POSITIVE_INFINITY ? null : planLimits.services,
  };
  features.qa_items = { 
    enabled: planLimits.qa_items > 0,
    limit: planLimits.qa_items === Number.POSITIVE_INFINITY ? null : planLimits.qa_items,
  };
  features.posts = { 
    enabled: planLimits.posts > 0,
    limit: planLimits.posts === Number.POSITIVE_INFINITY ? null : planLimits.posts,
  };
  features.verified_badge = { enabled: planLimits.verified_badge };
  features.approval_flow = { enabled: Boolean((planLimits as any).approval_flow) };
  features.team_management = { enabled: Boolean((planLimits as any).team_management) };

  return {
    features,
    _meta: {
      source: 'plan_limits_fallback',
      retrieved_at: new Date().toISOString(),
      organization_id: 'unknown',
    }
  };
}

// =============================================================================
// 便利な入口関数群
// =============================================================================

/**
 * 特定機能の利用可否チェック
 */
export async function canUseFeature(orgId: string, featureKey: string): Promise<boolean> {
  const normalizedKey = normalizeFeatureKey(featureKey);
  if (!normalizedKey) {
    return false;
  }

  try {
    const orgFeatures = await getEffectiveOrgFeatures(orgId);
    const featureConfig = orgFeatures.features[normalizedKey];
    
    return Boolean(featureConfig?.enabled);
  } catch (error) {
    logger.error(`Error checking feature availability: ${featureKey}`, error, { organizationId: orgId, featureKey });
    return false; // 安全側でfalse
  }
}

/**
 * 特定機能の制限値取得
 */
export async function getFeatureLimit(orgId: string, featureKey: string): Promise<number | null> {
  const normalizedKey = normalizeFeatureKey(featureKey);
  if (!normalizedKey) {
    return null;
  }

  try {
    const orgFeatures = await getEffectiveOrgFeatures(orgId);
    const featureConfig = orgFeatures.features[normalizedKey];
    
    return featureConfig?.limit ?? null;
  } catch (error) {
    logger.error(`Error checking feature limit: ${featureKey}`, error, { organizationId: orgId, featureKey });
    return 0; // 安全側で制限あり
  }
}

/**
 * 特定機能のレベル取得（basic/advanced等）
 */
export async function getFeatureLevel(orgId: string, featureKey: string): Promise<string | null> {
  const normalizedKey = normalizeFeatureKey(featureKey);
  if (!normalizedKey) {
    return null;
  }

  try {
    const orgFeatures = await getEffectiveOrgFeatures(orgId);
    const featureConfig = orgFeatures.features[normalizedKey];
    
    return featureConfig?.level ?? null;
  } catch (error) {
    logger.error(`Error checking feature level: ${featureKey}`, error, { organizationId: orgId, featureKey });
    return null;
  }
}

/**
 * 制限チェック（現在値 vs 上限値）
 */
export async function isFeatureLimitReached(
  orgId: string, 
  featureKey: string, 
  currentCount: number
): Promise<boolean> {
  const limit = await getFeatureLimit(orgId, featureKey);
  
  // limit が null = 無制限
  if (limit === null) {
    return false;
  }
  
  return currentCount >= limit;
}