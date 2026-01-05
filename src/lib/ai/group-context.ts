/**
 * AI Context Utility for Group-based Organization Resolution
 * 
 * Provides utilities to resolve organization context within enterprise groups
 * for AI operations that need to understand organizational relationships.
 */

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/log';

export interface OrganizationContext {
  id: string;
  name: string;
  company_name?: string;
  domain?: string;
  industry?: string;
  size?: string;
}

export interface GroupContext {
  id: string;
  name: string;
  description?: string;
  owner_org: OrganizationContext;
  member_orgs: OrganizationContext[];
  total_members: number;
}

export interface AIGroupScope {
  user_org: OrganizationContext;
  accessible_groups: GroupContext[];
  sibling_orgs: OrganizationContext[];
  total_scope_orgs: number;
  scope_summary: string;
}

/**
 * Get comprehensive group context for AI operations
 * @param userId - The current user's ID
 * @returns AI-friendly organization scope information
 */
export async function getAIGroupScope(userId: string): Promise<AIGroupScope | null> {
  try {
    const supabase = await createClient();

    // Get user's organization
    const { data: userOrg, error: userOrgError } = await supabase
      .from('organization_members')
      .select(`
        organization_id,
        role,
        organization:organizations!inner(
          id,
          name,
          company_name,
          domain,
          industry,
          size
        )
      `)
      .eq('user_id', userId)
      .eq('role', 'owner') // Focus on user's primary organization
      .single();

    if (userOrgError || !userOrg?.organization) {
      logger.warn('AI Group Context: User organization not found', {
        component: 'ai-group-context',
        userId,
        error: userOrgError?.message
      });
      return null;
    }

    const userOrgData = Array.isArray(userOrg.organization) ? userOrg.organization[0] : userOrg.organization;

    // Get groups where user's organization is a member
    const { data: groupMemberships, error: groupError } = await supabase
      .from('org_group_members')
      .select(`
        group_id,
        role,
        group:org_groups!org_group_members_group_id_fkey(
          id,
          name,
          description,
          owner_org:organizations!org_groups_owner_org_fkey(
            id,
            name,
            company_name,
            domain,
            industry,
            size
          )
        )
      `)
      .eq('organization_id', userOrgData.id);

    if (groupError) {
      logger.error('AI Group Context: Failed to fetch group memberships', {
        component: 'ai-group-context',
        userId,
        orgId: userOrgData.id,
        error: groupError.message
      });
      return null;
    }

    // Get all sibling organizations using the database function
    const { data: siblingOrgs, error: siblingError } = await supabase
      .rpc('get_group_sibling_orgs', { org_uuid: userOrgData.id });

    if (siblingError) {
      logger.error('AI Group Context: Failed to fetch sibling organizations', {
        component: 'ai-group-context',
        userId,
        orgId: userOrgData.id,
        error: siblingError.message
      });
    }

    // Build accessible groups with member details
    const accessibleGroups: GroupContext[] = [];
    
    for (const membership of groupMemberships || []) {
      if (!membership.group) continue;

      const groupData = membership.group as any;
      
      // Get all members of this group
      const { data: groupMembers } = await supabase
        .from('org_group_members')
        .select(`
          organization:organizations!org_group_members_org_id_fkey(
            id,
            name,
            company_name,
            domain,
            industry,
            size
          )
        `)
        .eq('group_id', groupData.id);

      const memberOrgs = (groupMembers || [])
        .map(m => Array.isArray(m.organization) ? m.organization[0] : m.organization)
        .filter(org => org && org.id !== userOrgData.id) as OrganizationContext[];

      accessibleGroups.push({
        id: groupData.id,
        name: groupData.name,
        description: groupData.description,
        owner_org: groupData.owner_org,
        member_orgs: memberOrgs,
        total_members: (groupMembers || []).length
      });
    }

    // Collect unique sibling organizations
    const siblingOrgMap = new Map<string, OrganizationContext>();
    
    for (const sibling of siblingOrgs || []) {
      // Get full organization details for siblings
      const { data: orgDetails } = await supabase
        .from('organizations')
        .select('id, name, company_name, domain, industry, size')
        .eq('id', sibling.organization_id)
        .single();

      if (orgDetails) {
        siblingOrgMap.set(orgDetails.id, orgDetails);
      }
    }

    const uniqueSiblingOrgs = Array.from(siblingOrgMap.values());

    // Generate scope summary
    const scopeSummary = generateScopeSummary(userOrgData, accessibleGroups, uniqueSiblingOrgs);

    const result: AIGroupScope = {
      user_org: userOrgData,
      accessible_groups: accessibleGroups,
      sibling_orgs: uniqueSiblingOrgs,
      total_scope_orgs: uniqueSiblingOrgs.length + 1, // +1 for user's own org
      scope_summary: scopeSummary
    };

    logger.info('AI Group Context: Scope generated successfully', {
      component: 'ai-group-context',
      userId,
      orgId: userOrgData.id,
      orgName: userOrgData.name,
      accessibleGroups: accessibleGroups.length,
      siblingOrgs: uniqueSiblingOrgs.length,
      totalScopeOrgs: result.total_scope_orgs
    });

    return result;

  } catch (error: any) {
    logger.error('AI Group Context: Unexpected error', {
      component: 'ai-group-context',
      userId,
      error: error.message,
      stack: error.stack
    });
    return null;
  }
}

/**
 * Get organizations within specific group for AI context
 * @param groupId - The group ID to get organizations for
 * @returns Organizations within the specified group
 */
export async function getGroupOrganizations(groupId: string): Promise<OrganizationContext[]> {
  try {
    const supabase = await createClient();

    const { data: members, error } = await supabase
      .from('org_group_members')
      .select(`
        organization:organizations!org_group_members_org_id_fkey(
          id,
          name,
          company_name,
          domain,
          industry,
          size
        )
      `)
      .eq('group_id', groupId);

    if (error) {
      logger.error('AI Group Context: Failed to fetch group organizations', {
        component: 'ai-group-context',
        groupId,
        error: error.message
      });
      return [];
    }

    const organizations = (members || [])
      .map(m => Array.isArray(m.organization) ? m.organization[0] : m.organization)
      .filter(org => org) as OrganizationContext[];

    logger.info('AI Group Context: Group organizations retrieved', {
      component: 'ai-group-context',
      groupId,
      organizationCount: organizations.length
    });

    return organizations;

  } catch (error: any) {
    logger.error('AI Group Context: Unexpected error fetching group organizations', {
      component: 'ai-group-context',
      groupId,
      error: error.message,
      stack: error.stack
    });
    return [];
  }
}

/**
 * Check if user can access organization data through group membership
 * @param userId - The user ID to check
 * @param targetOrgId - The organization ID to check access for
 * @returns Boolean indicating access permission
 */
export async function canUserAccessOrganization(
  userId: string, 
  targetOrgId: string
): Promise<boolean> {
  try {
    const scope = await getAIGroupScope(userId);
    
    if (!scope) {
      return false;
    }

    // User can access their own organization
    if (scope.user_org.id === targetOrgId) {
      return true;
    }

    // User can access sibling organizations through group membership
    return scope.sibling_orgs.some(org => org.id === targetOrgId);

  } catch (error: any) {
    logger.error('AI Group Context: Error checking organization access', {
      component: 'ai-group-context',
      userId,
      targetOrgId,
      error: error.message
    });
    return false;
  }
}

/**
 * Get filtered organization list for AI context based on group permissions
 * @param userId - The user ID for permission context
 * @param organizationIds - List of organization IDs to filter
 * @returns Filtered list of accessible organizations
 */
export async function getAccessibleOrganizations(
  userId: string,
  organizationIds: string[]
): Promise<OrganizationContext[]> {
  try {
    const scope = await getAIGroupScope(userId);
    
    if (!scope) {
      return [];
    }

    const accessibleIds = new Set([
      scope.user_org.id,
      ...scope.sibling_orgs.map(org => org.id)
    ]);

    const supabase = await createClient();
    
    const filteredIds = organizationIds.filter(id => accessibleIds.has(id));
    
    if (filteredIds.length === 0) {
      return [];
    }

    const { data: organizations, error } = await supabase
      .from('organizations')
      .select('id, name, company_name, domain, industry, size')
      .in('id', filteredIds);

    if (error) {
      logger.error('AI Group Context: Failed to fetch accessible organizations', {
        component: 'ai-group-context',
        userId,
        requestedIds: organizationIds.length,
        filteredIds: filteredIds.length,
        error: error.message
      });
      return [];
    }

    logger.info('AI Group Context: Filtered accessible organizations', {
      component: 'ai-group-context',
      userId,
      requestedCount: organizationIds.length,
      accessibleCount: organizations?.length || 0
    });

    return organizations || [];

  } catch (error: any) {
    logger.error('AI Group Context: Error filtering accessible organizations', {
      component: 'ai-group-context',
      userId,
      error: error.message
    });
    return [];
  }
}

/**
 * Generate human-readable scope summary for AI context
 * @param userOrg - User's organization
 * @param groups - Accessible groups
 * @param siblings - Sibling organizations
 * @returns Human-readable scope summary
 */
function generateScopeSummary(
  userOrg: OrganizationContext,
  groups: GroupContext[],
  siblings: OrganizationContext[]
): string {
  const parts: string[] = [];

  // User's organization
  parts.push(`Primary organization: ${userOrg.name || userOrg.company_name}`);
  
  if (userOrg.industry) {
    parts.push(`Industry: ${userOrg.industry}`);
  }

  // Group memberships
  if (groups.length > 0) {
    parts.push(`Member of ${groups.length} enterprise group${groups.length > 1 ? 's' : ''}`);
    
    const groupNames = groups.map(g => g.name).slice(0, 3);
    if (groups.length <= 3) {
      parts.push(`Groups: ${groupNames.join(', ')}`);
    } else {
      parts.push(`Groups: ${groupNames.join(', ')} and ${groups.length - 3} more`);
    }
  }

  // Sibling organizations
  if (siblings.length > 0) {
    parts.push(`Access to ${siblings.length} partner organization${siblings.length > 1 ? 's' : ''} through group membership`);
    
    // Include industry diversity if available
    const industries = new Set(
      siblings
        .map(s => s.industry)
        .filter(industry => industry)
    );
    
    if (industries.size > 0) {
      const industryList = Array.from(industries).slice(0, 3);
      if (industries.size <= 3) {
        parts.push(`Partner industries: ${industryList.join(', ')}`);
      } else {
        parts.push(`Partner industries: ${industryList.join(', ')} and ${industries.size - 3} more`);
      }
    }
  }

  // Scope scale
  const totalOrgs = siblings.length + 1;
  if (totalOrgs > 10) {
    parts.push(`Large organizational scope (${totalOrgs} organizations)`);
  } else if (totalOrgs > 3) {
    parts.push(`Multi-organizational scope (${totalOrgs} organizations)`);
  }

  return parts.join('. ');
}

/**
 * Get organization context string for AI prompts
 * @param userId - User ID for context
 * @returns Formatted string for AI prompt inclusion
 */
export async function getAIPromptContext(userId: string): Promise<string> {
  const scope = await getAIGroupScope(userId);
  
  if (!scope) {
    return 'Organization context: Individual organization (no group affiliations)';
  }

  const contextLines: string[] = [
    '=== ORGANIZATION CONTEXT ===',
    scope.scope_summary
  ];

  if (scope.accessible_groups.length > 0) {
    contextLines.push('', 'Enterprise Groups:');
    scope.accessible_groups.forEach(group => {
      contextLines.push(`- ${group.name}: ${group.total_members} members${group.description ? ` (${group.description})` : ''}`);
    });
  }

  if (scope.sibling_orgs.length > 0) {
    contextLines.push('', 'Partner Organizations:');
    scope.sibling_orgs.slice(0, 10).forEach(org => {
      const orgName = org.name || org.company_name || org.id;
      const industry = org.industry ? ` [${org.industry}]` : '';
      contextLines.push(`- ${orgName}${industry}`);
    });
    
    if (scope.sibling_orgs.length > 10) {
      contextLines.push(`... and ${scope.sibling_orgs.length - 10} more organizations`);
    }
  }

  contextLines.push('=== END CONTEXT ===', '');

  return contextLines.join('\n');
}

const groupContextUtils = {
  getAIGroupScope,
  getGroupOrganizations,
  canUserAccessOrganization,
  getAccessibleOrganizations,
  getAIPromptContext
};

export default groupContextUtils;