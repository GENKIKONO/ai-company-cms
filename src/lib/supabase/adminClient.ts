/**
 * Typed Supabase Admin Client
 *
 * Database型を適用したサーバーサイド専用クライアント
 * as any キャストなしで型安全なDB操作が可能
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// 環境変数チェック
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
}
if (!serviceKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
}

export const supabaseAdmin = createClient<Database>(
  url,
  serviceKey,
  {
    auth: { persistSession: false },
    global: { headers: { 'X-Client-Name': 'admin-api' } },
  }
);
