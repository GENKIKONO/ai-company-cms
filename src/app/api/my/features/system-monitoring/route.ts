// システム監視機能アクセス制御専用API: /api/my/features/system-monitoring
// NOTE: [FEATUREGATE_PHASE2] featureGate(Subject型API)をサーバーサイドで安全に使用
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserWithClient } from '@/lib/core/auth-state';
import { getEffectiveFeatures, getFeatureEnabled } from '@/lib/featureGate';
import { createAuthError, createNotFoundError, createInternalError, generateErrorId } from '@/lib/utils/data-normalization';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

// GET - システム監視機能のアクセス可否チェック
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
      logger.error('[system-monitoring] Failed to fetch membership', {
        userId: user.id,
        error: membershipError.message
      });
      return NextResponse.json({
        hasAccess: false,
        plan: null,
        reason: 'membership_error'
      });
    }

    if (!membershipData) {
      logger.debug('[system-monitoring] Organization membership not found', {
        userId: user.id
      });
      return NextResponse.json({
        hasAccess: false,
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
      logger.debug('[system-monitoring] Organization not found', {
        userId: user.id,
        organizationId: membershipData.organization_id,
        error: orgError?.message
      });
      return NextResponse.json({
        hasAccess: false,
        plan: null,
        reason: 'organization_not_found'
      });
    }

    // NOTE: [FEATUREGATE_PHASE2] featureGate(Subject型API)でアクセス制御チェック
    try {
      const features = await getEffectiveFeatures(supabase, { type: 'org', id: orgData.id });
      const hasAccess = getFeatureEnabled(features, 'system_monitoring');

      logger.debug('[system-monitoring] Feature access check via featureGate', {
        userId: user.id,
        organizationId: orgData.id,
        hasAccess,
        plan: orgData.plan
      });

      return NextResponse.json({
        hasAccess,
        plan: orgData.plan || 'trial',
        organizationId: orgData.id,
        reason: hasAccess ? 'allowed' : 'plan_restriction'
      });

    } catch (featureError) {
      logger.error('[system-monitoring] featureGate error, denying access', featureError, {
        userId: user.id,
        organizationId: orgData.id
      });

      return NextResponse.json({
        hasAccess: false,
        plan: orgData.plan || 'trial',
        reason: 'feature_check_error'
      });
    }

  } catch (error) {
    const errorId = generateErrorId('system-monitoring-check');
    logger.error('[GET /api/my/features/system-monitoring] Unexpected error:', { data: { errorId, error } });
    return createInternalError(errorId);
  }
}