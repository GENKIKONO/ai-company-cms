/**
 * Organization Access Control Utility
 * Unified helper for validate_org_access RPC function
 */

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/log';

/**
 * Custom error class for organization access violations
 */
export class OrgAccessError extends Error {
  constructor(
    message: string,
    public readonly code: 'INTERNAL_ERROR' | 'FORBIDDEN',
    public readonly statusCode: number
  ) {
    super(message);
    this.name = 'OrgAccessError';
  }
}

/**
 * Validates user access to organization using validate_org_access RPC
 * 
 * @param organizationId - Organization ID to validate access for
 * @param userId - User ID (optional, defaults to current auth user)
 * @returns Promise<boolean> - true if access is granted
 * @throws OrgAccessError - when access is denied or validation fails
 */
export async function validateOrgAccess(
  organizationId: string,
  userId?: string,
  permission: 'read' | 'write' = 'read'
): Promise<boolean> {
  try {
    const supabase = await createClient();
    
    console.log('[ORG_ACCESS_DEBUG] Calling validate_org_access RPC:', {
      organizationId,
      userId,
      permission
    });
    
    // Call validate_org_access RPC function (DB側は正常の前提)
    const { data, error } = await supabase.rpc('validate_org_access', {
      org_id: organizationId,
      required_permission: permission,
      ...(userId ? { user_id: userId } : {})
    });

    if (error) {
      // DB側は正常前提なので、ここでのエラーは unexpected
      console.error('[ORG_ACCESS_DEBUG] validateOrgAccess RPC error:', error);
      throw new OrgAccessError(
        'メンバーシップ確認に失敗しました',
        'INTERNAL_ERROR',
        500
      );
    }

    if (!data) {
      // アクセス権なし
      throw new OrgAccessError(
        'この組織のメンバーではありません',
        'FORBIDDEN',
        403
      );
    }

    console.log('[ORG_ACCESS_DEBUG] Access granted');
    return true;
    
  } catch (error) {
    if (error instanceof OrgAccessError) {
      throw error;
    }
    
    console.error('[ORG_ACCESS_DEBUG] Unexpected error:', error);
    throw new OrgAccessError(
      'メンバーシップ確認に失敗しました',
      'INTERNAL_ERROR',
      500
    );
  }
}