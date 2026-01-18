/**
 * GDPR Data Export API
 * POST /api/account/gdpr/export - 個人データエクスポート要求
 *
 * GDPR Article 20: Right to data portability
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { handleApiError } from '@/lib/api/error-responses';
import { logger } from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // ユーザーデータを収集
    const exportData: Record<string, unknown> = {
      exportedAt: new Date().toISOString(),
      gdprArticle: 'Article 20 - Right to data portability',
      user: {
        id: user.id,
        email: user.email,
        emailConfirmedAt: user.email_confirmed_at,
        phone: user.phone,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        lastSignInAt: user.last_sign_in_at,
        metadata: user.user_metadata,
      },
    };

    // 組織メンバーシップ
    const { data: memberships } = await supabase
      .from('organization_members')
      .select('organization_id, role, created_at')
      .eq('user_id', user.id);

    if (memberships) {
      exportData.organizationMemberships = memberships;
    }

    // 監査ログ（ユーザーのアクション）
    const { data: auditLogs } = await supabase
      .from('admin_audit_logs')
      .select('action, entity_type, entity_id, created_at')
      .eq('actor_user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1000);

    if (auditLogs) {
      exportData.activityLogs = auditLogs;
    }

    // 同意記録
    const { data: consents } = await supabase
      .from('user_consents')
      .select('consent_type, granted_at, revoked_at')
      .eq('user_id', user.id);

    if (consents) {
      exportData.consents = consents;
    }

    logger.info('[GDPR Export] Data export requested', {
      userId: user.id,
      dataCategories: Object.keys(exportData),
    });

    return NextResponse.json({
      success: true,
      message: 'Your data export is ready',
      data: exportData,
      format: 'JSON',
      encoding: 'UTF-8',
    });

  } catch (error) {
    logger.error('[GDPR Export] Error', { error });
    return handleApiError(error);
  }
}
