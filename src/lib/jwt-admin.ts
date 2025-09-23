import 'server-only';
import { SignJWT, jwtVerify } from 'jose';

const adminSecret = new TextEncoder().encode(
  process.env.APPROVAL_JWT_SECRET || 'fallback-admin-secret-for-development'
);

export interface AdminTokenPayload {
  role: 'admin';
  iat: number;
  exp: number;
}

export async function signAdminJWT(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + (24 * 60 * 60); // 24時間有効

  return await new SignJWT({ role: 'admin', iat: now, exp })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .sign(adminSecret);
}

export async function verifyJWT(token: string): Promise<AdminTokenPayload> {
  try {
    const { payload } = await jwtVerify(token, adminSecret);
    const typedPayload = payload as unknown as AdminTokenPayload;
    
    if (typedPayload.role !== 'admin') {
      throw new Error('Invalid token role');
    }
    
    return typedPayload;
  } catch (error) {
    throw new Error('Invalid or expired admin token');
  }
}

export function generateAdminToken(): Promise<string> {
  return signAdminJWT();
}