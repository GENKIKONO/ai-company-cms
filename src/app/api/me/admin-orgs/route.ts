/**
 * Admin Organizations API
 *
 * 認証済みユーザーが owner/admin 権限を持つ組織一覧を返す
 * - RLS使用（ユーザーコンテキスト）
 * - service_role 不使用
 *
 * Response: { has_admin_org: boolean, orgs: [{id, name, slug, role}] }
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/log';

export const dynamic = 'force-dynamic';

// レスポンス型定義
interface AdminOrg {
  id: string;
  name: string | null;
  slug: string | null;
  role: string;
}

interface AdminOrgsResponse {
  has_admin_org: boolean;
  orgs: AdminOrg[];
}

// organization_members JOIN結果の型
// Note: Supabase !inner JOIN returns array, but with single FK it's typically one element
interface MembershipRow {
  role: string;
  organization_id: string;
  organizations: {
    id: string;
    name: string | null;
    slug: string | null;
  };
}

export async function GET() {
  try {
    const supabase = await createClient();

    // 1) 認証チェック
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2) owner/admin の所属組織を取得（最小列、RLS適用）
    const { data, error } = await supabase
      .from('organization_members')
      .select(`
        role,
        organization_id,
        organizations!inner(id, name, slug)
      `)
      .eq('user_id', user.id)
      .in('role', ['owner', 'admin'])
      .limit(50);

    if (error) {
      logger.error('Failed to fetch admin organizations', {
        component: 'me/admin-orgs',
        userId: user.id,
        error: error.message,
        code: error.code
      });

      // RLS denied の場合も 500 で返す（クライアントには詳細を漏らさない）
      return NextResponse.json(
        { error: 'Internal error' },
        { status: 500 }
      );
    }

    // 3) レスポンス整形
    // Supabase returns organizations as object (not array) with !inner join
    const rows = (data ?? []) as unknown as MembershipRow[];
    const orgs: AdminOrg[] = rows
      .filter((row) => row.organizations != null)
      .map((row) => ({
        id: row.organizations.id,
        name: row.organizations.name,
        slug: row.organizations.slug,
        role: row.role,
      }));

    const response: AdminOrgsResponse = {
      has_admin_org: orgs.length > 0,
      orgs,
    };

    return NextResponse.json(response);

  } catch (err) {
    logger.error('Unexpected error in admin-orgs API', {
      component: 'me/admin-orgs',
      error: err instanceof Error ? err.message : String(err)
    });

    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 }
    );
  }
}
