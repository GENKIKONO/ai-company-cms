// AIレポート機能アクセス制御専用API: /api/my/features/ai-reports
// effective-features をサーバーサイドで安全に使用
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserWithClient } from '@/lib/core/auth-state';
import { canUseFeature, getFeatureLevel } from '@/lib/featureGate';
import { createAuthError, createNotFoundError, createInternalError, generateErrorId } from '@/lib/utils/data-normalization';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

// GET - AIレポート機能のアクセス可否・レベルチェック
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 認証チェック（Core経由）
    const user = await getUserWithClient(supabase);
    if (!user) {
      return createAuthError();
    }

    // ユーザーの所属組織を取得（organization_members経由）
    const { data: membershipData, error: membershipError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (membershipError) {
      logger.error('[ai-reports] Failed to fetch membership', {
        userId: user.id,
        error: membershipError.message
      });
      return NextResponse.json({
        hasAccess: false,
        level: null,
        plan: null,
        reason: 'membership_error'
      });
    }

    if (!membershipData) {
      logger.debug('[ai-reports] Organization membership not found', {
        userId: user.id
      });
      return NextResponse.json({
        hasAccess: false,
        level: null,
        plan: null,
        reason: 'organization_not_found'
      });
    }

    // 組織のplan情報を取得
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('id, plan')
      .eq('id', membershipData.organization_id)
      .single();

    if (orgError || !orgData) {
      logger.debug('[ai-reports] Organization not found', {
        userId: user.id,
        organizationId: membershipData.organization_id,
        error: orgError?.message
      });
      return NextResponse.json({
        hasAccess: false,
        level: null,
        plan: null,
        reason: 'organization_not_found'
      });
    }

    // effective-features でアクセス制御チェック（サーバーサイド）
    try {
      const hasAccess = await canUseFeature(orgData.id, 'ai_reports');
      const level = await getFeatureLevel(orgData.id, 'ai_reports');

      logger.debug('[ai-reports] Feature access check', {
        userId: user.id,
        organizationId: orgData.id,
        hasAccess,
        level,
        plan: orgData.plan
      });

      return NextResponse.json({
        hasAccess,
        level: level || null,
        plan: orgData.plan || 'trial',
        organizationId: orgData.id,
        reason: hasAccess ? 'allowed' : 'plan_restriction'
      });

    } catch (featureError) {
      logger.error('[ai-reports] effective-features error, denying access', featureError, {
        userId: user.id,
        organizationId: orgData.id
      });
      
      return NextResponse.json({ 
        hasAccess: false,
        level: null,
        plan: orgData.plan || 'trial',
        reason: 'feature_check_error'
      });
    }

  } catch (error) {
    const errorId = generateErrorId('ai-reports-check');
    logger.error('[GET /api/my/features/ai-reports] Unexpected error:', { data: { errorId, error } });
    return createInternalError(errorId);
  }
}