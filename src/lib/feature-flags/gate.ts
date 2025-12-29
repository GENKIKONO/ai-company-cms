import { vLog, vErr } from '@/lib/utils/logger';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveFeatures, getFeatureEnabled } from '@/lib/featureGate';

export type FeatureKey = 'monitoring' | 'business_matching_beta' | 'advanced_embed' | 'service_gallery' | 'service_video';

interface OrganizationForGate {
  id: string;
  plan?: string;
  entitlements?: Record<string, any>;
}

// Legacy feature key mapping to effective-features FeatureKey
const LEGACY_KEY_MAPPING: Record<FeatureKey, string> = {
  monitoring: 'system_monitoring',
  business_matching_beta: 'business_matching',
  advanced_embed: 'embeds',
  service_gallery: 'service_gallery',
  service_video: 'service_video',
};

// Environment-based allowlists
const ALLOWLISTS: Record<FeatureKey, string[]> = {
  monitoring: (process.env.FEATURE_ALLOWLIST_MONITORING || '').split(',').filter(Boolean),
  business_matching_beta: (process.env.FEATURE_ALLOWLIST_BM_BETA || '').split(',').filter(Boolean),
  advanced_embed: (process.env.FEATURE_ALLOWLIST_ADVANCED_EMBED || '').split(',').filter(Boolean),
  service_gallery: (process.env.FEATURE_ALLOWLIST_SERVICE_GALLERY || '').split(',').filter(Boolean),
  service_video: (process.env.FEATURE_ALLOWLIST_SERVICE_VIDEO || '').split(',').filter(Boolean),
};

export async function hasEntitlement(orgId: string, key: FeatureKey): Promise<boolean> {
  try {
    // Check allowlist first (既存の環境変数ベース許可リストを維持)
    const allowlistHit = ALLOWLISTS[key].includes(orgId);
    
    if (allowlistHit) {
      vLog('[Gate]', { orgId, key, allowlistHit: true, source: 'allowlist', effectiveFeaturesUsed: false });
      return true;
    }

    // Map legacy key to effective-features FeatureKey
    const mappedFeatureKey = LEGACY_KEY_MAPPING[key];
    
    if (!mappedFeatureKey) {
      vErr('[Gate] Unknown legacy feature key, returning false for safety', { orgId, legacyKey: key });
      return false;
    }

    // Use effective-features for feature check (DB-driven with fallbacks)
    const supabase = await createClient();
    const features = await getEffectiveFeatures(supabase, { type: 'org', id: orgId });
    const hasAccess = getFeatureEnabled(features, mappedFeatureKey);
    
    vLog('[Gate]', { 
      orgId, 
      legacyKey: key, 
      mappedFeatureKey,
      allowlistHit: false, 
      hasAccess,
      source: 'effective-features',
      effectiveFeaturesUsed: true
    });

    return hasAccess;

  } catch (error) {
    vErr('[Gate] Error checking entitlement via effective-features, returning false for safety:', { 
      orgId, 
      legacyKey: key, 
      mappedFeatureKey: LEGACY_KEY_MAPPING[key],
      error 
    });
    return false;
  }
}

// Client-side variant that uses existing org data
// TODO: 非同期版へ移行予定 - 暫定の後方互換用として残存
export function hasEntitlementSync(org: OrganizationForGate | null, key: FeatureKey): boolean {
  if (!org) return false;

  // Check allowlist
  const allowlistHit = ALLOWLISTS[key].includes(org.id);
  
  if (allowlistHit) {
    vLog('[Gate][Sync]', { 
      orgId: org.id, 
      legacyKey: key, 
      allowlistHit: true, 
      entitlementsHit: false, 
      plan: org.plan || 'unknown',
      note: 'DEPRECATED: use hasEntitlement async version' 
    });
    return true;
  }

  // Check entitlements (organizations.entitlements 直参照 - レガシー実装)
  const entitlementsHit = org.entitlements && org.entitlements[key] === true;
  
  vLog('[Gate][Sync]', { 
    orgId: org.id, 
    legacyKey: key,
    allowlistHit: false, 
    entitlementsHit: !!entitlementsHit, 
    plan: org.plan || 'unknown',
    note: 'DEPRECATED: use hasEntitlement async version, still using organizations.entitlements direct access'
  });

  return !!entitlementsHit;
}