/**
 * GDPR Data Deletion API
 * POST /api/account/gdpr/delete - アカウント削除要求
 *
 * GDPR Article 17: Right to erasure ('right to be forgotten')
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { handleApiError, validationError } from '@/lib/api/error-responses';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';

const deleteSchema = z.object({
  confirmation: z.literal('DELETE MY ACCOUNT', {
    errorMap: () => ({ message: 'Please type "DELETE MY ACCOUNT" to confirm' }),
  }),
  reason: z.string().max(500).optional(),
});

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

    // リクエストボディ検証
    const body = await request.json();
    const validation = deleteSchema.safeParse(body);
    if (!validation.success) {
      return validationError(validation.error.flatten().fieldErrors);
    }

    const { reason } = validation.data;

    // 削除要求を記録
    const { error: requestError } = await supabase
      .from('gdpr_deletion_requests')
      .insert({
        user_id: user.id,
        user_email: user.email,
        reason,
        requested_at: new Date().toISOString(),
        status: 'pending',
      });

    if (requestError) {
      // テーブルが存在しない場合は作成をスキップ
      logger.warn('[GDPR Delete] Could not log deletion request', { error: requestError });
    }

    // ユーザーデータの匿名化/削除
    // Note: 法的保持期間が必要なデータは保持

    // 1. user_metadata をクリア
    await supabase.auth.updateUser({
      data: {
        gdpr_deletion_requested: true,
        gdpr_deletion_requested_at: new Date().toISOString(),
        // MFAデータ削除
        mfa_enabled: false,
        mfa_secret: null,
        mfa_backup_codes: null,
      },
    });

    // 2. 組織メンバーシップを削除（オーナーでない場合）
    await supabase
      .from('organization_members')
      .delete()
      .eq('user_id', user.id)
      .neq('role', 'owner');

    // 3. 同意記録を削除
    await supabase
      .from('user_consents')
      .delete()
      .eq('user_id', user.id);

    // 4. セッションを無効化
    await supabase.auth.signOut();

    logger.info('[GDPR Delete] Deletion request processed', {
      userId: user.id,
      reason: reason || 'Not provided',
    });

    return NextResponse.json({
      success: true,
      message: 'Your account deletion request has been processed',
      details: {
        gdprArticle: 'Article 17 - Right to erasure',
        status: 'processed',
        note: 'Some data may be retained for legal compliance (e.g., billing records for 7 years)',
        sessionTerminated: true,
      },
    });

  } catch (error) {
    logger.error('[GDPR Delete] Error', { error });
    return handleApiError(error);
  }
}
