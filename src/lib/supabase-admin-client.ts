import 'server-only';
import { createClient } from '@supabase/supabase-js';
// TODO: [SUPABASE_TYPE_FOLLOWUP] Supabase Database 型定義を再構築後に復元する

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');

// 管理操作用（サーバー専用）
export const supabaseAdmin = createClient<any>(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});