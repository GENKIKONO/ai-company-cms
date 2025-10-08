import { supabaseBrowser } from '@/lib/supabase-client';
import { vLog, vErr } from '@/lib/utils/logger';

export type FeatureKey = 'monitoring' | 'business_matching_beta' | 'advanced_embed';

interface OrganizationForGate {
  id: string;
  plan?: string;
  entitlements?: Record<string, any>;
}

// Environment-based allowlists
const ALLOWLISTS: Record<FeatureKey, string[]> = {
  monitoring: (process.env.FEATURE_ALLOWLIST_MONITORING || '').split(',').filter(Boolean),
  business_matching_beta: (process.env.FEATURE_ALLOWLIST_BM_BETA || '').split(',').filter(Boolean),
  advanced_embed: (process.env.FEATURE_ALLOWLIST_ADVANCED_EMBED || '').split(',').filter(Boolean),
};

export async function hasEntitlement(orgId: string, key: FeatureKey): Promise<boolean> {
  try {
    // Check allowlist first
    const allowlistHit = ALLOWLISTS[key].includes(orgId);
    
    if (allowlistHit) {
      vLog('[Gate]', { orgId, key, allowlistHit: true, entitlementsHit: false, plan: 'allowlist' });
      return true;
    }

    // Fetch organization entitlements
    const { data: org, error } = await supabaseBrowser
      .from('organizations')
      .select('id, plan, entitlements')
      .eq('id', orgId)
      .single();

    if (error || !org) {
      vLog('[Gate]', { orgId, key, allowlistHit: false, entitlementsHit: false, plan: 'not_found', error });
      return false;
    }

    // Check entitlements JSONB
    const entitlementsHit = org.entitlements && org.entitlements[key] === true;
    
    vLog('[Gate]', { 
      orgId, 
      key, 
      allowlistHit: false, 
      entitlementsHit: !!entitlementsHit, 
      plan: org.plan 
    });

    return !!entitlementsHit;
  } catch (error) {
    vErr('[Gate] Error checking entitlement:', { orgId, key, error });
    return false;
  }
}

// Client-side variant that uses existing org data
export function hasEntitlementSync(org: OrganizationForGate | null, key: FeatureKey): boolean {
  if (!org) return false;

  // Check allowlist
  const allowlistHit = ALLOWLISTS[key].includes(org.id);
  
  if (allowlistHit) {
    vLog('[Gate][Sync]', { orgId: org.id, key, allowlistHit: true, entitlementsHit: false, plan: org.plan || 'unknown' });
    return true;
  }

  // Check entitlements
  const entitlementsHit = org.entitlements && org.entitlements[key] === true;
  
  vLog('[Gate][Sync]', { 
    orgId: org.id, 
    key, 
    allowlistHit: false, 
    entitlementsHit: !!entitlementsHit, 
    plan: org.plan || 'unknown'
  });

  return !!entitlementsHit;
}