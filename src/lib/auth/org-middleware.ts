import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { logger } from '@/lib/log';
import type { User } from '@supabase/supabase-js';

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
  try {
    const supabase = await supabaseServer();
    
    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      logger.debug('[withOrgAuth] Not authenticated');
      return NextResponse.json({ 
        message: 'Not authenticated',
        error: 'UNAUTHORIZED'
      }, { status: 401 });
    }

    // ユーザーの組織を取得（所有権確認）
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id, created_by')
      .eq('created_by', user.id)
      .maybeSingle();

    if (orgError) {
      logger.error('[withOrgAuth] Failed to fetch organization', {
        userId: user.id,
        error: orgError,
        code: orgError.code,
        details: orgError.details,
        hint: orgError.hint
      });
      return NextResponse.json({ 
        error: '企業情報の取得に失敗しました',
        code: orgError.code,
        message: 'Failed to fetch organization' 
      }, { status: 500 });
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