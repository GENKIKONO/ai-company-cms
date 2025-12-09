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
    
    // Step 1: Try get_my_organizations_slim RPC (本番環境でAvailable)
    try {
      logger.debug('Attempting get_my_organizations_slim RPC...', { userId: authUser.id });
      
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_my_organizations_slim');  // パラメータなし（新仕様）

      if (!rpcError && rpcData && Array.isArray(rpcData)) {
        logger.info('get_my_organizations_slim RPC success:', { 
          userId: authUser.id, 
          orgCount: rpcData.length 
        });
        
        // 型安全な変換
        organizations = (rpcData as GetMyOrganizationsSlimRow[])
          .map(normalizeOrganizationSummary);
        
        // デモフィルタリングなし：すべての組織を含める
        logger.debug('RPC All organizations (no filtering):', {
          userId: authUser.id,
          organizations: organizations.map(org => ({
            name: org.name,
            slug: org.slug,
            isDemoGuess: org.isDemoGuess,
            plan: org.plan
          }))
        });
        
        // 選択ロジック: 先頭の組織を選択（LuxuCareが含まれることを確保）
        selectedOrganization = organizations.length > 0 ? organizations[0] : null;
        
      } else {
        logger.warn('get_my_organizations_slim RPC failed:', { 
          userId: authUser.id, 
          rpcError: rpcError?.message,
          rpcCode: rpcError?.code 
        });
        
        // RLS error (42501) or other auth errors
        if (rpcError?.code === '42501' || rpcError?.code === 'PGRST301') {
          throw new Error('RLS_PERMISSION_DENIED');
        }
        
        throw new Error('RPC_UNAVAILABLE');
      }
    } catch (rpcError: any) {
      // Step 2: Fallback to organization_members table query (RLS対応)
      logger.debug('Using fallback organization_members query...', { 
        userId: authUser.id, 
        fallbackReason: rpcError.message 
      });
      
      try {
        const { data: memberData, error: memberError } = await supabase
          .from('organization_members')  // RLS有効テーブル（user_id = auth.uid()）
          .select(`
            organization_id, 
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
          
          logger.info('Organizations found via organization_members fallback:', { 
            userId: authUser.id, 
            orgCount: organizations.length 
          });
          
        } else {
          // No organizations found - 正常ケース
          logger.info('No organizations found for user:', { 
            userId: authUser.id, 
            memberError: memberError?.message 
          });
          
          // 42501 エラーの場合は権限不足を示す
          if (memberError?.code === '42501') {
            errorMessage = '組織情報へのアクセス権がありません。管理者にお問い合わせください。';
          }
        }
      } catch (fallbackError: any) {
        logger.error('Fallback organization query also failed:', { 
          userId: authUser.id, 
          fallbackError: fallbackError.message 
        });
        
        errorMessage = 'データの取得に失敗しました。しばらく後に再度お試しください。';
      }
    }

    // レスポンス返却（キャッシュ防止ヘッダー付き）
    const responseData: MeApiResponse = {
      user,
      organizations,                    // 新形式: 複数組織対応
      selectedOrganization,            // 新形式: 現在選択中の組織
      organization: selectedOrganization,  // 旧形式: 後方互換性のため維持
      error: errorMessage              // エラー情報（あれば）
    };

    // 一時デバッグ: /api/me レスポンス内容をログ出力
    logger.debug('=== /api/me Response Debug ===', {
      userId: user.id,
      userEmail: user.email,
      organizationsCount: organizations.length,
      organizations: organizations.map(org => ({
        id: org.id,
        name: org.name,
        slug: org.slug,
        plan: org.plan,
        isDemoGuess: org.isDemoGuess
      })),
      selectedOrganization: selectedOrganization ? {
        id: selectedOrganization.id,
        name: selectedOrganization.name,
        slug: selectedOrganization.slug,
        isDemoGuess: selectedOrganization.isDemoGuess
      } : null,
      error: errorMessage
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