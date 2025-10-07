/**
 * Server-side organization data fetching
 * ✅ FIXED: Separates user-dependent data from cache to avoid header/auth issues
 */

import { unstable_cache } from 'next/cache';
import { supabaseServer } from '@/lib/supabase-server';
import type { Organization } from '@/types/database';

/**
 * Direct organization fetch by user ID (no cache, for cache functions)
 * ✅ Does NOT call headers() or auth.getUser() inside
 */
export async function getOrganizationByUserId(userId: string): Promise<Organization | null> {
  try {
    console.log('[getOrganizationByUserId] Fetching for user:', userId);
    
    const supabase = await supabaseServer();
    
    // Direct query without auth calls - we already have userId
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('created_by', userId)
      .maybeSingle();

    if (error) {
      console.error('[getOrganizationByUserId] Query error:', error);
      return null;
    }

    console.log('[getOrganizationByUserId] Found org:', data ? { id: data.id, name: data.name, api_key: !!data.api_key } : null);
    return data;
  } catch (error) {
    console.error('[getOrganizationByUserId] Unexpected error:', error);
    return null;
  }
}

/**
 * Cached version of organization fetch
 * ✅ FIXED: Uses stable userId-based cache key, no auth calls inside
 */
export const getOrganizationCached = unstable_cache(
  async (userId: string) => {
    console.log('[VERIFY] getOrganizationCached - Cache MISS for user:', userId);
    const result = await getOrganizationByUserId(userId);
    console.log('[VERIFY] getOrganizationCached - Cache MISS result:', {
      hasOrg: !!result,
      orgId: result?.id,
      orgName: result?.name
    });
    return result;
  },
  (userId: string) => [`org:${userId}`],
  { 
    revalidate: 300, // 5 minute fallback
    tags: (userId: string) => [`org:${userId}`] 
  }
);

/**
 * Safe organization fetch with proper error handling
 * ✅ FIXED: Takes userId as parameter, no internal auth calls
 */
export async function getOrganizationSafe(userId: string, useCache: boolean = true): Promise<{
  data: Organization | null;
  error?: string;
}> {
  try {
    if (!userId) {
      return { data: null, error: 'No user ID provided' };
    }

    const organization = useCache 
      ? await getOrganizationCached(userId)
      : await getOrganizationByUserId(userId);

    return { data: organization };
  } catch (error) {
    console.error('[getOrganizationSafe] Error:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get current user and their organization (for dashboard use)
 * ✅ FIXED: Handles auth at the top level, then uses cached data
 */
export async function getCurrentUserOrganization(): Promise<{
  user: any | null;
  organization: Organization | null;
  error?: string;
}> {
  try {
    console.log('[VERIFY] getCurrentUserOrganization called - cache fix active');
    const supabase = await supabaseServer();
    
    // Auth check at top level (not inside cache)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('[VERIFY] getCurrentUserOrganization - no auth:', { authError: authError?.message });
      return { 
        user: null, 
        organization: null, 
        error: 'Not authenticated' 
      };
    }

    console.log('[VERIFY] getCurrentUserOrganization - user found:', user.id);

    // Now fetch organization using cached function
    const { data: organization, error: orgError } = await getOrganizationSafe(user.id, true);

    console.log('[VERIFY] getCurrentUserOrganization - result:', {
      hasUser: !!user,
      hasOrg: !!organization,
      orgName: organization?.name,
      orgId: organization?.id,
      apiKey: organization?.api_key ? 'present' : 'missing',
      error: orgError
    });

    return { 
      user, 
      organization, 
      error: orgError 
    };
  } catch (error) {
    console.error('[getCurrentUserOrganization] Error:', error);
    return { 
      user: null, 
      organization: null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}