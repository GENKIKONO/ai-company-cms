import { SignJWT, jwtVerify } from 'jose';
import { APP_URL } from '@/lib/utils/env';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-key-for-development'
);

export interface ApprovalTokenPayload {
  organizationId: string;
  action: 'approve' | 'reject';
  email: string;
  partnerName?: string;
  iat: number;
  exp: number;
}

export async function signApprovalToken(payload: Omit<ApprovalTokenPayload, 'iat' | 'exp'>): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + (15 * 60); // 15分後に期限切れ

  return await new SignJWT({ ...payload, iat: now, exp })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .sign(secret);
}

export async function verifyApprovalToken(token: string): Promise<ApprovalTokenPayload> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as ApprovalTokenPayload;
  } catch (error) {
    throw new Error('無効または期限切れのトークンです');
  }
}

export function generateApprovalUrl(token: string, action: 'approve' | 'reject'): string {
  return `${APP_URL}/api/approval/${action}?token=${token}`;
}