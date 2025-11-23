/**
 * Current User API Endpoint
 * 現在ログイン中のユーザーと所属組織の情報を返す
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

import { logger } from '@/lib/log';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    
    // 現在のユーザーセッションを取得
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'unauthorized' }, 
        { status: 401 }
      );
    }

    // ユーザー情報を準備（Auth情報から）
    const user = {
      id: authUser.id,
      email: authUser.email || null,
      full_name: authUser.user_metadata?.full_name || null
    };

    let organization = null;

    // 組織情報を user_organizations テーブルから取得（同じロジックを getCurrentUserOrganization と統一）
    const { data: userOrgData, error: userOrgError } = await supabase
      .from('user_organizations')
      .select('organization_id, organizations(id, name, slug, plan, feature_flags)')
      .eq('user_id', authUser.id)
      .eq('role', 'owner')
      .single();

    if (!userOrgError && userOrgData?.organizations) {
      const orgData = Array.isArray(userOrgData.organizations) 
        ? userOrgData.organizations[0] 
        : userOrgData.organizations;
      
      if (orgData) {
        organization = {
          id: orgData.id,
          name: orgData.name,
          slug: orgData.slug,
          plan: orgData.plan || 'free',
          feature_flags: orgData.feature_flags || {}
        };
        logger.debug('Organization found via user_organizations:', { orgId: orgData.id, name: orgData.name });
      }
    } else {
      logger.debug('No organization found in user_organizations:', { 
        userId: authUser.id, 
        error: userOrgError?.message 
      });
    }

    // レスポンス返却
    return NextResponse.json({
      user,
      organization
    });

  } catch (error) {
    logger.error('API /me error:', { data: error });
    
    // エラーが発生してもダッシュボードを壊さないよう、できるだけ情報を返す
    return NextResponse.json({
      user: null,
      organization: null
    }, { status: 500 });
  }
}