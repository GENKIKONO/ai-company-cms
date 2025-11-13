/**
 * Organization permission utilities
 * Helper functions for checking organization permissions
 */

import { supabaseAdmin } from '@/lib/supabase-admin-client';
import { logger } from '@/lib/log';

/**
 * Check if user is admin of specific organization
 * Equivalent to is_user_admin_of_org function
 */
export async function isUserAdminOfOrg(orgId: string, userId?: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .rpc('has_organization_role', {
        org_id: orgId,
        required_role: 'admin',
        user_id: userId
      });

    if (error) {
      logger.error('Error checking organization admin role', {
        component: 'org-permissions',
        orgId,
        userId,
        error: error.message
      });
      return false;
    }

    return Boolean(data);
  } catch (error: any) {
    logger.error('Unexpected error checking organization admin role', {
      component: 'org-permissions',
      orgId,
      userId,
      error: error.message
    });
    return false;
  }
}

/**
 * Get user's organization memberships
 */
export async function getUserOrganizations(userId: string): Promise<Array<{organization_id: string, role: string}>> {
  try {
    const { data, error } = await supabaseAdmin
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', userId);

    if (error) {
      logger.error('Error getting user organizations', {
        component: 'org-permissions',
        userId,
        error: error.message
      });
      return [];
    }

    return data || [];
  } catch (error: any) {
    logger.error('Unexpected error getting user organizations', {
      component: 'org-permissions',
      userId,
      error: error.message
    });
    return [];
  }
}

/**
 * Check if user has any admin role in any organization
 */
export async function isUserOrgAdmin(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from('organization_members')
      .select('role')
      .eq('user_id', userId)
      .in('role', ['admin', 'owner']);

    if (error) {
      logger.error('Error checking user org admin status', {
        component: 'org-permissions',
        userId,
        error: error.message
      });
      return false;
    }

    return Boolean(data && data.length > 0);
  } catch (error: any) {
    logger.error('Unexpected error checking user org admin status', {
      component: 'org-permissions',
      userId,
      error: error.message
    });
    return false;
  }
}