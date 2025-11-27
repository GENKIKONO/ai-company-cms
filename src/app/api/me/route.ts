/**
 * Current User API Endpoint
 * 現在ログイン中のユーザーと所属組織の情報を返す
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

import { logger } from '@/lib/log';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 現在のユーザーセッションを取得
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authUser) {
      const response = NextResponse.json(
        { error: 'unauthorized' }, 
        { status: 401 }
      );
      
      // キャッシュ防止ヘッダー（エラー応答でも）
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      
      return response;
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

    // レスポンス返却（キャッシュ防止ヘッダー付き）
    const response = NextResponse.json({
      user,
      organization
    });
    
    // 追加のキャッシュ防止ヘッダー
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;

  } catch (error) {
    logger.error('API /me error:', { data: error });
    
    // エラーが発生してもダッシュボードを壊さないよう、できるだけ情報を返す
    const response = NextResponse.json({
      user: null,
      organization: null
    }, { status: 500 });
    
    // キャッシュ防止ヘッダー（エラー応答でも）
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  }
}