/**
 * MFA Disable API
 * POST /api/auth/mfa/disable - MFA無効化
 *
 * リクエスト:
 * - token: 現在の6桁TOTPコード（確認用）
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyTOTP } from '@/lib/security/mfa';
import { handleApiError, validationError } from '@/lib/api/error-responses';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';

const disableSchema = z.object({
  token: z.string().length(6, 'Token must be 6 digits'),
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
    const validation = disableSchema.safeParse(body);
    if (!validation.success) {
      return validationError(validation.error.flatten().fieldErrors);
    }

    const { token } = validation.data;
    const userMetadata = user.user_metadata || {};
    const mfaSecret = userMetadata.mfa_secret;

    if (!mfaSecret || !userMetadata.mfa_enabled) {
      return NextResponse.json(
        { error: 'MFA is not enabled for this account' },
        { status: 400 }
      );
    }

    // 現在のコードで確認
    const verifyResult = await verifyTOTP(token, mfaSecret);
    if (!verifyResult.valid) {
      logger.warn('[MFA Disable] Verification failed', {
        userId: user.id,
        reason: verifyResult.reason,
      });
      return NextResponse.json(
        { error: 'Invalid code. Please enter your current authenticator code.' },
        { status: 400 }
      );
    }

    // MFA無効化
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        mfa_enabled: false,
        mfa_secret: null,
        mfa_backup_codes: null,
        mfa_disabled_at: new Date().toISOString(),
      },
    });

    if (updateError) {
      logger.error('[MFA Disable] Failed to disable MFA', { error: updateError });
      return NextResponse.json(
        { error: 'Failed to disable MFA' },
        { status: 500 }
      );
    }

    logger.info('[MFA Disable] MFA disabled', { userId: user.id });

    return NextResponse.json({
      success: true,
      message: 'MFA has been disabled',
      mfaEnabled: false,
    });

  } catch (error) {
    logger.error('[MFA Disable] Error', { error });
    return handleApiError(error);
  }
}
