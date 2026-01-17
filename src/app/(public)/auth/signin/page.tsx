import { permanentRedirect } from 'next/navigation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * /auth/signin は廃止されました。
 * 308 Permanent Redirect で /auth/login へ転送します。
 * UI/フォーム/クライアント認証処理は禁止。
 */
export default function SignInRedirect() {
  permanentRedirect('/auth/login');
}