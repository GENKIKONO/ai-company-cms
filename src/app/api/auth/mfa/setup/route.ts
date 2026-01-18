/**
 * MFA Setup API
 * POST /api/auth/mfa/setup - MFAセットアップ開始
 *
 * レスポンス:
 * - secret: TOTPシークレット（DB保存用）
 * - qrCodeDataUrl: QRコード画像（Base64）
 * - backupCodes: バックアップコード（ユーザー保存用）
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { setupMFA, hashBackupCode } from '@/lib/security/mfa';
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

    // MFAセットアップ
    const mfaSetup = await setupMFA(user.email || user.id);

    // バックアップコードをハッシュ化
    const hashedBackupCodes = await Promise.all(
      mfaSetup.backupCodes.map(code => hashBackupCode(code))
    );

    // user_metadataに一時保存（確認完了まで）
    // 本番では別テーブル推奨
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        mfa_pending_secret: mfaSetup.secret,
        mfa_pending_backup_codes: hashedBackupCodes,
        mfa_setup_started_at: new Date().toISOString(),
      },
    });

    if (updateError) {
      logger.error('[MFA Setup] Failed to save pending secret', { error: updateError });
      return NextResponse.json(
        { error: 'Failed to initiate MFA setup' },
        { status: 500 }
      );
    }

    logger.info('[MFA Setup] Setup initiated', { userId: user.id });

    return NextResponse.json({
      success: true,
      qrCodeDataUrl: mfaSetup.qrCodeDataUrl,
      backupCodes: mfaSetup.backupCodes, // 初回のみ平文で返す
      message: 'Scan the QR code with your authenticator app, then verify with a code',
    });

  } catch (error) {
    logger.error('[MFA Setup] Error', { error });
    return handleApiError(error);
  }
}
