/**
 * MFA（多要素認証）- TOTP実装
 *
 * Google Authenticator, Authy, 1Password等と互換
 *
 * 使用方法:
 * 1. セットアップ: generateTOTPSecret() でシークレット生成
 * 2. QRコード: generateQRCode() でユーザーに表示
 * 3. 検証: verifyTOTP() でコード検証
 * 4. バックアップコード: generateBackupCodes() で緊急用コード生成
 */

import { OTP, generateSecret } from 'otplib';
import QRCode from 'qrcode';

// アプリ名（QRコードに表示）
const APP_NAME = 'AIOHub';

// バックアップコードの数
const BACKUP_CODE_COUNT = 10;

// OTP インスタンス（TOTP mode）
const otp = new OTP();

export interface TOTPSetupResult {
  secret: string;
  otpauthUrl: string;
  qrCodeDataUrl: string;
  backupCodes: string[];
}

export interface TOTPVerifyResult {
  valid: boolean;
  reason: string;
}

/**
 * TOTPシークレットを生成
 */
export function generateTOTPSecret(): string {
  return generateSecret();
}

/**
 * OTPAuth URLを生成
 */
export function generateOTPAuthUrl(secret: string, userEmail: string): string {
  return otp.generateURI({
    secret,
    label: userEmail,
    issuer: APP_NAME,
    algorithm: 'sha1',
    digits: 6,
    period: 30,
  });
}

/**
 * QRコードを生成（Data URL形式）
 */
export async function generateQRCode(otpauthUrl: string): Promise<string> {
  try {
    return await QRCode.toDataURL(otpauthUrl, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
  } catch (error) {
    throw new Error('QR code generation failed');
  }
}

/**
 * バックアップコードを生成
 */
export function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
    // 8文字のランダムコード（英数字）
    const array = new Uint8Array(4);
    crypto.getRandomValues(array);
    const code = Array.from(array)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
    codes.push(code);
  }
  return codes;
}

/**
 * バックアップコードをハッシュ化（保存用）
 */
export async function hashBackupCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code.toUpperCase());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * MFAセットアップを開始
 */
export async function setupMFA(userEmail: string): Promise<TOTPSetupResult> {
  const secret = generateTOTPSecret();
  const otpauthUrl = generateOTPAuthUrl(secret, userEmail);
  const qrCodeDataUrl = await generateQRCode(otpauthUrl);
  const backupCodes = generateBackupCodes();

  return {
    secret,
    otpauthUrl,
    qrCodeDataUrl,
    backupCodes,
  };
}

/**
 * TOTPコードを検証
 */
export async function verifyTOTP(token: string, secret: string): Promise<TOTPVerifyResult> {
  if (!token || token.length !== 6) {
    return { valid: false, reason: 'Invalid token format' };
  }

  if (!secret) {
    return { valid: false, reason: 'MFA not configured' };
  }

  try {
    const result = await otp.verify({
      secret,
      token,
      algorithm: 'sha1',
      digits: 6,
      period: 30,
    });

    const isValid = result.valid;
    return {
      valid: isValid,
      reason: isValid ? 'Valid token' : 'Invalid or expired token',
    };
  } catch (error) {
    return { valid: false, reason: 'Verification error' };
  }
}

/**
 * バックアップコードを検証
 */
export async function verifyBackupCode(
  inputCode: string,
  hashedCodes: string[]
): Promise<{ valid: boolean; usedIndex: number }> {
  const inputHash = await hashBackupCode(inputCode);

  for (let i = 0; i < hashedCodes.length; i++) {
    if (hashedCodes[i] === inputHash) {
      return { valid: true, usedIndex: i };
    }
  }

  return { valid: false, usedIndex: -1 };
}

/**
 * 現在のTOTPコードを生成（テスト用）
 */
export async function generateCurrentTOTP(secret: string): Promise<string> {
  return otp.generate({
    secret,
    algorithm: 'sha1',
    digits: 6,
    period: 30,
  });
}
