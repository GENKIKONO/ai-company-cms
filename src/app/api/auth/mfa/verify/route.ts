/**
 * MFA Verify API
 * POST /api/auth/mfa/verify - TOTPコード検証
 *
 * リクエスト:
 * - token: 6桁のTOTPコード
 * - action: 'setup' | 'login' - セットアップ確認 or ログイン時検証
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyTOTP, verifyBackupCode } from '@/lib/security/mfa';
import { handleApiError, validationError } from '@/lib/api/error-responses';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';

const verifySchema = z.object({
  token: z.string().min(1, 'Token is required'),
  action: z.enum(['setup', 'login']).default('login'),
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
    const validation = verifySchema.safeParse(body);
    if (!validation.success) {
      return validationError(validation.error.flatten().fieldErrors);
    }

    const { token, action } = validation.data;
    const userMetadata = user.user_metadata || {};

    // セットアップ確認フロー
    if (action === 'setup') {
      const pendingSecret = userMetadata.mfa_pending_secret;
      if (!pendingSecret) {
        return NextResponse.json(
          { error: 'No pending MFA setup found. Start setup first.' },
          { status: 400 }
        );
      }

      // TOTP検証
      const verifyResult = await verifyTOTP(token, pendingSecret);
      if (!verifyResult.valid) {
        logger.warn('[MFA Verify] Setup verification failed', {
          userId: user.id,
          reason: verifyResult.reason,
        });
        return NextResponse.json(
          { error: 'Invalid code. Please try again.' },
          { status: 400 }
        );
      }

      // セットアップ完了 - シークレットを確定
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          mfa_enabled: true,
          mfa_secret: pendingSecret,
          mfa_backup_codes: userMetadata.mfa_pending_backup_codes,
          mfa_enabled_at: new Date().toISOString(),
          // 一時データ削除
          mfa_pending_secret: null,
          mfa_pending_backup_codes: null,
          mfa_setup_started_at: null,
        },
      });

      if (updateError) {
        logger.error('[MFA Verify] Failed to enable MFA', { error: updateError });
        return NextResponse.json(
          { error: 'Failed to enable MFA' },
          { status: 500 }
        );
      }

      logger.info('[MFA Verify] MFA enabled successfully', { userId: user.id });

      return NextResponse.json({
        success: true,
        message: 'MFA has been enabled successfully',
        mfaEnabled: true,
      });
    }

    // ログイン時検証フロー
    const mfaSecret = userMetadata.mfa_secret;
    const backupCodes = userMetadata.mfa_backup_codes || [];

    if (!mfaSecret) {
      return NextResponse.json(
        { error: 'MFA is not enabled for this account' },
        { status: 400 }
      );
    }

    // TOTP検証
    const verifyResult = await verifyTOTP(token, mfaSecret);
    if (verifyResult.valid) {
      logger.info('[MFA Verify] Login verification successful', { userId: user.id });
      return NextResponse.json({
        success: true,
        message: 'MFA verification successful',
      });
    }

    // バックアップコード検証（TOTPが失敗した場合）
    if (token.length === 8) {
      const backupResult = await verifyBackupCode(token, backupCodes);
      if (backupResult.valid) {
        // 使用済みコードを削除
        const updatedCodes = [...backupCodes];
        updatedCodes.splice(backupResult.usedIndex, 1);

        await supabase.auth.updateUser({
          data: {
            mfa_backup_codes: updatedCodes,
            mfa_backup_code_used_at: new Date().toISOString(),
          },
        });

        logger.info('[MFA Verify] Backup code used', {
          userId: user.id,
          remainingCodes: updatedCodes.length,
        });

        return NextResponse.json({
          success: true,
          message: 'Backup code verified',
          warning: `You have ${updatedCodes.length} backup codes remaining`,
        });
      }
    }

    logger.warn('[MFA Verify] Login verification failed', {
      userId: user.id,
      reason: verifyResult.reason,
    });

    return NextResponse.json(
      { error: 'Invalid code. Please try again.' },
      { status: 400 }
    );

  } catch (error) {
    logger.error('[MFA Verify] Error', { error });
    return handleApiError(error);
  }
}
