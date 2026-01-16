import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/log';
import type { User } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

// 環境変数から projectRef を抽出
function getEnvProjectRef(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  // https://chyicolujwhkycpkxbej.supabase.co -> chyicolujwhkycpkxbej
  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match ? match[1] : null;
}

// Cookie から projectRef を抽出（sb-XXX-auth-token）
async function getCookieProjectRefs(): Promise<string[]> {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    const refs: string[] = [];
    for (const cookie of allCookies) {
      // sb-chyicolujwhkycpkxbej-auth-token -> chyicolujwhkycpkxbej
      const match = cookie.name.match(/^sb-([^-]+)-auth-token/);
      if (match) {
        refs.push(match[1]);
      }
    }
    return refs;
  } catch {
    return [];
  }
}

export interface OrgAuthContext {
  userId: string;
  orgId: string;
  user: User;
  organization: {
    id: string;
    created_by: string;
  };
}

/**
 * 組織認証ミドルウェア
 * - ユーザー認証確認
 * - 組織所有権確認（created_by = user.id）
 * - RLS準拠のコンテキスト提供
 */
export async function withOrgAuth(
  request: NextRequest,
  handler: (context: OrgAuthContext) => Promise<NextResponse>
): Promise<NextResponse> {
  // リクエストID生成（診断用）
  const requestId = uuidv4();
  const route = request.nextUrl.pathname;

  try {
    const supabase = await createClient();

    // 診断情報を収集
    const envProjectRef = getEnvProjectRef();
    const cookieProjectRefs = await getCookieProjectRefs();
    const hasCookie = cookieProjectRefs.length > 0;
    const projectMismatch = hasCookie && envProjectRef && !cookieProjectRefs.includes(envProjectRef);

    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      // 401 診断ログ（トークン値は出さない）
      const reasonCode = !hasCookie ? 'NO_COOKIE' :
                         projectMismatch ? 'PROJECT_MISMATCH' :
                         authError ? 'USER_FETCH_FAILED' : 'UNKNOWN';

      logger.warn('[withOrgAuth] 401 Unauthorized', {
        requestId,
        route,
        reasonCode,
        hasCookie,
        cookieProjectRefs: cookieProjectRefs.length > 0 ? cookieProjectRefs : 'none',
        envProjectRef: envProjectRef || 'not_set',
        projectMismatch,
        authErrorCode: authError?.code,
        authErrorMessage: authError?.message,
      });

      const response = NextResponse.json({
        message: 'Not authenticated',
        error: 'UNAUTHORIZED',
        reasonCode, // 診断用（UIには表示しない）
        requestId,
      }, { status: 401 });
      response.headers.set('x-request-id', requestId);
      return response;
    }

    // クエリパラメータから organizationId を取得（優先）
    const url = new URL(request.url);
    const queryOrgId = url.searchParams.get('organizationId');

    let organization: { id: string; created_by: string } | null = null;

    if (queryOrgId) {
      // クエリパラメータで指定された組織を取得（メンバーシップ確認）
      const { data: membership, error: membershipError } = await supabase
        .from('organization_members')
        .select('organization_id, role')
        .eq('user_id', user.id)
        .eq('organization_id', queryOrgId)
        .maybeSingle();

      if (membershipError) {
        logger.error('[withOrgAuth] Failed to check membership', {
          userId: user.id,
          orgId: queryOrgId,
          error: membershipError
        });
        return NextResponse.json({
          error: '組織メンバーシップの確認に失敗しました',
          code: membershipError.code,
          message: 'Failed to check membership'
        }, { status: 500 });
      }

      if (membership) {
        // 組織の詳細を取得
        const { data: orgData } = await supabase
          .from('organizations')
          .select('id, created_by')
          .eq('id', queryOrgId)
          .maybeSingle();

        if (orgData) {
          organization = orgData;
        }
      }
    }

    // クエリパラメータで見つからない場合、organization_members から最初の組織を取得
    // v_current_user_orgs は不整合があるため使用しない
    if (!organization) {
      const { data: membershipData, error: membershipError } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1);

      if (membershipError) {
        logger.error('[withOrgAuth] Failed to fetch organization_members', {
          userId: user.id,
          error: { code: membershipError.code, message: membershipError.message }
        });
      } else if (membershipData && membershipData.length > 0) {
        const { data: orgData } = await supabase
          .from('organizations')
          .select('id, created_by')
          .eq('id', membershipData[0].organization_id)
          .maybeSingle();

        if (orgData) {
          organization = orgData;
        }
      }
    }

    /**
     * 後方互換フォールバック: created_by による組織検索
     *
     * 発火条件:
     * 1. クエリパラメータ organizationId で組織が見つからない
     * 2. organization_members に紐付けがない
     * 3. かつ organizations.created_by が本ユーザーのIDと一致する
     *
     * 対象ケース:
     * - 旧データ: organization_members にレコードがない組織作成者
     * - マイグレーション未完了のユーザー
     *
     * 注意: organization_members が取れた場合はこのフォールバックに到達しない
     *
     * 削除条件:
     * - 全既存ユーザーに organization_members レコードが存在することを確認後
     * - 確認SQL: SELECT COUNT(*) FROM organizations o
     *            WHERE NOT EXISTS (SELECT 1 FROM organization_members m
     *                              WHERE m.organization_id = o.id AND m.user_id = o.created_by)
     * - 結果が0になればこのフォールバック削除可能
     *
     * @see docs/auth-architecture.md
     */
    if (!organization) {
      logger.debug('[withOrgAuth] organization_members empty, trying created_by fallback', {
        userId: user.id
      });

      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('id, created_by')
        .eq('created_by', user.id)
        .maybeSingle();

      if (orgError) {
        logger.error('[withOrgAuth] created_by fallback failed', {
          userId: user.id,
          error: { code: orgError.code, message: orgError.message }
        });
      } else if (orgData) {
        // フォールバック発火を観測可能にする（PIIは出さない）
        logger.warn('[withOrgAuth] created_by fallback triggered', {
          orgId: orgData.id,
          reason: 'no_membership_record'
        });
        organization = orgData;
      }
    }

    if (!organization) {
      logger.debug('[withOrgAuth] No organization found for user', { userId: user.id });
      return NextResponse.json({
        message: 'Organization not found',
        error: 'ORG_NOT_FOUND'
      }, { status: 404 });
    }

    // 認証成功：ハンドラーにコンテキストを渡して実行
    return await handler({
      userId: user.id,
      orgId: organization.id,
      user,
      organization
    });

  } catch (error) {
    logger.error('[withOrgAuth] Unexpected error', { 
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ 
      message: 'Internal server error',
      error: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}