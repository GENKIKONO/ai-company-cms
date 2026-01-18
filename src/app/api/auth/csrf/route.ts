/**
 * CSRF Token API
 * GET /api/auth/csrf - CSRFトークンを取得
 */

import { handleGetCSRFToken } from '@/lib/security/csrf';

export const dynamic = 'force-dynamic';

export async function GET() {
  return handleGetCSRFToken();
}
