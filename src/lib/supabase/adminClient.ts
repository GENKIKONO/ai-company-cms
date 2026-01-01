/**
 * Supabase Admin Clients
 *
 * - supabaseAdmin: 型付きクライアント（単純なCRUD向け）
 * - supabaseAdminUntyped: 型なしクライアント（複雑なJOINクエリ向け）
 *
 * 型生成にないカラム (company_name, description等) を含むクエリには
 * supabaseAdminUntyped を使用する
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

const clientOptions = {
  auth: { persistSession: false },
  global: { headers: { 'X-Client-Name': 'admin-api' } },
};

// 型付きクライアント - 単純なCRUD操作に使用
export const supabaseAdmin = createClient<Database>(url, serviceKey, clientOptions);

// 型なしクライアント - 複雑なJOINクエリに使用 (company_name, description等)
export const supabaseAdminUntyped = createClient(url, serviceKey, clientOptions);
