/**
 * Current User API Endpoint
 * 現在ログイン中のユーザーと所属組織の情報を返す
 * 
 * Version 4: get_my_organizations_slim ベース + 構造化エラーハンドリング
 * - get_my_organizations_slim() RPC を第1選択（SECURITY INVOKER）
 * - フォールバック: organization_members テーブルクエリ（簡潔版）
 * - 戻り値: user + organizations[] + selectedOrganization（後方互換のためorganizationも維持）
 * - エラーハンドリング強化（errorType構造化、42501対応）
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserFullWithClient } from '@/lib/core/auth-state';
import {
  GetMyOrganizationsSlimRow,
  OrganizationSummary,
  normalizeOrganizationSummary
} from '@/types/organization-summary';

import { logger } from '@/lib/log';
export const dynamic = 'force-dynamic';

// エラー種別の構造化型定義
type MeErrorType =
  | 'permission_denied'   // RLS 42501 / validate_org_access 相当
  | 'system_error'        // 想定外の内部エラー
  | 'none';               // エラーなし

// 拡張された API レスポンス型
interface MeApiResponseExtended {
  user: {
    id: string;
    email: string | null;
    full_name: string | null;
  } | null;
  
  // 新形式
  organizations: OrganizationSummary[];
  selectedOrganization: OrganizationSummary | null;
  
  // 後方互換
  organization: OrganizationSummary | null;
  
  // エラー情報（正常時は undefined）
  error?: string;
  
  // 新規: 構造化エラー種別
  errorType?: MeErrorType;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 現在のユーザーセッションを取得（Core経由、user_metadataを含む完全版）
    const authUser = await getUserFullWithClient(supabase);

    if (process.env.NODE_ENV !== 'production') {
      logger.debug('[ME_DEBUG] Entry point:', {
        data: {
          hasAuthUser: !!authUser,
          userId: authUser?.id,
          userEmail: authUser?.email,
        }
      });
    }

    if (!authUser) {
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

    // ユーザー情報を準備（Core経由で取得したAuth情報から）
    const user = {
      id: authUser.id,
      email: authUser.email || null,
      full_name: (authUser.user_metadata?.full_name as string) || null
    };

    if (process.env.NODE_ENV !== 'production') {
      logger.debug('[ME_DEBUG] user', {
        data: {
          id: authUser?.id,
          email: authUser?.email,
        }
      });
    }

    let organizations: OrganizationSummary[] = [];
    let selectedOrganization: OrganizationSummary | null = null;
    let errorMessage: string | undefined = undefined;
    let errorType: MeErrorType = 'none';
    
    // RPC一本＋素直なマッピングで組織取得
    const { data: orgRows, error: orgError } = await supabase
      .rpc('get_my_organizations_slim');

    if (process.env.NODE_ENV !== 'production') {
      logger.debug('[ME_DEBUG] orgs_from_rpc', { data: orgRows });
      logger.debug('[ME_DEBUG] rpc_error', { data: orgError });

      // DEBUG: Check if id field is present in RPC response
      if (orgRows && orgRows.length > 0) {
        logger.debug('[ME_DEBUG] first_org_raw_fields', { data: Object.keys(orgRows[0]) });
        logger.debug('[ME_DEBUG] first_org_id', { data: orgRows[0].id });
        logger.debug('[ME_DEBUG] first_org_full_object', { data: orgRows[0] });
      }
    }

    if (orgError) {
      // RPCエラーは system_error として扱う（DB側は正常の前提）
      logger.error('[ME_DEBUG] get_my_organizations_slim error', { data: orgError });
      errorType = 'system_error';
      errorMessage = '組織情報の取得に失敗しました';
    } else {
      // RPC成功 - 素直にマッピング
      const rawOrganizations = (orgRows ?? []);
      organizations = rawOrganizations.map(normalizeOrganizationSummary);
      selectedOrganization = organizations.length > 0 ? organizations[0] : null;
      
      if (process.env.NODE_ENV !== 'production') {
        logger.debug('[ME_DEBUG] organizations mapped:', {
          data: {
            userId: authUser.id,
            orgCount: organizations.length,
            firstOrgId: organizations[0]?.id,
            firstOrgName: organizations[0]?.name,
            firstOrgFullMapped: organizations[0]
          }
        });
      }
      
      // 0件でも正常（errorType: 'none' のまま）
      errorType = 'none';
      errorMessage = undefined;
    }

    if (process.env.NODE_ENV !== 'production') {
      logger.debug('[ME_DEBUG] response_summary', {
        data: {
          organizationsLength: organizations.length,
          errorType,
        }
      });
    }

    // レスポンス返却（キャッシュ防止ヘッダー付き）
    const responseData: MeApiResponseExtended = {
      user,
      organizations,                    // 新形式: 複数組織対応
      selectedOrganization,            // 新形式: 現在選択中の組織
      organization: selectedOrganization,  // 旧形式: 後方互換性のため維持
      error: errorMessage,             // エラー情報（あれば）
      errorType                        // 新規: 構造化エラー種別
    };

    if (process.env.NODE_ENV !== 'production') {
      logger.debug('[ME_DEBUG] Final response:', {
        data: {
          hasUser: !!user,
          organizationsLength: organizations.length,
          selectedOrgId: selectedOrganization?.id,
          selectedOrgSlug: selectedOrganization?.slug,
          selectedOrgPlan: selectedOrganization?.plan,
          organizationId: selectedOrganization?.id,  // Extra check for dashboard compatibility
          errorType,
          hasError: !!errorMessage,
          errorMessage: errorMessage
        }
      });

      // Extra debug: log the complete response structure that will be sent
      logger.debug('[ME_DEBUG] Complete response structure:', {
        data: {
          'organizations[0]?.id': organizations[0]?.id,
          'selectedOrganization?.id': selectedOrganization?.id,
          'organization?.id': selectedOrganization?.id
        }
      });
    }
    
    const response = NextResponse.json(responseData);
    
    // 追加のキャッシュ防止ヘッダー
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;

  } catch (error) {
    logger.error('API /me error:', { data: error });
    
    // エラーが発生してもダッシュボードを壊さないよう、できるだけ情報を返す
    const errorResponseData: MeApiResponseExtended = {
      user: null,
      organizations: [],
      selectedOrganization: null,
      organization: null,  // 後方互換
      error: 'サーバーエラーが発生しました。しばらく後に再度お試しください。',
      errorType: 'system_error'
    };
    
    const response = NextResponse.json(errorResponseData, { status: 500 });
    
    // キャッシュ防止ヘッダー（エラー応答でも）
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  }
}