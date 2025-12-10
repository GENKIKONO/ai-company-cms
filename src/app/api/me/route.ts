/**
 * Current User API Endpoint
 * 現在ログイン中のユーザーと所属組織の情報を返す
 * 
 * Version 3: RLS強化対応版
 * - get_my_organizations_slim() RPC ベース（パラメータなし、SECURITY INVOKER）
 * - フォールバック: organization_members テーブルクエリ（RLS対応）
 * - 戻り値: user + organizations[] + selectedOrganization（後方互換のためorganizationも維持）
 * - エラーハンドリング強化（42501対応、無限ローディング防止）
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  GetMyOrganizationsSlimRow, 
  OrganizationSummary, 
  MeApiResponse, 
  normalizeOrganizationSummary 
} from '@/types/organization-summary';

import { logger } from '@/lib/log';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 現在のユーザーセッションを取得
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    console.log('[ME_DEBUG] Entry point:', { 
      hasAuthUser: !!authUser, 
      userId: authUser?.id,
      userEmail: authUser?.email,
      authError: authError?.message 
    });
    
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

    let organizations: OrganizationSummary[] = [];
    let selectedOrganization: OrganizationSummary | null = null;
    let errorMessage: string | undefined = undefined;
    
    // Try using get_user_organizations RPC first
    try {
      logger.debug('Trying get_user_organizations RPC...', { userId: authUser.id });
      
      const { data: userOrgsData, error: userOrgsError } = await supabase
        .rpc('get_user_organizations');

      console.log('[ME_DEBUG] get_user_organizations result:', { 
        hasError: !!userOrgsError, 
        errorMessage: userOrgsError?.message,
        errorCode: userOrgsError?.code,
        dataIsArray: Array.isArray(userOrgsData),
        dataLength: userOrgsData?.length || 0,
        firstOrgId: userOrgsData?.[0]?.organization_id,
        firstOrgRole: userOrgsData?.[0]?.role
      });

      if (!userOrgsError && userOrgsData && Array.isArray(userOrgsData) && userOrgsData.length > 0) {
        // RPC成功時は、organization_id のリストを取得してorganizationsテーブルから詳細を取得
        const orgIds = userOrgsData.map(org => org.organization_id);
        
        const { data: orgsData, error: orgsError } = await supabase
          .from('organizations')
          .select(`
            id, 
            name, 
            slug, 
            plan, 
            feature_flags,
            show_services,
            show_posts,
            show_case_studies,
            show_faqs,
            show_qa,
            show_news,
            show_partnership,
            show_contact
          `)
          .in('id', orgIds);

        console.log('[ME_DEBUG] organizations table query result:', { 
          orgIds: orgIds,
          hasOrgsError: !!orgsError,
          orgsErrorMessage: orgsError?.message,
          orgsErrorCode: orgsError?.code,
          orgsDataLength: orgsData?.length || 0,
          firstOrgId: orgsData?.[0]?.id,
          firstOrgSlug: orgsData?.[0]?.slug
        });

        if (!orgsError && orgsData) {
          organizations = orgsData.map(orgData => ({
            id: orgData.id,
            name: orgData.name,
            slug: orgData.slug,
            plan: orgData.plan || 'free',
            
            // show_* フィールド
            showServices: orgData.show_services ?? true,
            showPosts: orgData.show_posts ?? true,
            showCaseStudies: orgData.show_case_studies ?? true,
            showFaqs: orgData.show_faqs ?? true,
            showQa: orgData.show_qa ?? true,
            showNews: orgData.show_news ?? true,
            showPartnership: orgData.show_partnership ?? true,
            showContact: orgData.show_contact ?? true,
            
            isDemoGuess: false,
            feature_flags: orgData.feature_flags || {}
          } as OrganizationSummary));
          
          selectedOrganization = organizations.length > 0 ? organizations[0] : null;
          
          logger.info('Organizations found via get_user_organizations RPC:', { 
            userId: authUser.id, 
            orgCount: organizations.length 
          });
        } else {
          // DBエラーが発生したが、メンバーシップは確認できているのでエラーフラグを設定
          errorMessage = `組織詳細の取得に失敗しました。メンバーシップは確認済みです。（エラー: ${orgsError?.code || 'UNKNOWN'}）`;
          logger.error('Organization details query failed but membership confirmed:', { 
            userId: authUser.id, 
            orgIds,
            errorCode: orgsError?.code,
            errorMessage: orgsError?.message 
          });
        }
      } else {
        // Fallback to direct query
        logger.debug('Fallback: Querying organization_members directly...', { userId: authUser.id });
        const { data: memberData, error: memberError } = await supabase
          .from('organization_members')  // RLS有効テーブル（user_id = auth.uid()）
          .select(`
            organization_id, 
            role,
            organizations(
              id, 
              name, 
              slug, 
              plan, 
              feature_flags,
              show_services,
              show_posts,
              show_case_studies,
              show_faqs,
              show_qa,
              show_news,
              show_partnership,
              show_contact
            )
          `);


        if (!memberError && memberData && memberData.length > 0) {
          organizations = memberData
            .filter(item => item.organizations) // null チェック
            .map(item => {
              const orgData: any = Array.isArray(item.organizations) 
                ? item.organizations[0] 
                : item.organizations;
              
              return {
                id: orgData.id,
                name: orgData.name,
                slug: orgData.slug,
                plan: orgData.plan || 'free',
                
                // show_* フィールド（fallback時はデフォルト値）
                showServices: orgData.show_services ?? true,
                showPosts: orgData.show_posts ?? true,
                showCaseStudies: orgData.show_case_studies ?? true,
                showFaqs: orgData.show_faqs ?? true,
                showQa: orgData.show_qa ?? true,
                showNews: orgData.show_news ?? true,
                showPartnership: orgData.show_partnership ?? true,
                showContact: orgData.show_contact ?? true,
                
                isDemoGuess: false, // fallback時はすべて本番として扱う
                feature_flags: orgData.feature_flags || {}
              } as OrganizationSummary;
            });
          
          selectedOrganization = organizations.length > 0 ? organizations[0] : null;
          
          logger.info('Organizations found via organization_members query:', { 
            userId: authUser.id, 
            orgCount: organizations.length 
          });
          
        } else {
          // No organizations found - 正常ケース
          logger.info('No organizations found for user:', { 
            userId: authUser.id, 
            memberError: memberError?.message,
            memberErrorCode: memberError?.code 
          });
          
          // 42501 エラーの場合は権限不足を示す
          if (memberError?.code === '42501') {
            errorMessage = '組織情報へのアクセス権がありません。管理者にお問い合わせください。';
          }
        }
      }
    } catch (queryError: any) {
      logger.error('Organization query failed:', { 
        userId: authUser.id, 
        queryError: queryError.message 
      });
      
      errorMessage = 'データの取得に失敗しました。しばらく後に再度お試しください。';
    }

    // レスポンス返却（キャッシュ防止ヘッダー付き）
    const responseData: MeApiResponse = {
      user,
      organizations,                    // 新形式: 複数組織対応
      selectedOrganization,            // 新形式: 現在選択中の組織
      organization: selectedOrganization,  // 旧形式: 後方互換性のため維持
      error: errorMessage              // エラー情報（あれば）
    };

    console.log('[ME_DEBUG] Final response:', { 
      hasUser: !!user,
      organizationsLength: organizations.length,
      selectedOrgId: selectedOrganization?.id,
      selectedOrgSlug: selectedOrganization?.slug,
      selectedOrgPlan: selectedOrganization?.plan,
      hasError: !!errorMessage,
      errorMessage: errorMessage
    });
    
    const response = NextResponse.json(responseData);
    
    // 追加のキャッシュ防止ヘッダー
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;

  } catch (error) {
    logger.error('API /me error:', { data: error });
    
    // エラーが発生してもダッシュボードを壊さないよう、できるだけ情報を返す
    const errorResponseData: MeApiResponse = {
      user: null,
      organizations: [],
      selectedOrganization: null,
      organization: null,  // 後方互換
      error: 'サーバーエラーが発生しました。しばらく後に再度お試しください。'
    };
    
    const response = NextResponse.json(errorResponseData, { status: 500 });
    
    // キャッシュ防止ヘッダー（エラー応答でも）
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  }
}