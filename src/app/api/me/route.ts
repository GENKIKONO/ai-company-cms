/**
 * Current User API Endpoint
 * 現在ログイン中のユーザーと所属組織の情報を返す
 * 
 * Version 2: 複数組織対応準備版
 * - get_my_organizations_slim RPC優先使用（存在する場合）
 * - フォールバック: 既存の user_organizations テーブル直接クエリ
 * - 戻り値: user + organizations[] + selectedOrganization（後方互換のためorganizationも維持）
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

    let organizations: any[] = [];
    let selectedOrganization = null;
    
    // Step 1: Try get_my_organizations_slim RPC first (準備中のRPC)
    try {
      logger.debug('Attempting get_my_organizations_slim RPC...', { userId: authUser.id });
      
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_my_organizations_slim', { 
          include_demo: false  // 本番組織のみ 
        });

      if (!rpcError && rpcData && Array.isArray(rpcData)) {
        logger.info('get_my_organizations_slim RPC success:', { 
          userId: authUser.id, 
          orgCount: rpcData.length 
        });
        
        organizations = rpcData.map((org: any) => ({
          id: org.org_id || org.id,
          name: org.org_name || org.name,
          slug: org.org_slug || org.slug,
          plan: org.plan || 'free',
          feature_flags: org.feature_flags || {}
        }));
        
        // 選択ロジック: 先頭組織を選択（今後改善予定）
        selectedOrganization = organizations.length > 0 ? organizations[0] : null;
      } else {
        logger.info('get_my_organizations_slim RPC not available or failed, using fallback:', { 
          userId: authUser.id, 
          rpcError: rpcError?.message 
        });
        throw new Error('RPC not available, using fallback');
      }
    } catch (rpcFallbackError) {
      // Step 2: Fallback to existing user_organizations table logic
      logger.debug('Using fallback user_organizations query...', { userId: authUser.id });
      
      const { data: userOrgData, error: userOrgError } = await supabase
        .from('user_organizations')
        .select('organization_id, organizations(id, name, slug, plan, feature_flags)')
        .eq('user_id', authUser.id)
        .eq('role', 'owner');  // Note: removed .single() to support multiple orgs

      if (!userOrgError && userOrgData && userOrgData.length > 0) {
        organizations = userOrgData
          .filter(item => item.organizations) // Filter out null organizations
          .map(item => {
            const orgData = Array.isArray(item.organizations) 
              ? item.organizations[0] 
              : item.organizations;
            
            return {
              id: orgData.id,
              name: orgData.name,
              slug: orgData.slug,
              plan: orgData.plan || 'free',
              feature_flags: orgData.feature_flags || {}
            };
          });
        
        // 選択ロジック: 先頭組織を選択
        selectedOrganization = organizations.length > 0 ? organizations[0] : null;
        
        logger.debug('Organizations found via user_organizations fallback:', { 
          userId: authUser.id, 
          orgCount: organizations.length 
        });
      } else {
        logger.debug('No organizations found in fallback query:', { 
          userId: authUser.id, 
          error: userOrgError?.message 
        });
      }
    }

    // レスポンス返却（キャッシュ防止ヘッダー付き）
    const response = NextResponse.json({
      user,
      organizations,                    // 新形式: 複数組織対応
      selectedOrganization,            // 新形式: 現在選択中の組織
      organization: selectedOrganization  // 旧形式: 後方互換性のため維持
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
      organizations: [],
      selectedOrganization: null,
      organization: null  // 後方互換
    }, { status: 500 });
    
    // キャッシュ防止ヘッダー（エラー応答でも）
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  }
}