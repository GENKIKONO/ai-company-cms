/**
 * Supabase Admin Client（サーバーサイド専用）
 *
 * NOTE: [CLIENT_IMPORT_CHAIN_FIX] 'server-only' パッケージはビルド時に
 * クライアントコンポーネントのインポートグラフに含まれるとエラーになる。
 * 代わりにランタイムチェックで保護し、実際にクライアントで実行された場合にのみエラーにする。
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// ランタイムでサーバーサイドのみ許可（ビルド時は通過）
const assertServerOnly = () => {
  if (typeof window !== 'undefined') {
    throw new Error(
      'supabaseAdmin can only be used on the server side. ' +
      'Do not import this module in client components.'
    );
  }
};

// サーバーサイド環境変数（クライアントでは undefined）
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 遅延初期化でサーバーサイドのみ実行
let _supabaseAdmin: SupabaseClient<any> | null = null;

const getSupabaseAdminClient = (): SupabaseClient<any> => {
  assertServerOnly();

  if (!_supabaseAdmin) {
    if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
    if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');

    _supabaseAdmin = createClient<any>(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  return _supabaseAdmin;
};

// Proxy を使用して、アクセス時にランタイムチェックを行う
// これにより、インポートだけではエラーにならず、実際に使用した時のみエラーになる
export const supabaseAdmin: SupabaseClient<any> = new Proxy({} as SupabaseClient<any>, {
  get(_, prop) {
    const client = getSupabaseAdminClient();
    const value = (client as any)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});