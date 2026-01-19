/**
 * Admin Users API
 *
 * ⚠️ Requires site_admin authentication.
 */
/* eslint-disable no-console */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isAuthorized } from '@/lib/auth/require-admin';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { handleApiError, handleDatabaseError } from '@/lib/api/error-responses';

export async function GET(request: NextRequest) {
  // 管理者認証チェック
  const authResult = await requireAdmin();
  if (!isAuthorized(authResult)) {
    return authResult.response;
  }

  try {
    const supabase = await createClient();

    // 二段取得: v_app_users_compat2 + organizations
    // Step 1: ユーザー一覧を取得（v_app_users_compat2 互換ビュー使用）
    const { data: users, error } = await supabase
      .from('v_app_users_compat2')
      .select('id, email, full_name, role, created_at, updated_at, organization_id')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching users', { data: error instanceof Error ? error : new Error(String(error)) });
      return handleDatabaseError(error);
    }

    // Step 2: organization_id の集合を取得して organizations を一括取得
    const orgIds = [...new Set(users?.map(u => u.organization_id).filter(Boolean) as string[])];

    const orgsMap: Map<string, { id: string; name: string | null; status: string | null; is_published: boolean | null }> = new Map();

    if (orgIds.length > 0) {
      const { data: orgs, error: orgError } = await supabase
        .from('organizations')
        .select('id, name, status, is_published')
        .in('id', orgIds);

      if (!orgError && orgs) {
        orgs.forEach(org => orgsMap.set(org.id, org));
      }
    }

    // Step 3: メモリ上でマージ（既存の形式を維持）
    const usersWithOrgs = users?.map(user => ({
      ...user,
      organizations: user.organization_id ? orgsMap.get(user.organization_id) || null : null
    })) || [];

    return NextResponse.json({ data: usersWithOrgs });

  } catch (error) {
    logger.error('Unexpected error', { data: error instanceof Error ? error : new Error(String(error)) });
    return handleApiError(error);
  }
}