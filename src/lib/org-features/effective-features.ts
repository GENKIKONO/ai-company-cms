/**
 * 組織機能制御の統一入口モジュール
 * 
 * Supabase の get_effective_org_features(org_id) を中心とした
 * 機能ON/OFF・制限値チェックの統一インターフェース
 * 
 * NOTE: [既存正規ルート候補]
 * - canUseFeature(orgId, featureKey): 機能利用可否をDB経由で非同期取得
 * - getFeatureLimit(orgId, featureKey): 機能制限値を取得
 * - getFeatureLevel(orgId, featureKey): 機能レベル(basic/advanced)を取得
 * - 内部でget_effective_org_features RPCを呼び、plan_features + entitlementsをマージ
 */

// NOTE: [CLIENT_IMPORT_CHAIN_FIX] server-only モジュールを静的インポートすると
// クライアントコンポーネントからインポートされた場合にビルドエラーになる。
// webpackIgnore を使用してビルド時のモジュール解析を回避する。
import { PLAN_LIMITS, PLAN_FEATURE_MAP, type PlanType } from '@/config/plans';

// 動的インポートヘルパー（webpackIgnore でビルド時解析を回避）
const getSupabaseAdmin = async () => {
  if (typeof window !== 'undefined') {
    throw new Error('getSupabaseAdmin can only be called on the server side');
  }
  const mod = await import(/* webpackIgnore: true */ '@/lib/supabase-admin-client');
  return mod.supabaseAdmin;
};

const getSupabaseClient = async () => {
  if (typeof window !== 'undefined') {
    throw new Error('getSupabaseClient can only be called on the server side');
  }
  const mod = await import(/* webpackIgnore: true */ '@/lib/supabase/server');
  return mod.createClient();
};
import { logger } from '@/lib/utils/logger';
import type { 
  FeatureKey, 
  FeatureConfig, 
  FeatureControlType,
  NormalizedFeatureConfig,
  NormalizedFeatureMap,
  OnOffFeatureConfig,
  LimitNumberFeatureConfig,
  PlanFeatureRow,
  FeatureRegistryRow,
  EffectiveOrgFeaturesResponse,
  RpcFeatureConfig,
  SupabaseFeatureKey
} from '@/types/features';

// Re-export 型定義（下位互換性のため）
export type { FeatureKey, FeatureConfig } from '@/types/features';

// TODO: [SUPABASE_ALIGNMENT] 下記は Supabase の実データ構造に合わせて段階移行中
// Phase 3-C: 型定義を統一、Phase 3-D: 実装ロジック移行予定

// =============================================================================
// Supabase データ正規化ヘルパー関数
// =============================================================================

/**
 * plan_features テーブルの行データを正規化された設定に変換
 * @param row plan_features テーブルの1行
 * @param controlType feature_registry から取得した control_type
 * @returns 正規化された機能設定
 */
export function normalizePlanFeatureRow(
  row: PlanFeatureRow, 
  controlType: FeatureControlType
): NormalizedFeatureConfig {
  const { config_value } = row;

  if (controlType === 'on_off') {
    return {
      controlType: 'on_off',
      enabled: Boolean(config_value?.enabled)
    };
  }

  if (controlType === 'limit_number') {
    const limit = typeof config_value?.limit === 'number' ? config_value.limit : 0;
    return {
      controlType: 'limit_number',
      limit,
      unlimited: limit === -1
    };
  }

  // フォールバック（予期しない control_type）
  logger.warn('Unknown control_type in normalizePlanFeatureRow', {
    featureKey: row.feature_key,
    controlType,
    configValue: config_value
  });
  
  return {
    controlType: 'on_off',
    enabled: false
  };
}

/**
 * plan_features 行群とオーバーライド設定をマージ
 * @param planRows plan_features テーブルの行群
 * @param entitlements organizations.entitlements (JSONB)
 * @param featureFlags organizations.feature_flags (JSONB)
 * @param registry feature_registry の情報（control_type 取得用）
 * @returns 正規化された機能設定マップ
 */
export function mergePlanFeaturesWithOverrides(
  planRows: PlanFeatureRow[],
  entitlements: Record<string, any>,
  featureFlags: Record<string, any>,
  registry: Record<FeatureKey, FeatureControlType>
): NormalizedFeatureMap {
  const features: NormalizedFeatureMap = {};

  // 1. plan_features から基本設定を構築
  for (const row of planRows) {
    const controlType = registry[row.feature_key];
    if (!controlType) {
      logger.warn('Missing control_type for feature in registry', {
        featureKey: row.feature_key
      });
      continue;
    }

    features[row.feature_key] = normalizePlanFeatureRow(row, controlType);
  }

  // TODO: [OVERRIDE_IMPLEMENTATION] entitlements / feature_flags による上書きロジック
  // 現時点では基本実装のみ、将来的に下記を実装予定：
  // 2. entitlements による組織固有上書き
  // 3. feature_flags による個別機能上書き
  // 既存挙動を変えないため、今は plan_features ベースのみ返却

  logger.debug('mergePlanFeaturesWithOverrides completed', {
    planRowCount: planRows.length,
    featuresCount: Object.keys(features).length,
    entitlementsKeys: Object.keys(entitlements || {}),
    featureFlagsKeys: Object.keys(featureFlags || {})
  });

  return features;
}

// =============================================================================
// get_effective_org_features RPC インターフェース
// =============================================================================

// RPC結果の拡張型（エラー情報を含む）
export interface FetchOrgFeaturesResult {
  data?: EffectiveOrgFeaturesResponse;
  error?: {
    type: 'permission' | 'not_found' | 'network' | 'unknown';
    message: string;
    code?: string;
  };
}

/**
 * Supabase の get_effective_org_features RPC を呼び出して組織の効果的機能設定を取得
 * @param organizationId 組織UUID
 * @returns RPC応答データまたはエラー情報
 */
export async function fetchEffectiveOrgFeatures(
  organizationId: string
): Promise<FetchOrgFeaturesResult> {
  try {
    const supabase = await getSupabaseClient();

    const { data, error } = await supabase.rpc('get_effective_org_features', {
      p_org_id: organizationId,
    });

    if (error) {
      // 42501: insufficient_privilege (RLS権限エラー)
      if (error.code === '42501') {
        logger.warn('RLS permission error in fetchEffectiveOrgFeatures', {
          organizationId,
          error: error.message,
          code: error.code,
        });
        return {
          error: {
            type: 'permission',
            message: 'この組織の機能情報にアクセスする権限がありません',
            code: error.code,
          }
        };
      }

      // その他のエラー
      logger.warn('Failed to fetch effective org features via RPC', {
        organizationId,
        error: error.message,
        code: error.code,
      });
      return {
        error: {
          type: 'unknown',
          message: '機能情報の取得に失敗しました',
          code: error.code,
        }
      };
    }

    if (!data) {
      return {
        error: {
          type: 'not_found',
          message: '組織の機能情報が見つかりません',
        }
      };
    }

    logger.debug('Successfully fetched effective org features via RPC', {
      organizationId,
      plan: data?.plan,
      featureCount: Object.keys(data?.features || {}).length,
    });

    return { data: data as EffectiveOrgFeaturesResponse };

  } catch (error) {
    logger.error('Exception in fetchEffectiveOrgFeatures', {
      organizationId,
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
 * RPC応答を NormalizedFeatureMap 形式に変換
 * @param response get_effective_org_features の戻り値
 * @returns 正規化された機能設定マップ
 */
export function normalizeEffectiveOrgFeaturesResponse(
  response: EffectiveOrgFeaturesResponse
): Record<SupabaseFeatureKey, NormalizedFeatureConfig> {
  const normalized: Record<string, NormalizedFeatureConfig> = {};

  for (const [featureKey, config] of Object.entries(response.features)) {
    // RPC の戻り値から source フィールドを除いて NormalizedFeatureConfig に変換
    if (config.controlType === 'on_off') {
      normalized[featureKey] = {
        controlType: 'on_off',
        enabled: config.enabled,
      };
    } else if (config.controlType === 'limit_number') {
      normalized[featureKey] = {
        controlType: 'limit_number',
        limit: config.limit,
        unlimited: config.limit === -1,
      };
    }
  }

  return normalized as Record<SupabaseFeatureKey, NormalizedFeatureConfig>;
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
    // 1. 新しいRPCヘルパーを使用してSupabase RPC呼び出しを試行
    logger.debug('Fetching effective org features from Supabase via new RPC helper', undefined, context);
    
    const rpcResult = await fetchEffectiveOrgFeatures(orgId);
    
    if (rpcResult.data) {
      // RPC成功時：normalizeEffectiveOrgFeaturesResponse で正規化
      logger.debug('Successfully fetched effective org features from RPC, normalizing response', undefined, context);
      
      const normalizedFeatures = normalizeEffectiveOrgFeaturesResponse(rpcResult.data);
      
      // 既存のFeatureConfigフォーマットに変換（下位互換性のため）
      const features: Partial<Record<FeatureKey, FeatureConfig>> = {};
      
      for (const [featureKey, config] of Object.entries(normalizedFeatures)) {
        if (config.controlType === 'on_off') {
          features[featureKey as FeatureKey] = {
            enabled: config.enabled,
          };
        } else if (config.controlType === 'limit_number') {
          features[featureKey as FeatureKey] = {
            enabled: config.limit > 0 || config.unlimited,
            limit: config.unlimited ? null : config.limit,
          };
        }
      }

      logger.debug('Successfully processed RPC response', { 
        featuresCount: Object.keys(features).length,
        rpcPlan: rpcResult.data.plan 
      }, context);

      return {
        features,
        _meta: {
          source: 'rpc',
          retrieved_at: new Date().toISOString(),
          organization_id: orgId,
        }
      };
    } else if (rpcResult.error) {
      // RPC失敗時：エラー情報をログ出力してフォールバック処理
      if (rpcResult.error.type === 'permission') {
        logger.warn('RLS permission error, falling back to entitlements', { error: rpcResult.error }, context);
      } else {
        logger.warn('RPC error, falling back to entitlements', { error: rpcResult.error }, context);
      }
      return await getEffectiveOrgFeaturesFromEntitlements(orgId);
    } else {
      // 予期しない状態
      logger.warn('Unexpected RPC result, falling back to entitlements', undefined, context);
      return await getEffectiveOrgFeaturesFromEntitlements(orgId);
    }

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

    const supabaseAdmin = await getSupabaseAdmin();
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

// =============================================================================
// Phase 3-D: 組織データベース同期API（RPC+フォールバック）
// =============================================================================

/**
 * 組織データから機能利用可否を判定（RPC優先、同期フォールバック付き）
 * 
 * NOTE: [RPC_INTEGRATION] 
 * 1. まず fetchEffectiveOrgFeatures(organization.id) でRPC呼び出し
 * 2. 成功したら RPC結果を使用
 * 3. 失敗したら canUseFeatureFromOrg(organization, key) でフォールバック
 * 
 * @param organization Supabase organizations テーブルの行データ
 * @param key 機能キー
 * @returns 機能が利用可能かどうか
 */
export async function canUseFeatureFromOrgAsync(
  organization: { id: string; plan?: string | null; feature_flags?: any } | null | undefined,
  key: FeatureKey,
): Promise<boolean> {
  const context = { organizationId: organization?.id, featureKey: key, component: 'canUseFeatureFromOrgAsync' };
  
  // 組織データが無効の場合は早期リターン
  if (!organization?.id) {
    logger.warn('Invalid organization data in canUseFeatureFromOrgAsync', { organization }, context);
    return false;
  }

  try {
    // 1. RPC呼び出しを試行
    const rpcResult = await fetchEffectiveOrgFeatures(organization.id);
    
    if (rpcResult.data) {
      const normalizedFeatures = normalizeEffectiveOrgFeaturesResponse(rpcResult.data);
      const featureConfig = normalizedFeatures[key as SupabaseFeatureKey];
      
      if (featureConfig) {
        if (featureConfig.controlType === 'on_off') {
          logger.debug('Feature availability determined via RPC (on_off)', { 
            key, 
            enabled: featureConfig.enabled 
          }, context);
          return featureConfig.enabled;
        } else if (featureConfig.controlType === 'limit_number') {
          const available = featureConfig.limit > 0 || featureConfig.unlimited;
          logger.debug('Feature availability determined via RPC (limit_number)', { 
            key, 
            limit: featureConfig.limit,
            unlimited: featureConfig.unlimited,
            available 
          }, context);
          return available;
        }
      }
      
      // RPC応答にキーが含まれていない場合は false
      logger.debug('Feature key not found in RPC response', { key }, context);
      return false;
    }

    // 2. RPC失敗時（権限エラーを含む）：sync版の features.ts の関数にフォールバック
    if (rpcResult.error) {
      if (rpcResult.error.type === 'permission') {
        logger.debug('RLS permission error, falling back to sync logic', { error: rpcResult.error }, context);
      } else {
        logger.debug('RPC error, falling back to sync logic', { error: rpcResult.error }, context);
      }
    } else {
      logger.debug('RPC failed, falling back to sync logic', undefined, context);
    }
    const { canUseFeatureFromOrg } = await import('./features');
    return canUseFeatureFromOrg(organization as any, key);

  } catch (error) {
    logger.error('Error in canUseFeatureFromOrgAsync, falling back to sync logic', error, context);
    
    // 例外発生時もsync版にフォールバック
    try {
      const { canUseFeatureFromOrg } = await import('./features');
      return canUseFeatureFromOrg(organization as any, key);
    } catch (fallbackError) {
      logger.error('Fallback sync logic also failed', fallbackError, context);
      return false; // 最終的に安全側で false
    }
  }
}

/**
 * 複数の機能フラグを一括取得（RPC優先、同期フォールバック付き）
 * 
 * @param organization Supabase organizations テーブルの行データ
 * @param keys 取得したい機能キーの配列
 * @returns 各キーの boolean 値のマップ
 */
export async function getMultipleFeatureFlagsFromOrgAsync(
  organization: { id: string; plan?: string | null; feature_flags?: any } | null | undefined,
  keys: FeatureKey[],
): Promise<Record<FeatureKey, boolean>> {
  const context = { organizationId: organization?.id, keysCount: keys.length, component: 'getMultipleFeatureFlagsFromOrgAsync' };
  
  // 組織データが無効の場合は全てfalse
  if (!organization?.id) {
    const result = {} as Record<FeatureKey, boolean>;
    keys.forEach(key => { result[key] = false; });
    return result;
  }

  try {
    // 1. RPC呼び出しを試行
    const rpcResult = await fetchEffectiveOrgFeatures(organization.id);
    
    if (rpcResult.data) {
      const normalizedFeatures = normalizeEffectiveOrgFeaturesResponse(rpcResult.data);
      const result = {} as Record<FeatureKey, boolean>;
      
      for (const key of keys) {
        const featureConfig = normalizedFeatures[key as SupabaseFeatureKey];
        
        if (featureConfig) {
          if (featureConfig.controlType === 'on_off') {
            result[key] = featureConfig.enabled;
          } else if (featureConfig.controlType === 'limit_number') {
            result[key] = featureConfig.limit > 0 || featureConfig.unlimited;
          } else {
            result[key] = false;
          }
        } else {
          result[key] = false; // RPC応答にキーが含まれていない
        }
      }
      
      logger.debug('Multiple feature flags determined via RPC', { 
        keysProcessed: keys.length,
        trueCount: Object.values(result).filter(Boolean).length
      }, context);
      
      return result;
    }

    // 2. RPC失敗時（権限エラーを含む）：sync版の features.ts の関数にフォールバック
    if (rpcResult.error) {
      if (rpcResult.error.type === 'permission') {
        logger.debug('RLS permission error, falling back to sync logic for multiple flags', { error: rpcResult.error }, context);
      } else {
        logger.debug('RPC error, falling back to sync logic for multiple flags', { error: rpcResult.error }, context);
      }
    } else {
      logger.debug('RPC failed, falling back to sync logic for multiple flags', undefined, context);
    }
    const { getMultipleFeatureFlagsFromOrg } = await import('./features');
    return getMultipleFeatureFlagsFromOrg(organization as any, keys);

  } catch (error) {
    logger.error('Error in getMultipleFeatureFlagsFromOrgAsync, falling back to sync logic', error, context);
    
    // 例外発生時もsync版にフォールバック
    try {
      const { getMultipleFeatureFlagsFromOrg } = await import('./features');
      return getMultipleFeatureFlagsFromOrg(organization as any, keys);
    } catch (fallbackError) {
      logger.error('Fallback sync logic also failed', fallbackError, context);
      // 最終的に全てfalseで安全側リターン
      const result = {} as Record<FeatureKey, boolean>;
      keys.forEach(key => { result[key] = false; });
      return result;
    }
  }
}

// TODO: [UNIFICATION_ROADMAP] Phase 3-B 統一化拡張計画:
// 1. AI面接クレジット統合: interview-credits.ts の MONTHLY_INTERVIEW_LIMITS を plan_features に移行
//    - 新機能キー: 'ai_interview_credits' (limit値 = 月間セッション数)
//    - price_id マッピングロジックは migration ヘルパーとして保持
// 
// 2. 埋め込み制限統合: embed.ts の EMBED_LIMITS を plan_features に移行  
//    - 新機能キー: 'embed_widgets', 'embed_monthly_views', 'embed_rate_limit'
//    - 3階層マッピング (free/standard/enterprise) は getEmbedLimits で維持
//
// 3. 汎用制限メッセージ生成の統合: plans.ts の getGenericLimitMessage を統合
//    - 新関数: getFeatureLimitMessage(orgId, featureKey, currentCount)
//    - 既存の個別メッセージ関数は wrapper として保持